import { api, getCatalogo } from '../api.js';
import { esc, falar } from '../ui.js';
import { prefs } from '../prefs.js';

function mapa(campus, r, de, para) {
  const naRota = new Set(r?.arestas ?? []);
  const no = Object.fromEntries(campus.nos.map((n) => [n.id, n]));
  const linhas = campus.arestas.map((a) => {
    const A = no[a.de];
    const B = no[a.para];
    const bloqueada = a.situacao.bloqueadoPorEquipamento || a.situacao.barreiras.length;
    const cls = ['aresta', a.tipo === 'escada' ? 'aresta-escada' : '', bloqueada ? 'aresta-bloqueada' : '', naRota.has(a.id) ? 'aresta-rota' : ''].join(' ');
    return `<line class="${cls}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"><title>${esc(a.nome)}${bloqueada ? ' — bloqueado agora' : ''}</title></line>`;
  });
  // Andares superiores ficam sobre o próprio prédio: só o ponto, sem rótulo, para não sobrepor.
  const nos = campus.nos.filter((n) => n.rotulo).map((n) => {
    const cls = n.id === de ? 'no no-inicio' : n.id === para ? 'no no-fim' : 'no';
    const rot = n.rotulo.replace(/ \(.*\)$/, '').replace(' — térreo', '');
    const ancora = n.x > 760 ? 'end' : 'start';
    const dx = ancora === 'end' ? -14 : 14;
    const ponto = `<circle class="${cls}" cx="${n.x}" cy="${n.y}" r="${n.id === de || n.id === para ? 12 : 8}"><title>${esc(n.rotulo)}</title></circle>`;
    if (n.andar && n.id !== para && n.id !== de) return ponto;
    return `${ponto}<text class="no-rotulo" x="${n.x + dx}" y="${n.y - 10}" text-anchor="${ancora}">${esc(rot)}</text>`;
  });
  return `<svg viewBox="0 0 1000 700" role="img" aria-labelledby="mapa-titulo"><title id="mapa-titulo">Mapa do campus${r?.encontrada ? ' com a rota destacada' : ''}. As instruções em texto estão na lista ao lado.</title>${linhas.join('')}${nos.join('')}</svg>`;
}

export async function render(main, { query }) {
  const [campus, cat] = await Promise.all([api('/api/campus'), getCatalogo()]);
  const destinos = campus.nos.filter((n) => n.rotulo);
  const perfilSalvo = prefs.perfil() ?? 'cadeirante';
  const de = query.get('de') ?? prefs.get('ultimaOrigem', 'portaria');
  const para = query.get('para') ?? '';

  const opcoes = (sel) => destinos.map((n) => `<option value="${n.id}" ${n.id === sel ? 'selected' : ''}>${esc(n.rotulo)}</option>`).join('');

  main.innerHTML = `
    <h1>Rota acessível</h1>
    <p class="lead">Informe de onde você sai e para onde vai. A rota evita escadas e rampas íngremes conforme o seu perfil e desvia de elevadores parados e rotas interditadas <em>agora</em>.</p>
    <form id="form-rota" class="cartao">
      <div class="grade">
        <div class="campo"><label for="de">Saindo de</label><select id="de" name="de">${opcoes(de)}</select></div>
        <div class="campo"><label for="para">Indo para</label><select id="para" name="para"><option value="">Escolha o destino</option>${opcoes(para)}</select></div>
        <div class="campo"><label for="perfil">Perfil da rota</label><select id="perfil" name="perfil">${Object.entries(cat.perfis).map(([k, p]) => `<option value="${k}" ${k === perfilSalvo ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></div>
      </div>
      <div class="linha"><button class="botao" type="submit">Traçar rota</button><button class="botao botao-sec" type="button" id="inverter">⇅ Inverter</button></div>
    </form>
    <div id="resultado" aria-live="polite"></div>
  `;

  const res = main.querySelector('#resultado');
  const form = main.querySelector('#form-rota');

  async function calcular() {
    const fd = new FormData(form);
    if (!fd.get('para')) {
      res.innerHTML = `<div class="mapa" style="margin-top:1rem">${mapa(campus, null, fd.get('de'))}</div>`;
      return;
    }
    prefs.set('ultimaOrigem', fd.get('de'));
    const r = await api(`/api/rota?de=${fd.get('de')}&para=${fd.get('para')}&perfil=${fd.get('perfil')}`);
    const atualizado = await api('/api/campus');
    const avisos = (r.avisos ?? []).map((a) => `<li>${esc(a)}</li>`).join('');
    if (!r.encontrada) {
      res.innerHTML = `
        <div class="alerta alerta-erro" role="alert"><strong>${esc(r.erro)}</strong>${avisos ? `<ul>${avisos}</ul>` : ''}<p>${esc(r.sugestao ?? '')}</p>
        <a class="botao botao-perigo botao-peq" href="#/relatar">Registrar barreira</a> <a class="botao botao-sec botao-peq" href="#/direitos">Ver meus direitos</a></div>
        <div class="mapa">${mapa(atualizado, null, fd.get('de'), fd.get('para'))}</div>`;
      return;
    }
    const texto = r.passos.map((p) => p.texto).join(' ');
    res.innerHTML = `
      ${avisos ? `<div class="alerta alerta-aviso"><strong>Atenção — situação agora:</strong><ul>${avisos}</ul></div>` : ''}
      <div class="rota-grade" style="margin-top:1rem">
        <section class="cartao" aria-labelledby="h-passos">
          <div class="linha entre"><h2 id="h-passos" style="margin:0">Passo a passo</h2><button class="botao botao-sec botao-peq" id="ouvir" type="button">🔊 Ouvir</button></div>
          <p><strong>${r.distancia} m</strong> · cerca de <strong>${r.minutos} min</strong></p>
          <ol class="lista-passos">${r.passos.map((p) => `<li><div>${esc(p.texto)}${p.alerta ? `<br><span class="etiqueta etiqueta-amarelo">${esc(p.alerta)}</span>` : ''}${p.trecho ? `<br><a class="pequeno" href="#/relatar?trecho=${p.trecho}">Obstáculo neste trecho? Relatar</a>` : ''}</div></li>`).join('')}</ol>
          <p class="pequeno suave">A rota é uma orientação, não uma garantia. Encontrou um obstáculo novo? Relate em um toque para avisar os próximos.</p>
        </section>
        <div class="mapa">${mapa(atualizado, r, fd.get('de'), fd.get('para'))}
          <div class="legenda"><span>━ rota</span><span>┅ escada</span><span style="color:var(--vermelho)">╍ bloqueado agora</span><span>● verde: saída · ● vermelho: chegada</span></div>
        </div>
      </div>`;
    res.querySelector('#ouvir').addEventListener('click', () => falar(texto));
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    calcular();
  });
  main.querySelector('#inverter').addEventListener('click', () => {
    const a = form.de.value;
    form.de.value = form.para.value || a;
    form.para.value = a;
    calcular();
  });
  await calcular();
}
