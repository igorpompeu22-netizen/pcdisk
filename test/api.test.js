import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { perguntar } from '../server/rights.js';
import { braille, cnpjValido } from '../server/documents.js';

let server;
let app;
let base;
let dir;
const ADMIN = 'teste-admin';

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rotalivre-'));
  app = createApp({ dataDir: dir, adminToken: ADMIN });
  await new Promise((r) => {
    server = app.listen(0, r);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  app.locals.store.flush();
  server.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

async function req(p, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body && JSON.stringify(body) });
  const type = res.headers.get('content-type') ?? '';
  return { status: res.status, body: type.includes('json') ? await res.json() : await res.text() };
}

const FOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('lista locais com semáforo para o perfil', async () => {
  const { body } = await req('/api/locais?perfil=cadeirante');
  const sabor = body.find((l) => l.id === 'loc-sabor');
  assert.equal(sabor.compat.nivel, 'compativel');
  assert.equal(sabor.selo.nivel, 2);
  assert.equal(body.find((l) => l.id === 'loc-blA').compat.nivel, 'incompativel');
});

test('fluxo completo de barreira: registro → moderação → resposta → documento', async () => {
  const criado = await req('/api/barreiras', { method: 'POST', body: { categoria: 'rampa', localId: 'loc-sabor', descricao: 'Rampa bloqueada por mesas na calçada.', foto: FOTO, confirmado: true } });
  assert.equal(criado.status, 201);
  const { protocolo, chave } = criado.body;
  assert.match(protocolo, /^RL-\d{4}-\d{6}$/);
  assert.equal(criado.body.status, 'em_moderacao');
  assert.ok(criado.body.foto.startsWith('/uploads/'));

  // Pendente não aparece publicamente
  assert.ok(!(await req('/api/barreiras')).body.some((b) => b.protocolo === protocolo));
  assert.equal((await req('/api/moderacao')).status, 401);

  const mod = await req(`/api/moderacao/barreiras/${protocolo}`, { method: 'POST', headers: { 'X-Admin-Token': ADMIN }, body: { decisao: 'aprovar' } });
  assert.equal(mod.body.status, 'aberto');
  assert.ok(mod.body.prazoEm);

  // O estabelecimento vê o registro, sem dados de quem relatou
  const me = await req('/api/empresa/me', { headers: { Authorization: 'Bearer demo-sabor' } });
  const visto = me.body.barreiras.find((b) => b.protocolo === protocolo);
  assert.ok(visto);
  assert.equal(visto.chaveHash, undefined);
  assert.equal(visto.geo, undefined);

  const resp = await req(`/api/empresa/barreiras/${protocolo}/resposta`, { method: 'POST', headers: { Authorization: 'Bearer demo-sabor' }, body: { texto: 'Mesas retiradas da rampa.', resolvido: true } });
  assert.equal(resp.body.status, 'resolvido');

  const acompanhar = await req('/api/barreiras/acompanhar', { method: 'POST', body: { itens: [{ protocolo, chave }, { protocolo, chave: 'errada' }] } });
  assert.equal(acompanhar.body.length, 1);
  assert.equal(acompanhar.body[0].status, 'resolvido');

  const doc = await req(`/api/barreiras/${protocolo}/documento`);
  assert.match(doc.body.documento, /NBR 9050/);
  assert.match(doc.body.documento, /LBI \(Lei 13\.146\/2015\) art\. 57/);
});

test('registro exige confirmação, local e descrição', async () => {
  assert.equal((await req('/api/barreiras', { method: 'POST', body: { categoria: 'rampa', localId: 'loc-sabor', descricao: 'Rampa bloqueada agora.' } })).status, 400);
  assert.equal((await req('/api/barreiras', { method: 'POST', body: { categoria: 'rampa', descricao: 'Rampa bloqueada agora.', confirmado: true } })).status, 400);
  assert.equal((await req('/api/barreiras', { method: 'POST', body: { categoria: 'xx', localId: 'loc-sabor', descricao: 'Rampa bloqueada agora.', confirmado: true } })).status, 400);
});

