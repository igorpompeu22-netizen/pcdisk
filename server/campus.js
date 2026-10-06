// Grafo do campus-piloto (fictício, inspirado no piloto da comunidade UNIFOR).
// Coordenadas em um plano 1000 x 700; cada unidade equivale a ESCALA metros.
export const ESCALA = 0.5;

export const NOS = [
  { id: 'portaria', x: 90, y: 620, rotulo: 'Portaria principal' },
  { id: 'estac', x: 90, y: 440, rotulo: 'Estacionamento (vagas reservadas)' },
  { id: 'j1', x: 260, y: 520 },
  { id: 'praca', x: 380, y: 430, rotulo: 'Praça central' },
  { id: 'blA', x: 300, y: 250, rotulo: 'Bloco A — térreo' },
  { id: 'blA2', x: 330, y: 215, rotulo: 'Bloco A — 2º andar (salas de aula)', andar: 2 },
  { id: 'reit', x: 380, y: 90, rotulo: 'Reitoria e Secretaria Acadêmica' },
  { id: 'j2', x: 540, y: 360 },
  { id: 'blB', x: 540, y: 220, rotulo: 'Bloco B — Engenharias' },
  { id: 'bib', x: 560, y: 500, rotulo: 'Biblioteca Central' },
  { id: 'j3', x: 730, y: 380 },
  { id: 'blC', x: 740, y: 230, rotulo: 'Bloco C — térreo' },
  { id: 'blC2', x: 770, y: 195, rotulo: 'Bloco C — 2º andar (clínica-escola)', andar: 2 },
  { id: 'ru', x: 760, y: 520, rotulo: 'Praça de alimentação' },
  { id: 'j4', x: 880, y: 470 },
  { id: 'gin', x: 900, y: 300, rotulo: 'Ginásio poliesportivo' },
  { id: 'leste', x: 930, y: 600, rotulo: 'Portão leste' },
  { id: 'ext1', x: 860, y: 670, rotulo: 'Restaurante Sabor da Esquina (fora do campus)' },
];

// tipo: calcada | passarela | rampa | escada | elevador
// inclinacao em %, degraus para escadas, equipamento quando depende de um equipamento.
export const ARESTAS = [
  { id: 'a1', de: 'portaria', para: 'estac', tipo: 'calcada', nome: 'calçada da avenida interna', pisoTatil: true },
  { id: 'a2', de: 'portaria', para: 'j1', tipo: 'escada', nome: 'escadaria do atalho da portaria', degraus: 14 },
  { id: 'a3', de: 'estac', para: 'j1', tipo: 'rampa', nome: 'rampa do estacionamento', inclinacao: 6, pisoTatil: true },
  { id: 'a4', de: 'j1', para: 'praca', tipo: 'calcada', nome: 'alameda das palmeiras', pisoTatil: true, coberto: false },
  { id: 'a5', de: 'j1', para: 'blA', tipo: 'escada', nome: 'escada lateral do Bloco A', degraus: 10 },
  { id: 'a6', de: 'praca', para: 'blA', tipo: 'rampa', nome: 'rampa principal do Bloco A', inclinacao: 7, pisoTatil: true, equipamento: 'eq-rampa-a' },
  { id: 'a7', de: 'blA', para: 'blA2', tipo: 'elevador', nome: 'elevador do Bloco A', andar: 2, equipamento: 'eq-elev-a' },
  { id: 'a8', de: 'blA', para: 'blA2', tipo: 'escada', nome: 'escada interna do Bloco A', degraus: 22 },
  { id: 'a9', de: 'blA', para: 'reit', tipo: 'rampa', nome: 'rampa da Reitoria', inclinacao: 5, pisoTatil: true },
  { id: 'a10', de: 'praca', para: 'j2', tipo: 'passarela', nome: 'passarela coberta central', pisoTatil: true, coberto: true },
  { id: 'a11', de: 'j2', para: 'blB', tipo: 'calcada', nome: 'calçada do Bloco B', pisoTatil: false },
  { id: 'a12', de: 'blB', para: 'reit', tipo: 'escada', nome: 'escadaria Bloco B–Reitoria', degraus: 18 },
  { id: 'a13', de: 'j2', para: 'bib', tipo: 'rampa', nome: 'rampa da Biblioteca', inclinacao: 8, pisoTatil: true },
  { id: 'a14', de: 'praca', para: 'bib', tipo: 'calcada', nome: 'calçada da praça à Biblioteca', pisoTatil: false },
  { id: 'a15', de: 'j2', para: 'j3', tipo: 'passarela', nome: 'passarela coberta Bloco B–Bloco C', pisoTatil: true, coberto: true, equipamento: 'eq-passarela' },
  { id: 'a16', de: 'j3', para: 'blC', tipo: 'calcada', nome: 'calçada do Bloco C', pisoTatil: true },
  { id: 'a17', de: 'blC', para: 'blC2', tipo: 'elevador', nome: 'elevador do Bloco C', andar: 2, equipamento: 'eq-elev-c' },
  { id: 'a18', de: 'blC', para: 'blC2', tipo: 'escada', nome: 'escada interna do Bloco C', degraus: 22 },
  { id: 'a19', de: 'bib', para: 'ru', tipo: 'calcada', nome: 'calçada Biblioteca–Praça de alimentação', pisoTatil: true },
  { id: 'a20', de: 'j3', para: 'ru', tipo: 'calcada', nome: 'calçada do bosque', pisoTatil: false },
  { id: 'a21', de: 'ru', para: 'j4', tipo: 'calcada', nome: 'calçada da praça de alimentação', pisoTatil: true },
  { id: 'a22', de: 'j4', para: 'gin', tipo: 'rampa', nome: 'rampa curta do Ginásio', inclinacao: 11 },
  { id: 'a23', de: 'j3', para: 'gin', tipo: 'calcada', nome: 'calçada lateral do Ginásio', pisoTatil: false },
  { id: 'a24', de: 'j4', para: 'leste', tipo: 'calcada', nome: 'calçada até o portão leste', pisoTatil: true },
  { id: 'a25', de: 'leste', para: 'ext1', tipo: 'calcada', nome: 'calçada da rua externa', pisoTatil: false },
];

export function distancia(a, b) {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * ESCALA);
}
