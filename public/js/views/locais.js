import { api } from '../api.js';
import { esc, quando, semaforo, selo } from '../ui.js';
import { prefs } from '../prefs.js';

export async function render(main, { query }) {
  const q = query.get('q') ?? '';
  main.innerHTML = `
    <h1>Locais</h1>
    <p class="lead">Busque um prédio do campus ou um estabelecimento por perto. O semáforo cruza a acessibilidade do local com o seu perfil.</p>
    <form id="busca" role="search" class="linha" style="margin-bottom:1rem">
      <label for="q" class="sr">Buscar local</label>
      <input type="search" id="q" name="q" value="${esc(q)}" placeholder="Ex.: restaurante, biblioteca, Bloco A" style="flex:1;min-width:200px">
      <button class="botao" type="submit">Buscar</button>
    </form>
    <div class="linha pequeno suave" style="margin-bottom:1rem">
      <span>${semaforo({ nivel: 'compativel' })} tudo o que você precisa</span>
      <span>${semaforo({ nivel: 'parcial' })} falta informação ou item desejável</span>
      <span>${semaforo({ nivel: 'incompativel' })} falta algo essencial</span>
    </div>
    <div id="resultado" aria-live="polite"></div>
  `;
  const res = main.querySelector('#resultado');
  async function buscar(termo) {
    const perfil = prefs.perfil() ?? '';
    const lista = await api(`/api/locais?q=${encodeURIComponent(termo)}&perfil=${perfil}`);
    if (!lista.length) {
      res.innerHTML = '<p>Nenhum local encontrado. <a href="#/empresa">Seu estabelecimento não está aqui? Cadastre-o.</a></p>';
      return;
    }
    res.innerHTML = `<p class="sr">${lista.length} locais encontrados.</p><div class="grade">${lista.map((l) => `
      <article class="cartao item-local">
        <a class="cobre" href="#/local/${esc(l.id)}"><h2>${esc(l.nome)}</h2></a>
        <span class="suave pequeno">${esc(l.categoria)}${l.tipo === 'estabelecimento' ? ' · estabelecimento' : ' · campus'}</span>
        <div>${semaforo(l.compat)}</div>
        <p class="pequeno" style="margin:0">${esc(l.compat.motivos?.[0] ?? l.compat.resumo)}</p>
        <div class="linha pequeno">${selo(l.selo)}</div>
        <p class="pequeno suave" style="margin:0">Última verificação: ${quando(l.ultimaVerificacao)}${l.antiga ? ' <span class="etiqueta etiqueta-amarelo">informação com mais de 30 dias</span>' : ''}${l.barreirasAbertas ? ` · <span class="etiqueta etiqueta-vermelho">${l.barreirasAbertas} barreira(s) em aberto</span>` : ''}</p>
      </article>`).join('')}</div>`;
  }
  main.querySelector('#busca').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const termo = main.querySelector('#q').value;
    history.replaceState(null, '', `#/locais${termo ? `?q=${encodeURIComponent(termo)}` : ''}`);
    buscar(termo);
  });
  await buscar(q);
}
