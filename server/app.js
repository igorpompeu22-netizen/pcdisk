import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

import { createStore, newId, newToken, hashToken } from './store.js';
import { seed } from './seed.js';
import { ITENS, PERFIS, ORIGENS, CATEGORIAS_BARREIRA, CANAIS, CHECKLIST_EVENTO, DIAS_INFO_ANTIGA, DIAS_PRAZO_RESPOSTA } from './catalog.js';
import { estadosDoLocal, compatibilidade, selo, seloEvento } from './compat.js';
import { NOS, ARESTAS } from './campus.js';
import { calcularRota, situacaoTrechos, comprimento } from './routing.js';
import { DIREITOS, perguntar } from './rights.js';
import { documentoBarreira, braille, cnpjValido } from './documents.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DIA = 24 * 60 * 60 * 1000;
const STATUS_EQUIP = ['funcionando', 'parado', 'interditado', 'manutencao'];
const MAX_FOTO_BYTES = 3 * 1024 * 1024;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const falha = (status, msg) => {
  throw new HttpError(status, msg);
};
const texto = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function createApp({ dataDir, adminToken = process.env.ADMIN_TOKEN || 'admin-demo', semSeed = false } = {}) {
  const store = createStore(dataDir, semSeed ? null : seed);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '6mb' }));

  // ---------- Tempo real (Server-Sent Events) ----------
  const clientes = new Set();
  function emitir(tipo, dados) {
    const msg = `event: ${tipo}\ndata: ${JSON.stringify(dados)}\n\n`;
    for (const res of clientes) res.write(msg);
  }
  app.get('/api/stream', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    res.write('retry: 5000\n\n');
    clientes.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => {
      clearInterval(ping);
      clientes.delete(res);
    });
  });

  // ---------- Limite simples de requisições de escrita ----------
  const janelas = new Map();
  app.use((req, res, next) => {
    if (req.method === 'GET') return next();
    const chave = req.ip;
    const agora = Date.now();
    const j = janelas.get(chave) ?? { inicio: agora, n: 0 };
    if (agora - j.inicio > 60000) Object.assign(j, { inicio: agora, n: 0 });
    j.n += 1;
    janelas.set(chave, j);
    if (j.n > 60) return res.status(429).json({ erro: 'Muitas requisições. Aguarde um minuto.' });
    next();
  });

  // ---------- Auxiliares ----------
  const ctx = () => ({ confirmacoes: store.all('confirmacoes'), equipamentos: store.all('equipamentos') });
  const trechoNome = (id) => ARESTAS.find((a) => a.id === id)?.nome;

  function salvarFoto(dataUrl) {
    if (!dataUrl) return null;
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!m) falha(400, 'Foto inválida. Envie uma imagem JPEG, PNG ou WebP.');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_FOTO_BYTES) falha(413, 'Foto muito grande (máximo de 3 MB).');
    const nome = `${newId()}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
    fs.writeFileSync(path.join(store.uploadsDir, nome), buf);
    return `/uploads/${nome}`;
  }

  function resumoLocal(l, perfil) {
    const c = ctx();
    const estados = estadosDoLocal(l, c);
    const compat = compatibilidade(l, perfil, { ...c, estados });
    const abertas = store.all('barreiras').filter((b) => b.localId === l.id && b.moderacao === 'aprovado' && b.status !== 'resolvido').length;
    const ultima = Object.values(estados).map((e) => e.ultimaVerificacao).filter(Boolean).sort().at(-1) ?? null;
    return {
      id: l.id, nome: l.nome, tipo: l.tipo, categoria: l.categoria, descricao: l.descricao, no: l.no,
      compat, selo: selo(l, c.confirmacoes), barreirasAbertas: abertas, ultimaVerificacao: ultima,
      antiga: !ultima || Date.now() - Date.parse(ultima) > DIAS_INFO_ANTIGA * DIA,
    };
  }

  function publicaBarreira(b, { completo = false } = {}) {
    const local = b.localId ? store.get('locais', b.localId) : null;
    const vencido = b.status === 'aberto' && b.prazoEm && Date.parse(b.prazoEm) < Date.now();
    const out = {
      protocolo: b.protocolo, localId: b.localId, localNome: local?.nome ?? null, trecho: b.trecho, trechoNome: trechoNome(b.trecho) ?? null,
      categoria: b.categoria, categoriaNome: CATEGORIAS_BARREIRA[b.categoria]?.nome, descricao: b.descricao, foto: b.foto,
      status: b.status, moderacao: b.moderacao, criadoEm: b.criadoEm, enviadoEm: b.enviadoEm ?? null, prazoEm: b.prazoEm ?? null,
      vencido, normas: CATEGORIAS_BARREIRA[b.categoria]?.normas ?? [], historico: b.historico,
    };
    if (completo) out.canais = vencido || b.status === 'respondido' ? CANAIS : [];
    return out;
  }

  function empresaAuth(req) {
    const token = (req.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) falha(401, 'Informe o código de acesso do estabelecimento.');
    const local = store.all('locais').find((l) => l.tokenHash === hashToken(token));
    if (!local) falha(401, 'Código de acesso inválido.');
    // A gestão do campus administra todos os locais do tipo "campus" com o mesmo código.
    const locais = store.all('locais').filter((l) => l.tokenHash === local.tokenHash);
    return { local, locais };
  }

  function adminAuth(req) {
    if (req.get('x-admin-token') !== adminToken) falha(401, 'Acesso restrito à moderação.');
  }

  const rota = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (e) {
      next(e);
    }
  };

  // ---------- Catálogo e campus ----------
  app.get('/api/catalogo', (req, res) => {
    res.json({ itens: ITENS, perfis: PERFIS, origens: ORIGENS, categorias: CATEGORIAS_BARREIRA, canais: CANAIS, checklistEvento: CHECKLIST_EVENTO, diasInfoAntiga: DIAS_INFO_ANTIGA, diasPrazo: DIAS_PRAZO_RESPOSTA });
  });

  app.get('/api/campus', (req, res) => {
    const situacao = situacaoTrechos(store.all('equipamentos'), store.all('barreiras'));
    res.json({
      nos: NOS,
      arestas: ARESTAS.map((a) => ({ ...a, metros: comprimento(a), situacao: situacao[a.id] })),
      locais: store.all('locais').map((l) => ({ id: l.id, nome: l.nome, no: l.no })),
    });
  });

  // ---------- Painel em tempo real ----------
  app.get('/api/equipamentos', (req, res) => {
    const ordem = { parado: 0, interditado: 1, manutencao: 2, funcionando: 3 };
    const lista = store.all('equipamentos').map((e) => ({
      ...e, historico: e.historico.slice(-5), localNome: e.localId ? store.get('locais', e.localId)?.nome : null,
    }));
    lista.sort((a, b) => ordem[a.status] - ordem[b.status] || a.nome.localeCompare(b.nome));
    res.json(lista);
  });

  app.post('/api/equipamentos/:id/status', rota((req, res) => {
    const e = store.get('equipamentos', req.params.id) ?? falha(404, 'Equipamento não encontrado.');
    const status = req.body?.status;
    if (!STATUS_EQUIP.includes(status)) falha(400, 'Status inválido.');
    const gestao = req.get('x-admin-token') === adminToken;
    const obs = texto(req.body?.obs, 280);
    const em = new Date().toISOString();
    Object.assign(e, { status, obs, atualizadoEm: em, fonte: gestao ? 'gestao' : 'comunidade', confirmacoes: 1 });
    e.historico.push({ status, em, fonte: e.fonte, obs });
    store.save();
    emitir('equipamento', e);
    res.json(e);
  }));

  app.post('/api/equipamentos/:id/confirmar', rota((req, res) => {
    const e = store.get('equipamentos', req.params.id) ?? falha(404, 'Equipamento não encontrado.');
    e.confirmacoes = (e.confirmacoes ?? 0) + 1;
    e.atualizadoEm = new Date().toISOString();
    store.save();
    emitir('equipamento', e);
    res.json(e);
  }));

  // ---------- Locais ----------
  app.get('/api/locais', (req, res) => {
    const q = texto(req.query.q, 80).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const perfil = texto(req.query.perfil, 40);
    let lista = store.all('locais');
    if (q) lista = lista.filter((l) => `${l.nome} ${l.categoria} ${l.descricao}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q));
    res.json(lista.map((l) => resumoLocal(l, perfil)));
  });

  app.get('/api/locais/:id', rota((req, res) => {
    const l = store.get('locais', req.params.id) ?? falha(404, 'Local não encontrado.');
    const c = ctx();
    const estados = estadosDoLocal(l, c);
    const confirmacoes = c.confirmacoes
      .filter((x) => x.localId === l.id)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .slice(0, 20)
      .map(({ item, valor, nota, foto, criadoEm }) => ({ item, valor, nota, foto, criadoEm }));
    res.json({
      ...resumoLocal(l, texto(req.query.perfil, 40)),
      andares: l.andares,
      responsavel: { razaoSocial: l.estabelecimento?.razaoSocial, responsavel: l.estabelecimento?.responsavel },
      declaradoEm: Object.values(l.itens ?? {}).map((i) => i.em).sort().at(-1) ?? null,
      auditoria: l.auditoria ? { em: l.auditoria.em, auditor: l.auditoria.auditor } : null,
      itens: estados,
      confirmacoes,
      equipamentos: c.equipamentos.filter((e) => e.localId === l.id),
      interno: l.interno ?? [],
      barreiras: store.all('barreiras').filter((b) => b.localId === l.id && b.moderacao === 'aprovado').map((b) => publicaBarreira(b)),
    });
  }));

  app.post('/api/locais/:id/confirmacoes', rota((req, res) => {
    const l = store.get('locais', req.params.id) ?? falha(404, 'Local não encontrado.');
    const { item, valor } = req.body ?? {};
    if (!ITENS[item]) falha(400, 'Item inválido.');
    if (!['confirma', 'contesta'].includes(valor)) falha(400, 'Escolha confirmar ou contestar.');
    const foto = salvarFoto(req.body.foto);
    const c = store.insert('confirmacoes', { localId: l.id, item, valor, nota: texto(req.body.nota, 280), foto });
    emitir('local', { id: l.id });
    res.status(201).json(c);
  }));

  app.get('/api/locais/:id/qr.svg', rota(async (req, res) => {
    const l = store.get('locais', req.params.id) ?? falha(404, 'Local não encontrado.');
    const base = `${req.protocol}://${req.get('host')}`;
    const svg = await QRCode.toString(`${base}/#/chegada/${l.id}`, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
    res.type('image/svg+xml').send(svg);
  }));

  app.get('/api/locais/:id/placa', rota((req, res) => {
    const l = store.get('locais', req.params.id) ?? falha(404, 'Local não encontrado.');
    const titulo = `${l.nome}. Aponte a câmera ou aproxime o celular para abrir o trajeto interno.`;
    res.json({ nome: l.nome, braille: braille(l.nome), brailleInstrucao: braille('Rota Livre: trajeto interno no app'), audio: [titulo, ...(l.interno ?? [])].join(' ') });
  }));

  // ---------- Rotas acessíveis ----------
  app.get('/api/rota', rota((req, res) => {
    const r = calcularRota({
      de: texto(req.query.de, 40), para: texto(req.query.para, 40), perfil: texto(req.query.perfil, 40),
      equipamentos: store.all('equipamentos'), barreiras: store.all('barreiras'),
    });
    res.json(r);
  }));

  // ---------- Registro de barreiras ----------
  app.post('/api/barreiras', rota((req, res) => {
    const b = req.body ?? {};
    if (!CATEGORIAS_BARREIRA[b.categoria]) falha(400, 'Escolha o tipo de barreira.');
    const local = b.localId ? store.get('locais', b.localId) : null;
    if (b.localId && !local) falha(400, 'Local não encontrado.');
    const trecho = b.trecho && ARESTAS.some((a) => a.id === b.trecho) ? b.trecho : null;
    if (!local && !trecho) falha(400, 'Diga onde está a barreira: um local ou um trecho do campus.');
    const descricao = texto(b.descricao, 1500);
    if (descricao.length < 10) falha(400, 'Descreva a barreira em pelo menos 10 caracteres.');
    if (b.confirmado !== true) falha(400, 'Confirme o envio do registro.');
    let geo = null;
    if (b.geo && Number.isFinite(b.geo.lat) && Number.isFinite(b.geo.lng)) geo = { lat: b.geo.lat, lng: b.geo.lng };
    const foto = salvarFoto(b.foto);
    const chave = newToken();
    const agora = new Date().toISOString();
    const reg = store.insert('barreiras', {
      protocolo: store.nextProtocolo(), chaveHash: hashToken(chave), localId: local?.id ?? null, trecho,
      categoria: b.categoria, descricao, foto, geo, moderacao: 'pendente', status: 'em_moderacao',
      historico: [{ em: agora, status: 'em_moderacao', texto: 'Registro recebido. A moderação confere se a foto não expõe terceiros e se o relato é consistente.' }],
    });
    emitir('barreira', { protocolo: reg.protocolo });
    res.status(201).json({ ...publicaBarreira(reg, { completo: true }), chave });
  }));

  app.get('/api/barreiras', (req, res) => {
    const localId = texto(req.query.localId, 40);
    res.json(
      store.all('barreiras')
        .filter((b) => b.moderacao === 'aprovado' && (!localId || b.localId === localId))
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
        .map((b) => publicaBarreira(b)),
    );
  });

  app.post('/api/barreiras/acompanhar', rota((req, res) => {
    const itens = Array.isArray(req.body?.itens) ? req.body.itens.slice(0, 50) : [];
    const out = [];
    for (const { protocolo, chave } of itens) {
      const b = store.all('barreiras').find((x) => x.protocolo === protocolo && x.chaveHash === hashToken(chave));
      if (b) out.push(publicaBarreira(b, { completo: true }));
    }
    res.json(out);
  }));

  app.get('/api/barreiras/:protocolo/documento', rota((req, res) => {
    const b = store.all('barreiras').find((x) => x.protocolo === req.params.protocolo) ?? falha(404, 'Protocolo não encontrado.');
    const chaveOk = req.query.chave && b.chaveHash === hashToken(req.query.chave);
    if (b.moderacao !== 'aprovado' && !chaveOk) falha(404, 'Protocolo não encontrado.');
    const local = b.localId ? store.get('locais', b.localId) : null;
    res.json({ ...publicaBarreira(b, { completo: true }), documento: documentoBarreira(b, local, trechoNome(b.trecho)) });
  }));

  // ---------- Painel do estabelecimento ----------
  app.post('/api/estabelecimentos', rota((req, res) => {
    const b = req.body ?? {};
    const nome = texto(b.nome, 120);
    const razaoSocial = texto(b.razaoSocial, 160);
    const responsavel = texto(b.responsavel, 120);
    const email = texto(b.email, 160);
    if (nome.length < 3) falha(400, 'Informe o nome do local.');
    if (!cnpjValido(b.cnpj)) falha(400, 'CNPJ inválido.');
    if (!razaoSocial || !responsavel) falha(400, 'Informe a razão social e o responsável legal.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) falha(400, 'E-mail inválido.');
    if (b.aceiteTermo !== true) falha(400, 'É preciso aceitar o termo de responsabilidade.');
    const no = NOS.some((n) => n.id === b.no) ? b.no : null;
    const token = newToken();
    const l = store.insert('locais', {
      id: `loc-${newId()}`, nome, tipo: 'estabelecimento', categoria: texto(b.categoria, 60) || 'Estabelecimento', no,
      descricao: texto(b.descricao, 400), andares: Math.min(Math.max(Number(b.andares) || 1, 1), 50),
      estabelecimento: { razaoSocial, cnpj: texto(b.cnpj, 20), responsavel, email },
      tokenHash: hashToken(token), revisado: false, aceiteTermo: { em: new Date().toISOString(), versao: '1.0' },
      itens: {}, interno: [],
    });
    res.status(201).json({ id: l.id, token });
  }));

  app.get('/api/empresa/me', rota((req, res) => {
    const { locais } = empresaAuth(req);
    const ids = new Set(locais.map((l) => l.id));
    res.json({
      locais: locais.map((l) => ({ id: l.id, nome: l.nome, revisado: l.revisado, pendenteRevisao: Boolean(l.pendenteRevisao), itens: l.itens, interno: l.interno ?? [], andares: l.andares, selo: selo(l, store.all('confirmacoes')) })),
      // O estabelecimento vê o relato, mas nunca quem o fez.
      barreiras: store.all('barreiras').filter((b) => ids.has(b.localId) && b.moderacao === 'aprovado').map((b) => publicaBarreira(b)),
    });
  }));

  app.put('/api/empresa/locais/:id/itens', rota((req, res) => {
    const { locais } = empresaAuth(req);
    const l = locais.find((x) => x.id === req.params.id) ?? falha(403, 'Este local não pertence ao seu cadastro.');
    if (req.body?.aceiteTermo !== true) falha(400, 'Confirme o termo de responsabilidade pela informação declarada.');
    const em = new Date().toISOString();
    const novos = {};
    for (const k of Object.keys(ITENS)) {
      const v = req.body?.itens?.[k];
      if (v === true || v === false || v === 'na') novos[k] = { declarado: v, em: l.itens?.[k]?.declarado === v ? l.itens[k].em : em };
    }
    l.itens = novos;
    l.aceiteTermo = { em, versao: '1.0' };
    if (l.tipo === 'estabelecimento') l.pendenteRevisao = true;
    store.save();
    emitir('local', { id: l.id });
    res.json({ ok: true });
  }));

  app.put('/api/empresa/locais/:id/interno', rota((req, res) => {
    const { locais } = empresaAuth(req);
    const l = locais.find((x) => x.id === req.params.id) ?? falha(403, 'Este local não pertence ao seu cadastro.');
    const passos = Array.isArray(req.body?.passos) ? req.body.passos.map((p) => texto(p, 300)).filter(Boolean).slice(0, 30) : [];
    l.interno = passos;
    store.save();
    res.json({ ok: true, interno: passos });
  }));

  app.post('/api/empresa/barreiras/:protocolo/resposta', rota((req, res) => {
    const { locais } = empresaAuth(req);
    const b = store.all('barreiras').find((x) => x.protocolo === req.params.protocolo) ?? falha(404, 'Protocolo não encontrado.');
    if (!locais.some((l) => l.id === b.localId)) falha(403, 'Este registro não é do seu local.');
    if (b.moderacao !== 'aprovado') falha(400, 'Registro ainda em moderação.');
    const resposta = texto(req.body?.texto, 1500);
    if (resposta.length < 5) falha(400, 'Escreva a resposta.');
    const status = req.body?.resolvido ? 'resolvido' : 'respondido';
    b.status = status;
    b.historico.push({ em: new Date().toISOString(), status, texto: `Resposta do responsável: ${resposta}`, autor: 'estabelecimento' });
    store.save();
    emitir('barreira', { protocolo: b.protocolo });
    res.json(publicaBarreira(b));
  }));

  // ---------- Moderação ----------
  app.get('/api/moderacao', rota((req, res) => {
    adminAuth(req);
    res.json({
      barreiras: store.all('barreiras').filter((b) => b.moderacao === 'pendente').map((b) => ({ ...publicaBarreira(b), geo: b.geo })),
      locais: store.all('locais').filter((l) => !l.revisado || l.pendenteRevisao).map((l) => ({ id: l.id, nome: l.nome, estabelecimento: l.estabelecimento, itens: l.itens, criadoEm: l.criadoEm })),
    });
  }));

  app.post('/api/moderacao/barreiras/:protocolo', rota((req, res) => {
    adminAuth(req);
    const b = store.all('barreiras').find((x) => x.protocolo === req.params.protocolo) ?? falha(404, 'Protocolo não encontrado.');
    if (b.moderacao !== 'pendente') falha(400, 'Registro já moderado.');
    const agora = new Date();
    if (req.body?.decisao === 'aprovar') {
      Object.assign(b, { moderacao: 'aprovado', status: 'aberto', enviadoEm: agora.toISOString(), prazoEm: new Date(agora.getTime() + DIAS_PRAZO_RESPOSTA * DIA).toISOString() });
      b.historico.push({ em: agora.toISOString(), status: 'aberto', texto: `Aprovado pela moderação e enviado ao responsável pelo local. Prazo de resposta: ${DIAS_PRAZO_RESPOSTA} dias.` });
    } else if (req.body?.decisao === 'rejeitar') {
      Object.assign(b, { moderacao: 'rejeitado', status: 'rejeitado' });
      b.historico.push({ em: agora.toISOString(), status: 'rejeitado', texto: `Não aprovado pela moderação: ${texto(req.body?.motivo, 300) || 'relato inconsistente ou foto expõe terceiros'}.` });
    } else falha(400, 'Decisão inválida.');
    store.save();
    emitir('barreira', { protocolo: b.protocolo });
    res.json(publicaBarreira(b));
  }));

  app.post('/api/moderacao/locais/:id/revisar', rota((req, res) => {
    adminAuth(req);
    const l = store.get('locais', req.params.id) ?? falha(404, 'Local não encontrado.');
    Object.assign(l, { revisado: true, pendenteRevisao: false, revisadoEm: new Date().toISOString() });
    store.save();
    emitir('local', { id: l.id });
    res.json({ ok: true });
  }));

  app.post('/api/moderacao/locais/:id/auditoria', rota((req, res) => {
    adminAuth(req);
    const l = store.get('locais', req.params.id) ?? falha(404, 'Local não encontrado.');
    const auditor = texto(req.body?.auditor, 160);
    if (!auditor) falha(400, 'Informe o auditor responsável.');
    const itens = {};
    for (const k of Object.keys(ITENS)) if (typeof req.body?.itens?.[k] === 'boolean') itens[k] = req.body.itens[k];
    l.auditoria = { em: new Date().toISOString(), auditor, itens };
    store.save();
    emitir('local', { id: l.id });
    res.json({ ok: true });
  }));

  // ---------- Guia de direitos ----------
  app.get('/api/direitos', (req, res) => res.json(DIREITOS.map(({ palavras, ...d }) => d)));
  app.post('/api/direitos/perguntar', rota((req, res) => {
    const pergunta = texto(req.body?.pergunta, 500);
    if (!pergunta) falha(400, 'Escreva sua pergunta.');
    const { palavras, ...r } = perguntar(pergunta);
    res.json({ ...r, canais: CANAIS });
  }));

  // ---------- Agenda de eventos ----------
  app.get('/api/eventos', (req, res) => {
    const hoje = new Date().toISOString().slice(0, 10);
    res.json(
      store.all('eventos')
        .filter((e) => req.query.todos || e.data >= hoje)
        .sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`))
        .map((e) => ({ ...e, localNome: store.get('locais', e.localId)?.nome ?? e.localTexto ?? null, selo: seloEvento(e.checklist) })),
    );
  });

  app.post('/api/eventos', rota((req, res) => {
    const b = req.body ?? {};
    const titulo = texto(b.titulo, 160);
    const organizador = texto(b.organizador, 120);
    if (titulo.length < 3 || !organizador) falha(400, 'Informe título e organizador.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data ?? '')) falha(400, 'Data inválida.');
    const hora = /^\d{2}:\d{2}$/.test(b.hora ?? '') ? b.hora : '';
    const localId = store.get('locais', b.localId) ? b.localId : null;
    const checklist = Object.fromEntries(Object.keys(CHECKLIST_EVENTO).map((k) => [k, b.checklist?.[k] === true]));
    const e = store.insert('eventos', { titulo, data: b.data, hora, localId, localTexto: localId ? null : texto(b.localTexto, 120), organizador, descricao: texto(b.descricao, 800), checklist });
    res.status(201).json({ ...e, selo: seloEvento(checklist) });
  }));

  // ---------- Testes com usuários e indicadores ----------
  app.post('/api/testes', rota((req, res) => {
    const b = req.body ?? {};
    const bool = (v) => (typeof v === 'boolean' ? v : null);
    const t = store.insert('testes', {
      entendeuSemaforo: bool(b.entendeuSemaforo), registrouSemAjuda: bool(b.registrouSemAjuda),
      prefereVerificada: bool(b.prefereVerificada), mudariaDecisao: bool(b.mudariaDecisao),
      perfil: PERFIS[b.perfil] ? b.perfil : null, comentario: texto(b.comentario, 600),
    });
    res.status(201).json({ id: t.id });
  }));

  app.get('/api/indicadores', (req, res) => {
    const t = store.all('testes');
    const pct = (campo) => {
      const v = t.filter((x) => typeof x[campo] === 'boolean');
      return v.length ? Math.round((v.filter((x) => x[campo]).length / v.length) * 100) : null;
    };
    const barreiras = store.all('barreiras').filter((b) => b.moderacao === 'aprovado');
    const respondidas = barreiras.filter((b) => b.status === 'respondido' || b.status === 'resolvido').length;
    res.json({
      participantes: t.length,
      compreensaoSemaforo: pct('entendeuSemaforo'),
      registroSemAjuda: pct('registrouSemAjuda'),
      prefereVerificada: pct('prefereVerificada'),
      mudariaDecisao: pct('mudariaDecisao'),
      metas: { compreensao: 80, preferencia: 70, participantes: 3 },
      barreiras: { total: barreiras.length, respondidas, resolvidas: barreiras.filter((b) => b.status === 'resolvido').length },
      locais: store.all('locais').length,
      confirmacoes: store.all('confirmacoes').length,
    });
  });

  // ---------- Arquivos estáticos ----------
  app.use('/uploads', express.static(store.uploadsDir, { maxAge: '7d', fallthrough: false }));
  app.use(express.static(PUBLIC_DIR));
  app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

  app.use((err, req, res, next) => {
    const status = err.status ?? err.statusCode ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ erro: status >= 500 ? 'Erro interno.' : err.message });
  });

  app.locals.store = store;
  return app;
}

