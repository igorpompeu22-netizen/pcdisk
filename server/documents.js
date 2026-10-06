// Geração do registro formal de barreira (solicitação extrajudicial de adequação),
// transcrição braille para a placa QR e validação de CNPJ.
import { CATEGORIAS_BARREIRA, CANAIS } from './catalog.js';

const dataBR = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' }) : '—');

export function documentoBarreira(b, local, trechoNome) {
  const cat = CATEGORIAS_BARREIRA[b.categoria] ?? CATEGORIAS_BARREIRA.outro;
  const ondeNome = local ? local.nome : trechoNome ?? 'trecho do campus';
  const responsavel = local?.estabelecimento?.razaoSocial ?? 'Gestão do campus';
  const linhas = [
    'REGISTRO DE BARREIRA DE ACESSIBILIDADE E SOLICITAÇÃO DE ADEQUAÇÃO',
    '',
    `Protocolo: ${b.protocolo}`,
    `Data do registro: ${dataBR(b.criadoEm)}`,
    `Destinatário: ${responsavel}${local?.estabelecimento?.cnpj ? ` — CNPJ ${local.estabelecimento.cnpj}` : ''}`,
    `Local: ${ondeNome}`,
    `Barreira: ${cat.nome}`,
    '',
    'DESCRIÇÃO DOS FATOS',
    b.descricao,
    b.foto ? 'Há registro fotográfico anexado a este protocolo.' : 'Sem registro fotográfico.',
    b.geo ? `Localização registrada: ${b.geo.lat.toFixed(5)}, ${b.geo.lng.toFixed(5)}.` : '',
    '',
    'NORMAS APLICÁVEIS',
    ...cat.normas.map((n) => `• ${n}`),
    '',
    'SOLICITAÇÃO',
    `Solicita-se a correção da barreira descrita, de modo a garantir a acessibilidade do local, e a resposta a este registro no prazo de resposta da plataforma, até ${dataBR(b.prazoEm)}.`,
    'A identidade e a condição de saúde de quem registrou não são informadas ao destinatário (LGPD, art. 11).',
    '',
    'SE NÃO HOUVER RESPOSTA',
    ...CANAIS.map((c) => `• ${c.nome}: ${c.quando}`),
    '',
    'Documento gerado pela Rota Livre — by PCDisk. A plataforma orienta e encaminha; não presta consultoria',
    'nem representação jurídica (Lei 8.906/1994 — Estatuto da Advocacia e da OAB).',
  ];
  return linhas.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n');
}

// Grafia braille para a língua portuguesa (grau 1), para a etiqueta impressa.
const LETRAS = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚',
  k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞',
  u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵',
  á: '⠷', à: '⠫', â: '⠡', ã: '⠜', é: '⠿', ê: '⠣', í: '⠌', ó: '⠬', ô: '⠹', õ: '⠪', ú: '⠾', ü: '⠳', ç: '⠯',
  ' ': ' ', '.': '⠄', ',': '⠂', '-': '⠤', ':': '⠒', ';': '⠆', '—': '⠤⠤', '(': '⠣⠄', ')': '⠠⠜',
};
const DIGITOS = '⠚⠁⠃⠉⠙⠑⠋⠛⠓⠊';

export function braille(texto) {
  let out = '';
  let emNumero = false;
  for (const ch of String(texto)) {
    if (/[0-9]/.test(ch)) {
      if (!emNumero) out += '⠼';
      emNumero = true;
      out += DIGITOS[Number(ch)];
      continue;
    }
    emNumero = false;
    const minus = ch.toLowerCase();
    if (minus !== ch && LETRAS[minus]) out += '⠨';
    out += LETRAS[minus] ?? '';
  }
  return out;
}

export function cnpjValido(cnpj) {
  const d = String(cnpj).replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((s, p, i) => s + p * Number(d[i]), 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}
