// Motor de compatibilidade: cruza os itens do local (autodeclaração, comunidade,
// auditoria e status em tempo real) com o perfil de necessidade do usuário.
import { ITENS, PERFIS, DIAS_INFO_ANTIGA, CHECKLIST_EVENTO } from './catalog.js';

const DIA = 24 * 60 * 60 * 1000;
const JANELA_COMUNIDADE_DIAS = 60;

const maisRecente = (...datas) => datas.filter(Boolean).sort().at(-1) ?? null;

export function estadoItem(local, item, { confirmacoes = [], equipamentos = [], agora = Date.now() } = {}) {
  const decl = local.itens?.[item];
  if (!decl || decl.declarado === 'na') {
    return { item, valor: decl?.declarado === 'na' ? 'na' : null, origem: null, em: null, confirmam: 0, contestam: 0 };
  }

  let valor = typeof decl.declarado === 'boolean' ? decl.declarado : null;
  let origem = 'autodeclaracao';
  let em = decl.em;

  const limite = agora - JANELA_COMUNIDADE_DIAS * DIA;
  const votos = confirmacoes
    .filter((c) => c.localId === local.id && c.item === item && Date.parse(c.criadoEm) >= limite)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const confirmam = votos.filter((v) => v.valor === 'confirma').length;
  const contestam = votos.filter((v) => v.valor === 'contesta').length;
  const ultimoVoto = votos[0]?.criadoEm ?? null;

  if (contestam > confirmam) {
    valor = false;
    origem = 'comunidade';
    em = ultimoVoto;
  } else if (confirmam > 0) {
    valor = true;
    origem = 'comunidade';
    em = ultimoVoto;
  }

  const aud = local.auditoria;
  if (aud && typeof aud.itens?.[item] === 'boolean') {
    // A auditoria prevalece, salvo se a comunidade contestou majoritariamente depois dela.
    const depois = votos.filter((v) => v.criadoEm > aud.em);
    const contestaDepois = depois.filter((v) => v.valor === 'contesta').length;
    if (contestaDepois <= depois.length - contestaDepois) {
      valor = aud.itens[item];
      origem = 'auditoria';
      em = maisRecente(aud.em, ultimoVoto);
    }
  }

  let tempoReal = null;
  const doItem = equipamentos.filter((e) => e.localId === local.id && e.item === item);
  const fora = doItem.find((e) => e.status !== 'funcionando');
  if (fora) {
    valor = false;
    origem = 'tempo_real';
    tempoReal = { equipamento: fora.nome, status: fora.status, em: fora.atualizadoEm };
    em = fora.atualizadoEm;
  } else if (doItem.length) {
    em = maisRecente(em, ...doItem.map((e) => e.atualizadoEm));
  }

  const ultimaVerificacao = maisRecente(decl.em, ultimoVoto, aud?.em, ...doItem.map((e) => e.atualizadoEm));
  const antiga = ultimaVerificacao ? agora - Date.parse(ultimaVerificacao) > DIAS_INFO_ANTIGA * DIA : true;

  return { item, valor, origem, em, confirmam, contestam, tempoReal, ultimaVerificacao, antiga };
}

export function estadosDoLocal(local, ctx) {
  return Object.fromEntries(Object.keys(ITENS).map((k) => [k, estadoItem(local, k, ctx)]));
}

