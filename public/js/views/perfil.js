import { getCatalogo } from '../api.js';
import { esc, toast, dataHoraBR } from '../ui.js';
import { prefs } from '../prefs.js';

export async function render(main) {
  const cat = await getCatalogo();
  const atual = prefs.perfil();
  const consent = prefs.consentimento();

  main.innerHTML = `
    <h1>Meu perfil de necessidade</h1>
    <div class="cartao">
      <h2 style="margin-top:0">Antes de começar: seus dados</h2>
      <ul>
        <li>Saber sua necessidade de mobilidade é um <strong>dado de saúde</strong> — um dado sensível.</li>
        <li>Usamos essa informação <strong>só</strong> para mostrar se um local é compatível com você e para calcular rotas.</li>
        <li>Ela fica <strong>guardada apenas neste aparelho</strong>. Não enviamos seu perfil a ninguém.</li>
        <li>Você pode <strong>apagar tudo</strong> a qualquer momento, nesta página.</li>
      </ul>
      <p class="pequeno suave">Base legal: LGPD (Lei 13.709/2018), art. 5º, II, e art. 11, I — consentimento específico e destacado.</p>
    </div>

    <form id="form-perfil" class="cartao" style="margin-top:1rem">
      <fieldset><legend>Qual opção descreve melhor você?</legend>
        <div class="opcoes">
          ${Object.entries(cat.perfis).map(([k, p]) => `<label class="opcao"><input type="radio" name="perfil" value="${k}" ${k === atual ? 'checked' : ''} required> ${esc(p.nome)}</label>`).join('')}
        </div>
      </fieldset>
      <label class="opcao"><input type="checkbox" name="consentimento" ${consent?.aceito ? 'checked' : ''} required> Concordo que a Rota Livre use este perfil, guardado só no meu aparelho, para mostrar a compatibilidade dos locais e calcular rotas.</label>
      <div class="linha" style="margin-top:1rem"><button class="botao">Salvar perfil</button></div>
      ${consent?.aceito ? `<p class="pequeno suave">Consentimento registrado em ${dataHoraBR(consent.em)}.</p>` : ''}
    </form>

    <div class="cartao" style="margin-top:1rem">
      <h2 style="margin-top:0">Apagar meus dados</h2>
      <p>Remove do aparelho o seu perfil, o consentimento, as preferências e os protocolos que você acompanha.</p>
      <button class="botao botao-perigo" id="apagar">Apagar tudo</button>
    </div>
  `;

  main.querySelector('#form-perfil').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    if (!fd.get('consentimento')) return toast('Marque o consentimento para salvar o perfil.', 'erro');
    prefs.salvarPerfil(fd.get('perfil'));
    toast('Perfil salvo neste aparelho.');
    location.hash = '#/locais';
  });
  main.querySelector('#apagar').addEventListener('click', () => {
    if (!confirm('Apagar perfil, consentimento e protocolos guardados neste aparelho?')) return;
    prefs.apagarTudo();
    location.reload();
  });
}
