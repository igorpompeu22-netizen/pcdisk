import { api } from '../api.js';
import { esc, STATUS_EQUIP } from '../ui.js';
import { prefs } from '../prefs.js';

export async function render(main) {
  const equip = await api('/api/equipamentos');
  const fora = equip.filter((e) => e.status !== 'funcionando');
  const perfil = prefs.perfil();

  main.innerHTML = `
    <h1>Saiba antes de sair. Tenha o que fazer quando algo falha.</h1>
    <p class="lead">A Rota Livre mostra se um lugar é acessível de verdade para o seu perfil, guia o trajeto até e dentro dele e transforma cada barreira em um registro com a norma violada.</p>

    ${fora.length ? `
      <div class="alerta alerta-erro" role="status">
        <strong>Agora no campus:</strong>
        <ul>${fora.map((e) => `<li>${esc(e.nome)} — <strong>${esc(STATUS_EQUIP[e.status].rotulo.toLowerCase())}</strong>${e.obs ? `. ${esc(e.obs)}` : ''}</li>`).join('')}</ul>
        <a href="#/painel">Ver painel completo</a>
      </div>` : '<p class="alerta alerta-ok">Todos os elevadores e rotas monitorados estão funcionando agora.</p>'}

    <div class="atalhos">
      <a class="atalho ${fora.length ? 'atalho-alerta' : ''}" href="#/painel"><span class="atalho-icone" aria-hidden="true">🚦</span><strong>Painel agora</strong><span>Elevadores parados e rotas interditadas, em tempo real.</span></a>
      <a class="atalho" href="#/locais"><span class="atalho-icone" aria-hidden="true">📍</span><strong>Buscar um local</strong><span>Veja se é compatível com você: verde, amarelo ou vermelho.</span></a>
      <a class="atalho" href="#/rota"><span class="atalho-icone" aria-hidden="true">🧭</span><strong>Traçar rota acessível</strong><span>Passo a passo, desviando de escadas e equipamentos parados.</span></a>
      <a class="atalho atalho-alerta" href="#/relatar"><span class="atalho-icone" aria-hidden="true">📸</span><strong>Relatar barreira</strong><span>Foto, local e protocolo com a norma violada.</span></a>
      <a class="atalho" href="#/direitos"><span class="atalho-icone" aria-hidden="true">⚖️</span><strong>Meus direitos</strong><span>Respostas curtas sobre a LBI, o CDC e a quem reclamar.</span></a>
      <a class="atalho" href="#/eventos"><span class="atalho-icone" aria-hidden="true">📅</span><strong>Eventos acessíveis</strong><span>Agenda com selo de acessibilidade.</span></a>
    </div>

    ${perfil ? '' : `<div class="cartao"><h2>Comece pelo seu perfil</h2><p>Diga quais são as suas necessidades de mobilidade e o app cruza essa informação com cada local. Seu perfil fica guardado só no seu aparelho.</p><a class="botao" href="#/perfil">Definir meu perfil</a></div>`}

    <h2>O que fazer quando encontrar uma barreira — em 3 passos</h2>
    <ol class="passos-internos">
      <li><strong>Registre:</strong> toque em “Relatar barreira”, tire a foto e confirme o local.</li>
      <li><strong>Receba o protocolo:</strong> o registro cita a norma violada e é enviado ao responsável, com prazo para responder.</li>
      <li><strong>Acompanhe:</strong> se não houver resposta, o app mostra os canais — ouvidoria, Procon, Ministério Público ou Defensoria.</li>
    </ol>

    <h2>Três níveis de confiança</h2>
    <div class="grade">
      <div class="cartao"><h3>★ Autodeclaração</h3><p>O próprio estabelecimento declara, item a item, com base na NBR 9050 — e responde pela informação (CDC, art. 6º, III, e art. 31).</p></div>
      <div class="cartao"><h3>★★ Comunidade</h3><p>Quem vai ao local confirma ou contesta cada item, com foto. Você vê quando foi a última verificação.</p></div>
      <div class="cartao"><h3>★★★ Auditoria</h3><p>Um profissional de acessibilidade verifica o local e registra o resultado.</p></div>
    </div>
  `;
}
