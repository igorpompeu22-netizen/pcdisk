import { api } from '../api.js';
import { esc, falar } from '../ui.js';

export async function render(main) {
  const direitos = await api('/api/direitos');
  main.innerHTML = `
    <h1>Meus direitos</h1>
    <p class="lead">Respostas curtas, em linguagem simples. A lei aparece só se você quiser ver.</p>
    <section class="cartao" aria-labelledby="h-chat">
      <h2 id="h-chat" style="margin-top:0">Pergunte</h2>
      <div class="chat" id="chat" role="log" aria-live="polite">
        <div class="bolha bolha-app">Olá! Me conte o que aconteceu. Ex.: “o elevador está parado”, “me recusaram na entrada”, “tenho direito a tempo extra na prova?”.</div>
      </div>
      <form id="form-chat" class="linha" style="margin-top:.75rem">
        <label for="pergunta" class="sr">Sua pergunta</label>
        <input type="text" id="pergunta" name="pergunta" autocomplete="off" placeholder="Escreva sua dúvida" style="flex:1;min-width:200px" required>
        <button class="botao">Perguntar</button>
      </form>
    </section>
    <h2>Perguntas frequentes</h2>
    ${direitos.map((d) => `
      <article class="cartao" id="d-${d.id}">
        <h3 style="margin-top:0">${esc(d.pergunta)}</h3>
        <p>${esc(d.resposta)}</p>
        <details class="norma"><summary>Ver a norma</summary><p>${esc(d.norma)}</p></details>
        <button class="botao botao-sec botao-peq" data-ouvir="${d.id}">🔊 Ouvir</button>
      </article>`).join('')}
    <p class="alerta alerta-info">A Rota Livre orienta e encaminha; não presta consultoria jurídica. Para um caso concreto, procure a Defensoria Pública ou um(a) advogado(a).</p>
  `;

  const chat = main.querySelector('#chat');
  const add = (html, quem) => {
    const div = document.createElement('div');
    div.className = `bolha bolha-${quem}`;
    div.innerHTML = html;
    chat.append(div);
    chat.scrollTop = chat.scrollHeight;
  };
  main.querySelector('#form-chat').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const input = ev.target.pergunta;
    const pergunta = input.value.trim();
    if (!pergunta) return;
    add(esc(pergunta), 'eu');
    input.value = '';
    const r = await api('/api/direitos/perguntar', { method: 'POST', body: { pergunta } });
    if (r.encontrou) {
      add(`<strong>${esc(r.pergunta)}</strong><p style="margin:.3rem 0">${esc(r.resposta)}</p><details class="norma"><summary>Ver a norma</summary><p>${esc(r.norma)}</p></details>
        ${r.relacionados.length ? `<p class="pequeno" style="margin:.3rem 0 0">Veja também: ${r.relacionados.map((x) => `<a href="#/direitos" data-ir="${x.id}">${esc(x.pergunta)}</a>`).join(' · ')}</p>` : ''}`, 'app');
    } else {
      add(`${esc(r.resposta)}<ul>${r.relacionados.map((x) => `<li><a href="#/direitos" data-ir="${x.id}">${esc(x.pergunta)}</a></li>`).join('')}</ul>`, 'app');
    }
  });
  main.addEventListener('click', (ev) => {
    const ir = ev.target.closest('[data-ir]');
    if (ir) {
      ev.preventDefault();
      const alvo = main.querySelector(`#d-${ir.dataset.ir}`);
      alvo.scrollIntoView({ behavior: 'smooth' });
      alvo.querySelector('h3').setAttribute('tabindex', '-1');
      alvo.querySelector('h3').focus();
    }
    const ouvir = ev.target.closest('[data-ouvir]');
    if (ouvir) {
      const d = direitos.find((x) => x.id === ouvir.dataset.ouvir);
      falar(`${d.pergunta} ${d.resposta}`);
    }
  });
}
