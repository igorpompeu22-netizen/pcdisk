import { api, getCatalogo } from '../api.js';
import { esc, toast } from '../ui.js';

function metrica(titulo, valor, meta) {
  const ok = valor !== null && valor >= meta;
  return `<div class="cartao metrica"><span class="suave">${esc(titulo)}</span><strong>${valor === null ? '—' : `${valor}%`}</strong>
    <span class="etiqueta ${valor === null ? '' : ok ? 'etiqueta-verde' : 'etiqueta-vermelho'}">meta: ${meta}%</span>
    <div class="barra" aria-hidden="true"><span style="width:${valor ?? 0}%"></span><i class="meta" style="left:${meta}%"></i></div></div>`;
}

export async function render(main) {
  const [ind, cat] = await Promise.all([api('/api/indicadores'), getCatalogo()]);
  const sn = (nome, rotulo) => `<fieldset><legend>${esc(rotulo)}</legend><div class="tri"><label><input type="radio" name="${nome}" value="sim" required> Sim</label><label><input type="radio" name="${nome}" value="nao"> Não</label></div></fieldset>`;
  main.innerHTML = `
    <h1>Testes com usuários e indicadores</h1>
    <p class="lead">Hipótese central: a pessoa com deficiência confia mais e sai mais de casa quando a informação de acessibilidade tem um responsável e é confirmada por outros usuários.</p>
    <p>Validamos quando, no teste com usuários PcD do campus, pelo menos <strong>80%</strong> entendem o semáforo e registram uma barreira sem ajuda, e pelo menos <strong>70%</strong> preferem a informação verificada à do Google Maps.</p>
    <div class="grade">
      ${metrica('Entendem o semáforo', ind.compreensaoSemaforo, ind.metas.compreensao)}
      ${metrica('Registram barreira sem ajuda', ind.registroSemAjuda, ind.metas.compreensao)}
      ${metrica('Preferem a informação verificada', ind.prefereVerificada, ind.metas.preferencia)}
      ${metrica('Mudaria a decisão de ir ao local', ind.mudariaDecisao, ind.metas.preferencia)}
    </div>
    <p class="suave">Participantes: <strong>${ind.participantes}</strong> (mínimo ${ind.metas.participantes}) · Locais: ${ind.locais} · Verificações da comunidade: ${ind.confirmacoes} · Registros de barreira aprovados: ${ind.barreiras.total} (${ind.barreiras.respondidas} respondidos, ${ind.barreiras.resolvidas} resolvidos)</p>

    <h2>Registrar uma sessão de teste</h2>
    <form id="teste" class="cartao">
      <p class="pequeno suave">Aplicado pela equipe com o participante. Não registramos nome nem dado de contato.</p>
      ${sn('entendeuSemaforo', 'Ao ver um local, o participante explicou corretamente o que significa verde, amarelo e vermelho?')}
      ${sn('registrouSemAjuda', 'O participante registrou uma barreira do início ao fim sem ajuda?')}
      ${sn('prefereVerificada', 'Prefere a informação verificada da Rota Livre à do Google Maps?')}
      ${sn('mudariaDecisao', 'A informação mudaria a decisão de ir ao local?')}
      <div class="campo"><label for="t-perfil">Perfil do participante <span class="dica">opcional</span></label><select id="t-perfil" name="perfil"><option value="">Prefere não informar</option>${Object.entries(cat.perfis).map(([k, p]) => `<option value="${k}">${esc(p.nome)}</option>`).join('')}</select></div>
      <div class="campo"><label for="t-com">Comentário</label><textarea id="t-com" name="comentario" maxlength="600"></textarea></div>
      <button class="botao">Salvar sessão</button>
    </form>`;
  main.querySelector('#teste').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const b = (k) => (fd.get(k) ? fd.get(k) === 'sim' : null);
    await api('/api/testes', { method: 'POST', body: { entendeuSemaforo: b('entendeuSemaforo'), registrouSemAjuda: b('registrouSemAjuda'), prefereVerificada: b('prefereVerificada'), mudariaDecisao: b('mudariaDecisao'), perfil: fd.get('perfil'), comentario: fd.get('comentario') } });
    toast('Sessão registrada.');
    render(main);
  });
}
