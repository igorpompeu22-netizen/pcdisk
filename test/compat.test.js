import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoItem, compatibilidade, selo, seloEvento } from '../server/compat.js';

const agora = Date.parse('2026-10-06T12:00:00Z');
const dias = (n) => new Date(agora - n * 864e5).toISOString();

const local = {
  id: 'l1',
  revisado: true,
  itens: {
    entrada: { declarado: true, em: dias(10) },
    porta: { declarado: true, em: dias(10) },
    circulacao: { declarado: true, em: dias(10) },
    elevador: { declarado: true, em: dias(10) },
    banheiro: { declarado: true, em: dias(10) },
    rampa: { declarado: true, em: dias(10) },
    balcao: { declarado: true, em: dias(10) },
    mesa: { declarado: true, em: dias(10) },
    vaga: { declarado: 'na', em: dias(10) },
  },
};

test('autodeclaração sem votos vale como origem', () => {
  const e = estadoItem(local, 'entrada', { agora });
  assert.equal(e.valor, true);
  assert.equal(e.origem, 'autodeclaracao');
  assert.equal(e.antiga, false);
});

test('contestação majoritária da comunidade derruba o item', () => {
  const confirmacoes = [
    { localId: 'l1', item: 'banheiro', valor: 'contesta', criadoEm: dias(1) },
    { localId: 'l1', item: 'banheiro', valor: 'contesta', criadoEm: dias(2) },
    { localId: 'l1', item: 'banheiro', valor: 'confirma', criadoEm: dias(3) },
  ];
  const e = estadoItem(local, 'banheiro', { confirmacoes, agora });
  assert.equal(e.valor, false);
  assert.equal(e.origem, 'comunidade');
  const c = compatibilidade(local, 'cadeirante', { confirmacoes, agora });
  assert.equal(c.nivel, 'incompativel');
});

test('equipamento parado agora torna o local incompatível para cadeirante', () => {
  const equipamentos = [{ id: 'e', nome: 'Elevador', localId: 'l1', item: 'elevador', status: 'parado', atualizadoEm: dias(0) }];
  const c = compatibilidade(local, 'cadeirante', { equipamentos, agora });
  assert.equal(c.nivel, 'incompativel');
  assert.match(c.motivos[0], /Elevador: parado agora/);
});

test('tudo declarado e confirmado = compatível, com resumo de confirmações', () => {
  const confirmacoes = ['entrada', 'banheiro'].flatMap((item) => [1, 2, 3].map((n) => ({ localId: 'l1', item, valor: 'confirma', criadoEm: dias(n) })));
  const c = compatibilidade(local, 'cadeirante', { confirmacoes, agora });
  assert.equal(c.nivel, 'compativel');
  assert.match(c.resumo, /confirmado\(s\) por 3 usuário\(s\) ontem/);
});

test('item essencial sem informação = parcial', () => {
  const l = { ...local, itens: { ...local.itens, banheiro: undefined } };
  delete l.itens.banheiro;
  assert.equal(compatibilidade(l, 'cadeirante', { agora }).nivel, 'parcial');
});

test('informação com mais de 30 dias é sinalizada', () => {
  const l = { id: 'l2', itens: { entrada: { declarado: true, em: dias(45) } } };
  assert.equal(estadoItem(l, 'entrada', { agora }).antiga, true);
});

test('auditoria prevalece até a comunidade contestar depois dela', () => {
  const l = { ...local, auditoria: { em: dias(5), itens: { rampa: false } } };
  assert.equal(estadoItem(l, 'rampa', { agora }).origem, 'auditoria');
  assert.equal(estadoItem(l, 'rampa', { agora }).valor, false);
});

test('selos de local e de evento', () => {
  assert.equal(selo({ ...local, revisado: false }, [], agora).nivel, 0);
  assert.equal(selo(local, [], agora).nivel, 1);
  const conf = [1, 2, 3].map((n) => ({ localId: 'l1', valor: 'confirma', criadoEm: dias(n) }));
  assert.equal(selo(local, conf, agora).nivel, 2);
  assert.equal(selo({ ...local, auditoria: { em: dias(1), itens: {} } }, [], agora).nivel, 3);
  assert.equal(seloEvento({}).nivel, 'sem_selo');
  assert.equal(seloEvento({ local_acessivel: true, banheiro: true, assentos: true, libras: true, legendas: true, audiodescricao: true, material: true, inscricao: true, palco: true }).nivel, 'ouro');
});
