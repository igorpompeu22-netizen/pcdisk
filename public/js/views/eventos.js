import { api, getCatalogo } from '../api.js';
import { esc, toast } from '../ui.js';

const COR = { ouro: 'amarelo', prata: 'azul', bronze: 'neutro', sem_selo: 'vermelho' };

export async function render(main) {
  const [cat, campus] = await Promise.all([getCatalogo(), api('/api/campus')]);

  async function desenhar() {
    const eventos = await api('/api/eventos');
    main.innerHTML = `
      <h1>Eventos acessíveis</h1>
      <p class="lead">Agenda do campus com selo de acessibilidade. Organizadores preenchem o checklist; quem vai ao evento sabe antes o que vai encontrar.</p>
      ${eventos.map((e) => `
        <article class="cartao">
          <div class="linha entre"><h2 style="margin:0;font-size:1.2rem">${esc(e.titulo)}</h2><span class="etiqueta etiqueta-${COR[e.selo.nivel]}">${esc(e.selo.nome)} · ${e.selo.pct}%</span></div>
          <p class="suave">${new Date(`${e.data}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}${e.hora ? ` às ${esc(e.hora)}` : ''} · ${esc(e.localNome ?? 'local a definir')} · ${esc(e.organizador)}</p>
          ${e.descricao ? `<p>${esc(e.descricao)}</p>` : ''}
          <details><summary><strong>Checklist de acessibilidade (${e.selo.ok}/${e.selo.total})</strong></summary>
            <ul class="lista-limpa">${Object.entries(cat.checklistEvento).map(([k, t]) => `<li>${e.checklist[k] ? '✅' : '❌'} ${esc(t)}</li>`).join('')}</ul>
          </details>
          ${e.localId ? `<a class="pequeno" href="#/local/${esc(e.localId)}">Ver acessibilidade do local</a>` : ''}
        </article>`).join('') || '<p>Nenhum evento agendado.</p>'}

      <h2>Divulgar um evento</h2>
      <form id="form-evento" class="cartao">
        <div class="grade">
          <div class="campo"><label for="ev-titulo">Título</label><input type="text" id="ev-titulo" name="titulo" required maxlength="160"></div>
          <div class="campo"><label for="ev-org">Organizador</label><input type="text" id="ev-org" name="organizador" required maxlength="120"></div>
          <div class="campo"><label for="ev-data">Data</label><input type="date" id="ev-data" name="data" required></div>
          <div class="campo"><label for="ev-hora">Hora</label><input type="time" id="ev-hora" name="hora"></div>
          <div class="campo"><label for="ev-local">Local</label><select id="ev-local" name="localId">${campus.locais.map((l) => `<option value="${l.id}">${esc(l.nome)}</option>`).join('')}</select></div>
        </div>
        <div class="campo"><label for="ev-desc">Descrição</label><textarea id="ev-desc" name="descricao" maxlength="800"></textarea></div>
        <fieldset><legend>Checklist para organizadores</legend><div class="opcoes">
          ${Object.entries(cat.checklistEvento).map(([k, t]) => `<label class="opcao"><input type="checkbox" name="ck" value="${k}"> ${esc(t)}</label>`).join('')}
        </div></fieldset>
        <p class="pequeno suave" id="previa-selo" aria-live="polite"></p>
        <button class="botao">Publicar evento</button>
      </form>`;

    const form = main.querySelector('#form-evento');
    const total = Object.keys(cat.checklistEvento).length;
    const previa = () => {
      const n = form.querySelectorAll('[name=ck]:checked').length;
      const pct = Math.round((n / total) * 100);
      const nome = pct >= 85 ? 'Ouro' : pct >= 60 ? 'Prata' : pct >= 35 ? 'Bronze' : 'sem selo';
      form.querySelector('#previa-selo').textContent = `Prévia: ${n} de ${total} itens (${pct}%) — ${nome}.`;
    };
    form.addEventListener('change', previa);
    previa();
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const checklist = Object.fromEntries(fd.getAll('ck').map((k) => [k, true]));
      try {
        const e = await api('/api/eventos', { method: 'POST', body: { ...Object.fromEntries(fd), checklist } });
        toast(`Evento publicado — ${e.selo.nome}.`);
        await desenhar();
      } catch (err) {
        toast(err.message, 'erro');
      }
    });
  }
  await desenhar();
}
