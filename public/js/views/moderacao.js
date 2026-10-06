import { api, getCatalogo } from '../api.js';
import { esc, toast, dataHoraBR } from '../ui.js';

const CHAVE = 'rl.adminToken';

export async function render(main) {
  const cat = await getCatalogo();
  const tok = sessionStorage.getItem(CHAVE);
  if (!tok) {
    main.innerHTML = `
      <h1>Moderação</h1>
      <p class="lead">Equipe Rota Livre: revisão de autodeclarações, moderação de registros contra denúncias falsas e registro de auditorias.</p>
      <form id="login" class="cartao"><div class="campo"><label for="adm">Código da moderação</label><input type="password" id="adm" name="t" required></div><button class="botao">Entrar</button>
      <p class="pequeno suave">Demonstração: <code>admin-demo</code>.</p></form>`;
    main.querySelector('#login').addEventListener('submit', (ev) => {
      ev.preventDefault();
      sessionStorage.setItem(CHAVE, ev.target.t.value.trim());
      render(main);
    });
    return;
  }
  const h = { 'X-Admin-Token': tok };
  let dados;
  try {
    dados = await api('/api/moderacao', { headers: h });
  } catch (e) {
    sessionStorage.removeItem(CHAVE);
    toast(e.message, 'erro');
    return render(main);
  }
  const locais = await api('/api/locais');

  const tela = document.createElement('div');
  main.replaceChildren(tela);
  tela.innerHTML = `
    <div class="linha entre"><h1>Moderação</h1><button class="botao botao-sec botao-peq" id="sair">Sair</button></div>
    <h2>Registros aguardando moderação (${dados.barreiras.length})</h2>
    <p class="suave pequeno">Confira se o relato é consistente e se a foto não expõe o rosto de terceiros. Ao aprovar, o registro é enviado ao responsável com prazo de ${cat.diasPrazo} dias.</p>
    ${dados.barreiras.map((b) => `
      <article class="cartao" data-protocolo="${esc(b.protocolo)}">
        <div class="linha entre"><span class="protocolo">${esc(b.protocolo)}</span><span class="pequeno suave">${dataHoraBR(b.criadoEm)}</span></div>
        <p><strong>${esc(b.categoriaNome)}</strong> — ${esc(b.localNome ?? b.trechoNome ?? '')}</p>
        <p>${esc(b.descricao)}</p>
        ${b.foto ? `<img src="${esc(b.foto)}" alt="Foto anexada ao registro ${esc(b.protocolo)}" style="max-height:220px;border-radius:8px">` : '<p class="etiqueta etiqueta-amarelo">Sem foto</p>'}
        ${b.geo ? `<p class="pequeno">Localização: ${b.geo.lat.toFixed(5)}, ${b.geo.lng.toFixed(5)}</p>` : ''}
        <div class="campo"><label for="m-${esc(b.protocolo)}">Motivo (se rejeitar)</label><input type="text" id="m-${esc(b.protocolo)}" name="motivo"></div>
        <div class="linha"><button class="botao botao-ok botao-peq" data-decisao="aprovar">Aprovar e enviar</button><button class="botao botao-perigo botao-peq" data-decisao="rejeitar">Rejeitar</button></div>
      </article>`).join('') || '<p class="suave">Nada pendente.</p>'}

    <h2>Autodeclarações para revisar (${dados.locais.length})</h2>
    ${dados.locais.map((l) => `
      <article class="cartao" data-local="${esc(l.id)}">
        <p><strong>${esc(l.nome)}</strong> — ${esc(l.estabelecimento?.razaoSocial ?? '')} · CNPJ ${esc(l.estabelecimento?.cnpj ?? '')} · ${esc(l.estabelecimento?.responsavel ?? '')}</p>
        <ul class="pequeno">${Object.entries(l.itens ?? {}).map(([k, v]) => `<li>${esc(cat.itens[k]?.curto ?? k)}: ${v.declarado === 'na' ? 'não se aplica' : v.declarado ? 'tem' : 'não tem'}</li>`).join('') || '<li>Nenhum item declarado ainda.</li>'}</ul>
        <button class="botao botao-ok botao-peq" data-revisar>Revisado — conceder selo nível 1</button>
      </article>`).join('') || '<p class="suave">Nada pendente.</p>'}

    <h2>Registrar auditoria profissional (selo nível 3)</h2>
    <form id="auditoria" class="cartao">
      <div class="grade">
        <div class="campo"><label for="a-local">Local</label><select id="a-local" name="local">${locais.map((l) => `<option value="${l.id}">${esc(l.nome)}</option>`).join('')}</select></div>
        <div class="campo"><label for="a-aud">Auditor(a) responsável</label><input type="text" id="a-aud" name="auditor" required></div>
      </div>
      <fieldset><legend>Itens conferidos no local</legend>
        ${Object.entries(cat.itens).map(([k, it]) => `<div class="campo"><span style="font-weight:700;display:block" id="ai-${k}">${esc(it.nome)}</span><div class="tri" role="group" aria-labelledby="ai-${k}"><label><input type="radio" name="${k}" value="true"> Conforme</label><label><input type="radio" name="${k}" value="false"> Não conforme</label><label><input type="radio" name="${k}" value="" checked> Não avaliado</label></div></div>`).join('')}
      </fieldset>
      <button class="botao">Registrar auditoria</button>
    </form>`;

  tela.querySelector('#sair').addEventListener('click', () => {
    sessionStorage.removeItem(CHAVE);
    render(main);
  });
  tela.addEventListener('click', async (ev) => {
    const dec = ev.target.closest('[data-decisao]');
    const rev = ev.target.closest('[data-revisar]');
    try {
      if (dec) {
        const art = dec.closest('[data-protocolo]');
        await api(`/api/moderacao/barreiras/${art.dataset.protocolo}`, { method: 'POST', headers: h, body: { decisao: dec.dataset.decisao, motivo: art.querySelector('[name=motivo]').value } });
        toast(dec.dataset.decisao === 'aprovar' ? 'Aprovado e enviado ao responsável.' : 'Registro rejeitado.');
        render(main);
      } else if (rev) {
        await api(`/api/moderacao/locais/${rev.closest('[data-local]').dataset.local}/revisar`, { method: 'POST', headers: h });
        toast('Autodeclaração revisada.');
        render(main);
      }
    } catch (e) {
      toast(e.message, 'erro');
    }
  });
  tela.querySelector('#auditoria').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const itens = {};
    for (const k of Object.keys(cat.itens)) if (fd.get(k)) itens[k] = fd.get(k) === 'true';
    try {
      await api(`/api/moderacao/locais/${fd.get('local')}/auditoria`, { method: 'POST', headers: h, body: { auditor: fd.get('auditor'), itens } });
      toast('Auditoria registrada — selo nível 3.');
      ev.target.reset();
    } catch (e) {
      toast(e.message, 'erro');
    }
  });
}
