import { prefs } from './prefs.js';
import { esc, toast, anunciar } from './ui.js';
import { getCatalogo } from './api.js';
import * as inicio from './views/inicio.js';
import * as painel from './views/painel.js';
import * as locais from './views/locais.js';
import * as local from './views/local.js';
import * as rota from './views/rota.js';
import * as relatar from './views/relatar.js';
import * as registros from './views/registros.js';
import * as direitos from './views/direitos.js';
import * as eventos from './views/eventos.js';
import * as perfil from './views/perfil.js';
import * as empresa from './views/empresa.js';
import * as moderacao from './views/moderacao.js';
import * as indicadores from './views/indicadores.js';
import * as placa from './views/placa.js';
import * as sobre from './views/sobre.js';

const ROTAS = [
  [/^\/?$/, inicio],
  [/^\/painel$/, painel],
  [/^\/locais$/, locais],
  [/^\/local\/([\w-]+)$/, local],
  [/^\/chegada\/([\w-]+)$/, local, { chegada: true }],
  [/^\/rota$/, rota],
  [/^\/relatar$/, relatar],
  [/^\/registros$/, registros],
  [/^\/registro\/([\w-]+)$/, registros, { documento: true }],
  [/^\/direitos$/, direitos],
  [/^\/eventos$/, eventos],
  [/^\/perfil$/, perfil],
  [/^\/empresa$/, empresa],
  [/^\/moderacao$/, moderacao],
  [/^\/indicadores$/, indicadores],
  [/^\/placa\/([\w-]+)$/, placa],
  [/^\/sobre$/, sobre],
];

let desmontar = null;

function lerHash() {
  const bruto = location.hash.replace(/^#/, '') || '/';
  const [caminho, qs] = bruto.split('?');
  return { caminho, query: new URLSearchParams(qs ?? '') };
}

async function navegar() {
  const { caminho, query } = lerHash();
  const main = document.getElementById('conteudo');
  if (typeof desmontar === 'function') desmontar();
  desmontar = null;
  for (const [re, view, extra] of ROTAS) {
    const m = re.exec(caminho);
    if (!m) continue;
    // Um contêiner novo a cada navegação: os ouvintes de eventos da tela anterior somem junto.
    const tela = document.createElement('div');
    tela.innerHTML = '<p class="carregando">Carregando…</p>';
    main.replaceChildren(tela);
    try {
      desmontar = await view.render(tela, { params: m.slice(1), query, ...extra });
    } catch (e) {
      main.innerHTML = `<h1>Algo deu errado</h1><p class="alerta alerta-erro" role="alert">${esc(e.message)}</p>`;
    }
    marcarMenu(caminho);
    faixaPerfil();
    const h1 = main.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: false });
      document.title = `${h1.textContent} · Rota Livre`;
    }
    window.scrollTo(0, 0);
    return;
  }
  main.innerHTML = '<h1>Página não encontrada</h1><p><a href="#/">Voltar ao início</a></p>';
}

function marcarMenu(caminho) {
  for (const a of document.querySelectorAll('.menu a')) {
    const alvo = a.getAttribute('href').slice(1);
    if (caminho === alvo || (alvo !== '/' && caminho.startsWith(alvo))) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

async function faixaPerfil() {
  const el = document.getElementById('faixa-perfil');
  const p = prefs.perfil();
  if (p) {
    const cat = await getCatalogo();
    el.innerHTML = `<p class="faixa">Perfil ativo: <strong>${esc(cat.perfis[p]?.nome ?? p)}</strong> · <a href="#/perfil">trocar</a></p>`;
  } else {
    el.innerHTML = '<p class="faixa faixa-aviso">Defina seu perfil para ver se cada local é compatível com você. <a href="#/perfil">Definir perfil</a></p>';
  }
}

// ---------- Ferramentas de acessibilidade ----------
function aplicarA11y() {
  const a = prefs.a11y();
  document.documentElement.style.setProperty('--escala', a.fonte);
  document.documentElement.toggleAttribute('data-contraste', a.contraste);
  document.querySelector('[data-a11y="contraste"]').setAttribute('aria-pressed', String(a.contraste));
}

function iniciarVoz() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('Comando de voz não é suportado neste navegador. Tente o Chrome.', 'erro');
  const rec = new SR();
  rec.lang = 'pt-BR';
  rec.interimResults = false;
  anunciar('Ouvindo. Diga, por exemplo: painel, rota, relatar barreira, direitos ou buscar restaurante.');
  toast('🎤 Ouvindo… diga "painel", "rota", "relatar barreira", "direitos" ou "buscar …"');
  rec.onresult = (ev) => {
    const fala = ev.results[0][0].transcript.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const comandos = [
      [/painel|elevador|agora/, '#/painel'],
      [/rota|caminho|ir para|como chego/, '#/rota'],
      [/relatar|barreira|denunciar|reclamar/, '#/relatar'],
      [/direito|lei/, '#/direitos'],
      [/registro|protocolo/, '#/registros'],
      [/evento|agenda/, '#/eventos'],
      [/perfil/, '#/perfil'],
      [/inicio|comeco/, '#/'],
    ];
    const busca = /(?:buscar|procurar|pesquisar)\s+(.+)/.exec(fala);
    if (busca) {
      location.hash = `#/locais?q=${encodeURIComponent(busca[1])}`;
      return;
    }
    const alvo = comandos.find(([re]) => re.test(fala));
    if (alvo) location.hash = alvo[1];
    else toast(`Não entendi: "${fala}"`, 'erro');
  };
  rec.onerror = () => toast('Não consegui ouvir. Verifique a permissão do microfone.', 'erro');
  rec.start();
}

document.querySelector('.ferramentas').addEventListener('click', (ev) => {
  const acao = ev.target.closest('button')?.dataset.a11y;
  if (!acao) return;
  const a = prefs.a11y();
  if (acao === 'mais') a.fonte = Math.min(1.6, +(a.fonte + 0.1).toFixed(1));
  if (acao === 'menos') a.fonte = Math.max(0.9, +(a.fonte - 0.1).toFixed(1));
  if (acao === 'contraste') a.contraste = !a.contraste;
  if (acao === 'voz') return iniciarVoz();
  prefs.salvarA11y(a);
  aplicarA11y();
  anunciar(acao === 'contraste' ? (a.contraste ? 'Alto contraste ligado' : 'Alto contraste desligado') : `Tamanho do texto: ${Math.round(a.fonte * 100)}%`);
});

aplicarA11y();
window.addEventListener('hashchange', navegar);
navegar();

// O link "pular para o conteúdo" não pode alterar o hash (que é usado pelas rotas).
document.querySelector('.pular').addEventListener('click', (ev) => {
  ev.preventDefault();
  document.getElementById('conteudo').focus();
});
