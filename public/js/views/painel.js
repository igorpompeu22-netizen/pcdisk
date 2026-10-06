import { api, aoVivo } from '../api.js';
import { esc, quando, toast, anunciar, STATUS_EQUIP } from '../ui.js';

const TIPO = { elevador: '🛗 Elevador', rampa: '↗️ Rampa', rota: '🛣️ Rota', plataforma: '⬆️ Plataforma' };

export async function render(main) {
  main.innerHTML = `
    <div class="linha entre">
      <h1>Painel agora</h1>
      <span class="ao-vivo" id="ao-vivo">Ao vivo</span>
    </div>
    <p class="lead">Consulte antes de sair de casa: o que está funcionando <em>agora</em>. As informações vêm da gestão do campus, dos estabelecimentos e de quem está no local.</p>
    <div id="lista" aria-live="polite"></div>
  `;
  const lista = main.querySelector('#lista');

  async function carregar(destacar) {
    const equip = await api('/api/equipamentos');
    lista.innerHTML = equip.map((e) => {
      const s = STATUS_EQUIP[e.status];
      return `
      <article class="cartao equip ${destacar === e.id ? 'destaque-novo' : ''}" data-id="${esc(e.id)}">
        <div class="equip-status cor-${s.cor}" aria-hidden="true">${s.icone}</div>
        <div style="flex:1">
          <div class="linha entre">
            <h3>${esc(e.nome)}</h3>
            <span class="etiqueta etiqueta-${s.cor}">${esc(s.rotulo)}</span>
          </div>
          <p class="suave pequeno">${TIPO[e.tipo] ?? ''}${e.localNome ? ` · ${esc(e.localNome)}` : ''} · atualizado ${quando(e.atualizadoEm)} por ${e.fonte === 'gestao' ? 'gestão do campus' : e.fonte === 'estabelecimento' ? 'estabelecimento' : 'usuário(s)'}${e.confirmacoes > 1 ? ` · confirmado por ${e.confirmacoes} pessoas` : ''}</p>
          ${e.obs ? `<p>${esc(e.obs)}</p>` : ''}
          <div class="linha">
            <button class="botao botao-sec botao-peq" data-acao="confirmar">Ainda está assim</button>
            <button class="botao botao-sec botao-peq" data-acao="mudar" aria-expanded="false">Mudou? Informar</button>
            ${e.status !== 'funcionando' ? `<a class="botao botao-sec botao-peq" href="#/relatar?${e.localId ? `local=${esc(e.localId)}&` : ''}categoria=${e.tipo === 'elevador' ? 'elevador' : e.tipo === 'rampa' ? 'rampa' : 'calcada'}">Registrar barreira</a>` : ''}
          </div>
          <form class="mudar" hidden>
            <fieldset>
              <legend>Como está agora?</legend>
              <div class="opcoes">
                ${Object.entries(STATUS_EQUIP).map(([k, v]) => `<label class="opcao"><input type="radio" name="status" value="${k}" ${k === e.status ? 'checked' : ''}> ${v.icone} ${v.rotulo}</label>`).join('')}
              </div>
              <div class="campo" style="margin-top:.75rem"><label for="obs-${esc(e.id)}">Observação <span class="dica">opcional — ex.: “porta não abre no térreo”</span></label><input type="text" id="obs-${esc(e.id)}" name="obs" maxlength="280"></div>
              <button class="botao" type="submit">Enviar</button>
            </fieldset>
          </form>
        </div>
      </article>`;
    }).join('');
  }

  lista.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-acao]');
    if (!btn) return;
    const card = btn.closest('[data-id]');
    if (btn.dataset.acao === 'confirmar') {
      await api(`/api/equipamentos/${card.dataset.id}/confirmar`, { method: 'POST' });
      toast('Obrigado! Sua confirmação ajuda quem ainda vai sair de casa.');
    } else {
      const form = card.querySelector('form.mudar');
      form.hidden = !form.hidden;
      btn.setAttribute('aria-expanded', String(!form.hidden));
      if (!form.hidden) form.querySelector('input:checked')?.focus();
    }
  });
  lista.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const card = ev.target.closest('[data-id]');
    const fd = new FormData(ev.target);
    try {
      await api(`/api/equipamentos/${card.dataset.id}/status`, { method: 'POST', body: { status: fd.get('status'), obs: fd.get('obs') } });
      toast('Status atualizado para todos os usuários.');
    } catch (e) {
      toast(e.message, 'erro');
    }
  });

  await carregar();
  return aoVivo(async (tipo, dados) => {
    if (tipo !== 'equipamento') return;
    await carregar(dados.id);
    anunciar(`Atualização: ${dados.nome} — ${STATUS_EQUIP[dados.status]?.rotulo}.`);
  });
}
