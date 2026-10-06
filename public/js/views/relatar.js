import { api, getCatalogo } from '../api.js';
import { esc, toast, lerFoto, anunciar } from '../ui.js';
import { prefs } from '../prefs.js';

const ETAPAS = ['O que aconteceu', 'Onde', 'Foto e relato', 'Revisar e enviar'];

export async function render(main, { query }) {
  const [cat, campus] = await Promise.all([getCatalogo(), api('/api/campus')]);
  const estado = {
    etapa: 0,
    categoria: query.get('categoria') ?? '',
    localId: query.get('local') ?? '',
    trecho: query.get('trecho') ?? '',
    geo: null,
    foto: null,
    descricao: '',
  };
  if (estado.trecho) estado.categoria ||= 'calcada';

  function desenhar() {
    const e = estado.etapa;
    const cab = `<h1>Relatar barreira</h1>
      <ol class="passos-form">${ETAPAS.map((t, i) => `<li ${i === e ? 'aria-current="step"' : ''}>${i + 1}. ${t}</li>`).join('')}</ol>`;
    let corpo = '';
    if (e === 0) {
      corpo = `<fieldset><legend>O que você encontrou?</legend><div class="opcoes">
        ${Object.entries(cat.categorias).map(([k, c]) => `<label class="opcao"><input type="radio" name="categoria" value="${k}" ${k === estado.categoria ? 'checked' : ''} required> ${esc(c.nome)}</label>`).join('')}
      </div></fieldset>`;
    } else if (e === 1) {
      corpo = `<fieldset><legend>Onde está a barreira?</legend>
        <div class="campo"><label for="localId">Local <span class="dica">prédio do campus ou estabelecimento</span></label>
          <select id="localId" name="localId"><option value="">— Não é um local, é um trecho do caminho —</option>
          ${campus.locais.map((l) => `<option value="${l.id}" ${l.id === estado.localId ? 'selected' : ''}>${esc(l.nome)}</option>`).join('')}</select></div>
        <div class="campo"><label for="trecho">Trecho do caminho <span class="dica">use se a barreira estiver entre um prédio e outro</span></label>
          <select id="trecho" name="trecho"><option value="">—</option>
          ${campus.arestas.map((a) => `<option value="${a.id}" ${a.id === estado.trecho ? 'selected' : ''}>${esc(a.nome)}</option>`).join('')}</select></div>
        <p id="geo-status" class="pequeno suave">${estado.geo ? `📍 Localização registrada (precisão de ~${Math.round(estado.geo.precisao)} m).` : 'Vamos pedir sua localização para anexar ao registro. Ela não é guardada no seu perfil.'}</p>
        <button type="button" class="botao botao-sec botao-peq" id="usar-geo">📍 ${estado.geo ? 'Atualizar' : 'Usar'} minha localização</button>
      </fieldset>`;
    } else if (e === 2) {
      corpo = `<fieldset><legend>Mostre e conte o que aconteceu</legend>
        <div class="campo"><label for="foto">Foto da barreira <span class="dica">a foto é a sua prova. Evite mostrar rostos de outras pessoas.</span></label>
          <input type="file" id="foto" accept="image/*" capture="environment"></div>
        ${estado.foto ? `<img src="${estado.foto}" alt="Prévia da foto anexada" style="max-height:200px;border-radius:10px">` : ''}
        <div class="campo"><label for="descricao">O que aconteceu? <span class="dica">frases curtas. Ex.: “Rampa bloqueada por motos estacionadas.”</span></label>
          <textarea id="descricao" name="descricao" minlength="10" maxlength="1500" required>${esc(estado.descricao)}</textarea></div>
      </fieldset>`;
    } else if (e === 3) {
      const c = cat.categorias[estado.categoria];
      const onde = estado.localId ? campus.locais.find((l) => l.id === estado.localId)?.nome : campus.arestas.find((a) => a.id === estado.trecho)?.nome;
      corpo = `<div class="cartao">
        <h2 style="margin-top:0">Confira antes de enviar</h2>
        <dl>
          <dt><strong>Barreira</strong></dt><dd>${esc(c.nome)}</dd>
          <dt><strong>Onde</strong></dt><dd>${esc(onde)}</dd>
          <dt><strong>Relato</strong></dt><dd>${esc(estado.descricao)}</dd>
          <dt><strong>Foto</strong></dt><dd>${estado.foto ? 'Anexada' : '<span class="etiqueta etiqueta-amarelo">Sem foto — o registro fica mais fraco como prova</span>'}</dd>
          <dt><strong>Localização</strong></dt><dd>${estado.geo ? 'Anexada' : 'Não anexada'}</dd>
        </dl>
        <h3>Norma violada</h3>
        <ul>${c.normas.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
        <h3>O que acontece depois</h3>
        <ol>
          <li>A moderação confere o relato e a foto (para evitar denúncias falsas e exposição de terceiros).</li>
          <li>O registro é enviado ao responsável pelo local, que tem <strong>${cat.diasPrazo} dias</strong> para responder.</li>
          <li><strong>Seu nome e sua deficiência não são informados</strong> ao estabelecimento.</li>
        </ol>
        <label class="opcao"><input type="checkbox" name="confirmado" required> Confirmo que o relato é verdadeiro e quero enviar.</label>
      </div>`;
    }

    main.innerHTML = `${cab}
      <form id="form-relato" novalidate>
        <div id="erro" aria-live="assertive"></div>
        ${corpo}
        <div class="linha" style="margin-top:1rem">
          ${e > 0 ? '<button type="button" class="botao botao-sec" id="voltar">← Voltar</button>' : ''}
          <button type="submit" class="botao ${e === 3 ? 'botao-perigo' : ''}">${e === 3 ? 'Enviar registro' : 'Continuar →'}</button>
        </div>
      </form>`;

    const form = main.querySelector('#form-relato');
    const erro = (msg) => {
      form.querySelector('#erro').innerHTML = `<p class="alerta alerta-erro" role="alert">${esc(msg)}</p>`;
    };
    form.querySelector('#voltar')?.addEventListener('click', () => {
      salvar(form);
      estado.etapa -= 1;
      desenhar();
    });
    form.querySelector('#usar-geo')?.addEventListener('click', () => pedirGeo(true));
    form.querySelector('#foto')?.addEventListener('change', async (ev) => {
      try {
        estado.foto = await lerFoto(ev.target.files[0]);
        salvar(form);
        desenhar();
        anunciar('Foto anexada.');
      } catch (err) {
        erro(err.message);
      }
    });
    if (e === 1 && !estado.geo && !estado.geoPedida) pedirGeo(false);

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      salvar(form);
      if (e === 0 && !estado.categoria) return erro('Escolha o tipo de barreira.');
      if (e === 1 && !estado.localId && !estado.trecho) return erro('Escolha um local ou um trecho do caminho.');
      if (e === 2 && estado.descricao.trim().length < 10) return erro('Descreva a barreira em pelo menos 10 caracteres.');
      if (e < 3) {
        estado.etapa += 1;
        return desenhar();
      }
      if (!form.confirmado.checked) return erro('Marque a confirmação para enviar.');
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      try {
        const r = await api('/api/barreiras', {
          method: 'POST',
          body: { categoria: estado.categoria, localId: estado.localId || null, trecho: estado.localId ? null : estado.trecho || null, descricao: estado.descricao, foto: estado.foto, geo: estado.geo && { lat: estado.geo.lat, lng: estado.geo.lng }, confirmado: true },
        });
        prefs.adicionarRegistro(r.protocolo, r.chave);
        sucesso(r);
      } catch (err) {
        btn.disabled = false;
        erro(err.message);
      }
    });
    main.querySelector('h1').focus();
  }

  function salvar(form) {
    const fd = new FormData(form);
    if (fd.has('categoria')) estado.categoria = fd.get('categoria');
    if (form.localId) estado.localId = form.localId.value;
    if (form.trecho) estado.trecho = form.trecho.value;
    if (fd.has('descricao')) estado.descricao = fd.get('descricao');
  }

  function pedirGeo(manual) {
    estado.geoPedida = true;
    const st = main.querySelector('#geo-status');
    if (!('geolocation' in navigator)) {
      if (st) st.textContent = 'Seu aparelho não informa localização. Escolha o local na lista.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        estado.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude, precisao: pos.coords.accuracy };
        const s = main.querySelector('#geo-status');
        if (s) s.textContent = `📍 Localização registrada (precisão de ~${Math.round(pos.coords.accuracy)} m).`;
      },
      () => {
        const s = main.querySelector('#geo-status');
        if (s && manual) s.textContent = 'Não foi possível obter a localização. Tudo bem: o local escolhido na lista basta.';
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function sucesso(r) {
    main.innerHTML = `
      <h1>Registro enviado</h1>
      <div class="alerta alerta-ok" role="status">
        <p style="margin:0">Seu protocolo é <span class="protocolo">${esc(r.protocolo)}</span>.</p>
      </div>
      <div class="cartao">
        <h2 style="margin-top:0">E agora?</h2>
        <ol class="passos-internos">
          <li><strong>Moderação:</strong> conferimos o relato e a foto.</li>
          <li><strong>Envio:</strong> o responsável recebe o registro com a norma violada e tem ${cat.diasPrazo} dias para responder.</li>
          <li><strong>Acompanhe</strong> em “Meus registros”. Se não houver resposta, mostramos a quem recorrer.</li>
        </ol>
        <p class="pequeno suave">O protocolo e a chave de acompanhamento ficaram guardados neste aparelho.</p>
        <div class="linha"><a class="botao" href="#/registros">Acompanhar meus registros</a><a class="botao botao-sec" href="#/registro/${esc(r.protocolo)}?chave=${encodeURIComponent(r.chave)}">Ver documento</a></div>
      </div>`;
    main.querySelector('h1').focus();
    toast('Registro enviado. Obrigado por avisar a comunidade.');
  }

  desenhar();
}