test('painel em tempo real: atualizar status muda a rota', async () => {
  let r = await req('/api/rota?de=portaria&para=blA2&perfil=cadeirante');
  assert.equal(r.body.encontrada, false);
  await req('/api/equipamentos/eq-elev-a/status', { method: 'POST', body: { status: 'funcionando' } });
  r = await req('/api/rota?de=portaria&para=blA2&perfil=cadeirante');
  assert.equal(r.body.encontrada, true);
  assert.ok(r.body.passos.some((p) => p.tipo === 'elevador'));
  assert.equal((await req('/api/equipamentos/eq-elev-a/status', { method: 'POST', body: { status: 'quebrado' } })).status, 400);
});

test('cadastro de estabelecimento valida CNPJ e termo, e a autodeclaração vai para revisão', async () => {
  const dados = { nome: 'Loja Teste', razaoSocial: 'Loja Teste Ltda', cnpj: '11.222.333/0001-81', responsavel: 'Fulana', email: 'a@b.com', aceiteTermo: true };
  assert.equal((await req('/api/estabelecimentos', { method: 'POST', body: { ...dados, cnpj: '11.111.111/1111-11' } })).status, 400);
  assert.equal((await req('/api/estabelecimentos', { method: 'POST', body: { ...dados, aceiteTermo: false } })).status, 400);
  const c = await req('/api/estabelecimentos', { method: 'POST', body: dados });
  assert.equal(c.status, 201);
  const auth = { Authorization: `Bearer ${c.body.token}` };
  const put = await req(`/api/empresa/locais/${c.body.id}/itens`, { method: 'PUT', headers: auth, body: { aceiteTermo: true, itens: { entrada: true, banheiro: false, elevador: 'na' } } });
  assert.equal(put.status, 200);
  const detalhe = await req(`/api/locais/${c.body.id}?perfil=cadeirante`);
  assert.equal(detalhe.body.selo.nivel, 0);
  assert.equal(detalhe.body.compat.nivel, 'incompativel');
  // Não pode editar local de outro estabelecimento
  assert.equal((await req('/api/empresa/locais/loc-sabor/itens', { method: 'PUT', headers: auth, body: { aceiteTermo: true, itens: {} } })).status, 403);
  await req(`/api/moderacao/locais/${c.body.id}/revisar`, { method: 'POST', headers: { 'X-Admin-Token': ADMIN } });
  assert.equal((await req(`/api/locais/${c.body.id}`)).body.selo.nivel, 1);
});

test('confirmação da comunidade com foto', async () => {
  const r = await req('/api/locais/loc-ru/confirmacoes', { method: 'POST', body: { item: 'banheiro', valor: 'contesta', foto: FOTO } });
  assert.equal(r.status, 201);
  const l = await req('/api/locais/loc-ru');
  assert.equal(l.body.itens.banheiro.contestam, 3);
});

test('QR, placa em braille, eventos, direitos e indicadores', async () => {
  const qr = await req('/api/locais/loc-sabor/qr.svg');
  assert.match(qr.body, /<svg/);
  const placa = await req('/api/locais/loc-sabor/placa');
  assert.ok(placa.body.braille.startsWith('⠨⠗⠑⠎'));
  const ev = await req('/api/eventos', { method: 'POST', body: { titulo: 'Palestra', organizador: 'CA', data: '2099-01-01', checklist: { libras: true, legendas: true, local_acessivel: true, banheiro: true } } });
  assert.equal(ev.body.selo.nivel, 'bronze');
  const d = await req('/api/direitos/perguntar', { method: 'POST', body: { pergunta: 'o elevador está parado, o que faço?' } });
  assert.equal(d.body.id, 'elevador-parado');
  await req('/api/testes', { method: 'POST', body: { entendeuSemaforo: true, registrouSemAjuda: false, prefereVerificada: true, mudariaDecisao: true } });
  const ind = await req('/api/indicadores');
  assert.equal(ind.body.participantes, 1);
  assert.equal(ind.body.registroSemAjuda, 0);
});

test('utilitários', () => {
  assert.equal(perguntar('fui carregado no colo, é discriminação?').id, 'discriminacao');
  assert.equal(perguntar('qwerty').encontrou, false);
  assert.equal(braille('Bloco 2'), '⠨⠃⠇⠕⠉⠕ ⠼⠃');
  assert.equal(cnpjValido('45.723.174/0001-10'), true);
  assert.equal(cnpjValido('45.723.174/0001-11'), false);
});