function descreveTempo(iso, agora = Date.now()) {
  if (!iso) return 'sem data';
  const dias = Math.floor((agora - Date.parse(iso)) / DIA);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

export function compatibilidade(local, perfilKey, ctx = {}) {
  const estados = ctx.estados ?? estadosDoLocal(local, ctx);
  const perfil = PERFIS[perfilKey];
  const agora = ctx.agora ?? Date.now();
  if (!perfil) {
    const aplicaveis = Object.values(estados).filter((e) => e.valor !== 'na');
    const ok = aplicaveis.filter((e) => e.valor === true).length;
    return { nivel: 'sem_perfil', titulo: 'Defina seu perfil para ver a compatibilidade', resumo: `${ok} de ${aplicaveis.length} itens de acessibilidade presentes.`, faltam: [], incertos: [] };
  }

  const faltam = [];
  const incertos = [];
  const desejaveisFaltando = [];
  for (const k of perfil.essenciais) {
    const e = estados[k];
    if (!e || e.valor === 'na') continue;
    if (e.valor === false) faltam.push(k);
    else if (e.valor === null) incertos.push(k);
  }
  for (const k of perfil.desejaveis) {
    const e = estados[k];
    if (e && e.valor === false) desejaveisFaltando.push(k);
  }

  const nome = (k) => ITENS[k].curto.toLowerCase();
  const lista = (ks) => ks.map(nome).join(', ').replace(/, ([^,]*)$/, ' e $1');

  let nivel;
  let titulo;
  const motivos = [];
  if (faltam.length) {
    nivel = 'incompativel';
    titulo = 'Incompatível com seu perfil';
    for (const k of faltam) {
      const e = estados[k];
      if (e.origem === 'tempo_real') motivos.push(`${e.tempoReal.equipamento}: ${e.tempoReal.status} agora.`);
      else if (e.origem === 'comunidade') motivos.push(`${ITENS[k].curto}: contestado por ${e.contestam} usuário(s).`);
      else motivos.push(`${ITENS[k].curto}: não disponível.`);
    }
  } else if (incertos.length || desejaveisFaltando.length) {
    nivel = 'parcial';
    titulo = 'Parcialmente compatível';
    if (incertos.length) motivos.push(`Sem informação sobre: ${lista(incertos)}.`);
    if (desejaveisFaltando.length) motivos.push(`Não tem: ${lista(desejaveisFaltando)}.`);
  } else {
    nivel = 'compativel';
    titulo = 'Compatível com seu perfil';
  }

  const confirmados = perfil.essenciais.filter((k) => estados[k]?.origem === 'comunidade' && estados[k].valor === true);
  let resumo;
  if (confirmados.length) {
    const max = Math.max(...confirmados.map((k) => estados[k].confirmam));
    const ultima = maisRecente(...confirmados.map((k) => estados[k].em));
    resumo = `${lista(confirmados).replace(/^./, (c) => c.toUpperCase())} confirmado(s) por ${max} usuário(s) ${descreveTempo(ultima, agora)}.`;
  } else {
    const ultima = maisRecente(...Object.values(estados).map((e) => e.ultimaVerificacao));
    resumo = `Última verificação: ${descreveTempo(ultima, agora)}.`;
  }

  const antiga = perfil.essenciais.some((k) => estados[k] && estados[k].valor !== 'na' && estados[k].antiga);
  return { nivel, titulo, resumo, motivos, faltam, incertos, desejaveisFaltando, antiga };
}

export function selo(local, confirmacoes = [], agora = Date.now()) {
  if (local.auditoria) return { nivel: 3, nome: 'Nível 3 — Auditado por profissional' };
  if (!local.revisado) return { nivel: 0, nome: 'Autodeclaração em revisão' };
  const limite = agora - JANELA_COMUNIDADE_DIAS * DIA;
  const recentes = confirmacoes.filter((c) => c.localId === local.id && Date.parse(c.criadoEm) >= limite);
  const confirma = recentes.filter((c) => c.valor === 'confirma').length;
  const contesta = recentes.filter((c) => c.valor === 'contesta').length;
  if (confirma >= 3 && contesta < confirma / 2) return { nivel: 2, nome: 'Nível 2 — Confirmado pela comunidade' };
  return { nivel: 1, nome: 'Nível 1 — Declarado e revisado' };
}

export function seloEvento(checklist = {}) {
  const total = Object.keys(CHECKLIST_EVENTO).length;
  const ok = Object.keys(CHECKLIST_EVENTO).filter((k) => checklist[k] === true).length;
  const pct = Math.round((ok / total) * 100);
  let nivel = 'sem_selo';
  let nome = 'Sem selo de acessibilidade';
  if (pct >= 85) [nivel, nome] = ['ouro', 'Selo Ouro de acessibilidade'];
  else if (pct >= 60) [nivel, nome] = ['prata', 'Selo Prata de acessibilidade'];
  else if (pct >= 35) [nivel, nome] = ['bronze', 'Selo Bronze de acessibilidade'];
  const faltando = Object.keys(CHECKLIST_EVENTO).filter((k) => checklist[k] !== true);
  return { nivel, nome, pct, ok, total, faltando };
}
