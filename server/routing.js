// Cálculo de rotas acessíveis no campus (Dijkstra), considerando o perfil,
// o status em tempo real dos equipamentos e as barreiras registradas nos trechos.
import { NOS, ARESTAS, distancia } from './campus.js';
import { PERFIS } from './catalog.js';

const NO = Object.fromEntries(NOS.map((n) => [n.id, n]));
const VELOCIDADE_M_MIN = 50; // ritmo confortável para cadeira de rodas manual
const CATEGORIAS_BLOQUEIAM = new Set(['calcada', 'rampa', 'entrada', 'porta', 'elevador']);

export function comprimento(aresta) {
  if (aresta.tipo === 'elevador') return 8;
  return distancia(NO[aresta.de], NO[aresta.para]);
}

// Situação atual de cada trecho: equipamento fora de operação ou barreira aberta.
export function situacaoTrechos(equipamentos = [], barreiras = []) {
  const eq = Object.fromEntries(equipamentos.map((e) => [e.id, e]));
  const out = {};
  for (const a of ARESTAS) {
    const e = a.equipamento ? eq[a.equipamento] : null;
    const abertas = barreiras.filter((b) => b.trecho === a.id && b.moderacao === 'aprovado' && b.status !== 'resolvido');
    out[a.id] = {
      equipamento: e ? { id: e.id, nome: e.nome, status: e.status } : null,
      bloqueadoPorEquipamento: Boolean(e && e.status !== 'funcionando'),
      barreiras: abertas.map((b) => ({ protocolo: b.protocolo, categoria: b.categoria })),
    };
  }
  return out;
}

function custo(aresta, perfil, situacao, ignorarSituacao) {
  let fator = 1;
  if (perfil) {
    if (aresta.tipo === 'escada') {
      if (perfil.evitaEscada) return Infinity;
      fator *= perfil.penalidadeEscada ?? 1.2;
    }
    if (aresta.tipo === 'rampa' && perfil.inclinacaoMax && aresta.inclinacao > perfil.inclinacaoMax) return Infinity;
    if (aresta.tipo === 'rampa') fator *= 1 + (aresta.inclinacao ?? 0) / 25;
    if (perfil.preferePisoTatil && !aresta.pisoTatil) fator *= 1.6;
  }
  if (!ignorarSituacao) {
    if (situacao.bloqueadoPorEquipamento) return Infinity;
    if (situacao.barreiras.length) {
      const grave = situacao.barreiras.some((b) => CATEGORIAS_BLOQUEIAM.has(b.categoria));
      if (grave && perfil?.evitaEscada) return Infinity;
      fator *= 3;
    }
  }
  return comprimento(aresta) * fator;
}

function dijkstra(origem, destino, peso) {
  const dist = { [origem]: 0 };
  const anterior = {};
  const visitados = new Set();
  const fila = [origem];
  while (fila.length) {
    fila.sort((a, b) => dist[a] - dist[b]);
    const atual = fila.shift();
    if (visitados.has(atual)) continue;
    visitados.add(atual);
    if (atual === destino) break;
    for (const a of ARESTAS) {
      if (a.de !== atual && a.para !== atual) continue;
      const viz = a.de === atual ? a.para : a.de;
      const c = peso(a);
      if (!Number.isFinite(c)) continue;
      const nd = dist[atual] + c;
      if (nd < (dist[viz] ?? Infinity)) {
        dist[viz] = nd;
        anterior[viz] = { no: atual, aresta: a };
        fila.push(viz);
      }
    }
  }
  if (dist[destino] === undefined) return null;
  const caminho = [];
  let n = destino;
  while (n !== origem) {
    caminho.unshift({ ...anterior[n], para: n });
    n = anterior[n].no;
  }
  return caminho;
}

function descreveRampa(inc) {
  if (inc <= 5) return 'rampa suave';
  if (inc <= 8.33) return 'rampa moderada';
  return 'rampa íngreme';
}

function instrucao(passo) {
  const a = passo.aresta;
  const destino = NO[passo.para];
  const ate = destino.rotulo ? ` até ${destino.rotulo}` : '';
  const m = comprimento(a);
  switch (a.tipo) {
    case 'elevador': {
      const sobe = (NO[passo.para].andar ?? 1) > (NO[passo.no].andar ?? 1);
      return `Pegue o ${a.nome} e ${sobe ? 'suba' : 'desça'} para ${destino.rotulo ?? 'o próximo andar'}.`;
    }
    case 'escada':
      return `Use a ${a.nome} (${a.degraus} degraus)${ate}.`;
    case 'rampa':
      return `Siga ${m} m pela ${a.nome} (${descreveRampa(a.inclinacao)})${ate}.`;
    case 'passarela':
      return `Siga ${m} m pela ${a.nome}${a.coberto ? ' (coberta)' : ''}${ate}.`;
    default:
      return `Siga ${m} m pela ${a.nome}${ate}.`;
  }
}

export function calcularRota({ de, para, perfil: perfilKey, equipamentos = [], barreiras = [] }) {
  if (!NO[de] || !NO[para]) return { encontrada: false, erro: 'Origem ou destino desconhecido.' };
  const perfil = PERFIS[perfilKey] ?? null;
  const situacao = situacaoTrechos(equipamentos, barreiras);
  if (de === para) return { encontrada: true, distancia: 0, minutos: 0, passos: [], nos: [de], arestas: [], avisos: [] };

  const caminho = dijkstra(de, para, (a) => custo(a, perfil, situacao[a.id], false));
  const ideal = dijkstra(de, para, (a) => custo(a, perfil, situacao[a.id], true));

  const avisos = [];
  if (ideal) {
    for (const p of ideal) {
      const s = situacao[p.aresta.id];
      if (s.bloqueadoPorEquipamento) avisos.push(`Desviamos de: ${s.equipamento.nome} (${s.equipamento.status} agora).`);
      else if (s.barreiras.length) avisos.push(`Há barreira registrada na ${p.aresta.nome} (protocolo ${s.barreiras[0].protocolo}).`);
    }
  }

  if (!caminho) {
    return {
      encontrada: false,
      erro: 'Não encontramos uma rota acessível para o seu perfil agora.',
      avisos,
      sugestao: 'Peça apoio à Coordenação de Acessibilidade e registre a barreira para que ela seja corrigida.',
    };
  }

  const passos = caminho.map((p) => {
    const s = situacao[p.aresta.id];
    return {
      texto: instrucao(p),
      tipo: p.aresta.tipo,
      trecho: p.aresta.id,
      metros: comprimento(p.aresta),
      alerta: s.barreiras.length ? `Atenção: barreira registrada neste trecho (protocolo ${s.barreiras[0].protocolo}).` : null,
    };
  });
  const total = passos.reduce((s, p) => s + p.metros, 0);
  passos.push({ texto: `Você chegou: ${NO[para].rotulo ?? 'destino'}.`, tipo: 'chegada', metros: 0 });

  return {
    encontrada: true,
    distancia: total,
    minutos: Math.max(1, Math.round(total / VELOCIDADE_M_MIN)),
    passos,
    nos: [de, ...caminho.map((p) => p.para)],
    arestas: caminho.map((p) => p.aresta.id),
    avisos,
  };
}
