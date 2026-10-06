// Utilitários de interface: escape, datas, avisos para leitor de tela, fala e fotos.
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function quando(iso) {
  if (!iso) return 'sem data';
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

export const dataBR = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');
export const dataHoraBR = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export function anunciar(msg) {
  const el = document.getElementById('anuncio');
  el.textContent = '';
  setTimeout(() => (el.textContent = msg), 50);
}

export function toast(msg, tipo = 'ok') {
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 5000);
}

export function falar(texto) {
  if (!('speechSynthesis' in window)) return toast('Seu navegador não tem leitura em voz alta.', 'erro');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'pt-BR';
  speechSynthesis.speak(u);
}

export const SEMAFORO = {
  compativel: { cor: 'verde', icone: '✓', rotulo: 'Compatível' },
  parcial: { cor: 'amarelo', icone: '!', rotulo: 'Parcial' },
  incompativel: { cor: 'vermelho', icone: '✕', rotulo: 'Incompatível' },
  sem_perfil: { cor: 'neutro', icone: '?', rotulo: 'Sem perfil' },
};

export function semaforo(compat, { grande = false } = {}) {
  const s = SEMAFORO[compat.nivel] ?? SEMAFORO.sem_perfil;
  return `<span class="semaforo semaforo-${s.cor}${grande ? ' semaforo-grande' : ''}"><span aria-hidden="true" class="semaforo-icone">${s.icone}</span> ${esc(grande ? compat.titulo : s.rotulo)}</span>`;
}

export const STATUS_EQUIP = {
  funcionando: { rotulo: 'Funcionando', cor: 'verde', icone: '✓' },
  parado: { rotulo: 'Parado', cor: 'vermelho', icone: '✕' },
  interditado: { rotulo: 'Interditado', cor: 'vermelho', icone: '⛔' },
  manutencao: { rotulo: 'Em manutenção', cor: 'amarelo', icone: '🔧' },
};

export const STATUS_REGISTRO = {
  em_moderacao: { rotulo: 'Em moderação', cor: 'neutro' },
  aberto: { rotulo: 'Enviado — aguardando resposta', cor: 'amarelo' },
  respondido: { rotulo: 'Respondido', cor: 'azul' },
  resolvido: { rotulo: 'Resolvido', cor: 'verde' },
  rejeitado: { rotulo: 'Não aprovado', cor: 'vermelho' },
};

export function selo(s) {
  return `<span class="selo selo-${s.nivel}"><span aria-hidden="true">${'★'.repeat(s.nivel) || '☆'}</span> ${esc(s.nome)}</span>`;
}

// Reduz a foto no aparelho antes do envio. Reencodar no canvas também remove os metadados (EXIF/GPS).
export function lerFoto(arquivo, max = 1280) {
  return new Promise((resolve, reject) => {
    if (!arquivo) return resolve(null);
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    img.src = url;
  });
}

export function formDados(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function erroEm(el, e) {
  el.innerHTML = `<p class="alerta alerta-erro" role="alert">${esc(e.message ?? e)}</p>`;
}
