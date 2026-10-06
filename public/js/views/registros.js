import { api, aoVivo } from '../api.js';
import { esc, dataBR, dataHoraBR, toast, STATUS_REGISTRO } from '../ui.js';
import { prefs } from '../prefs.js';

function canais(lista) {
  if (!lista?.length) return '';
  return `<div class="alerta alerta-aviso"><strong>O que fazer agora:</strong><ol>${lista.map((c) => `<li><strong>${esc(c.nome)}</strong> — ${esc(c.quando)}</li>`).join('')}</ol><p class="pequeno" style="margin:0">Leve o número de protocolo e o documento. O app orienta e encaminha; não representa você juridicamente.</p></div>`;
}

function cartao(b, chave) {
  const s = STATUS_REGISTRO[b.status] ?? STATUS_REGISTRO.em_moderacao;
  return `
  <article class="cartao">
    <div class="linha entre"><span class="protocolo">${esc(b.protocolo)}</span><span class="etiqueta etiqueta-${s.cor}">${s.rotulo}</span></div>
    <h2 style="margin:.4rem 0;font-size:1.15rem">${esc(b.categoriaNome)} — ${esc(b.localNome ?? b.trechoNome ?? '')}</h2>
    <p>${esc(b.descricao)}</p>
    ${b.prazoEm ? `<p class="pequeno">Prazo de resposta: <strong>${dataBR(b.prazoEm)}</strong>${b.vencido ? ' <span class="etiqueta etiqueta-vermelho">prazo vencido</span>' : ''}</p>` : ''}
    <ul class="linha-tempo">${b.historico.map((h) => `<li><span class="pequeno suave">${dataHoraBR(h.em)}</span><br>${esc(h.texto)}</li>`).join('')}</ul>
    ${canais(b.canais)}
    <a class="botao botao-sec botao-peq" href="#/registro/${esc(b.protocolo)}${chave ? `?chave=${encodeURIComponent(chave)}` : ''}">Ver documento formal</a>
  </article>`;
}

async function lista(main) {
  async function desenhar() {
    const meus = prefs.registros();
    const dados = meus.length ? await api('/api/barreiras/acompanhar', { method: 'POST', body: { itens: meus } }) : [];
    const chave = Object.fromEntries(meus.map((m) => [m.protocolo, m.chave]));
    main.innerHTML = `
      <h1>Meus registros</h1>
      <p class="lead">Acompanhe o status de cada barreira que você registrou. Estes protocolos ficam guardados só neste aparelho.</p>
      ${dados.length ? dados.map((b) => cartao(b, chave[b.protocolo])).join('') : '<p>Você ainda não registrou nenhuma barreira. <a href="#/relatar">Relatar uma barreira</a></p>'}
      <details class="cartao" style="margin-top:1rem"><summary><strong>Acompanhar um protocolo de outro aparelho</strong></summary>
        <form id="importar" style="margin-top:.75rem">
          <div class="campo"><label for="imp-p">Protocolo</label><input type="text" id="imp-p" name="protocolo" placeholder="RL-2026-000001" required></div>
          <div class="campo"><label for="imp-c">Chave de acompanhamento</label><input type="text" id="imp-c" name="chave" required></div>
          <button class="botao">Adicionar</button>
        </form>
      </details>
      <h2>Registros públicos recentes</h2>
      <div id="publicos"></div>`;
    const publicos = await api('/api/barreiras');
    main.querySelector('#publicos').innerHTML = publicos.slice(0, 10).map((b) => `<p class="cartao"><span class="protocolo">${esc(b.protocolo)}</span> · ${esc(b.categoriaNome)} — ${esc(b.localNome ?? b.trechoNome ?? '')} · <span class="etiqueta etiqueta-${STATUS_REGISTRO[b.status].cor}">${STATUS_REGISTRO[b.status].rotulo}</span> <a href="#/registro/${esc(b.protocolo)}">ver</a></p>`).join('') || '<p class="suave">Nenhum.</p>';
    main.querySelector('#importar').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const r = await api('/api/barreiras/acompanhar', { method: 'POST', body: { itens: [{ protocolo: fd.get('protocolo').trim(), chave: fd.get('chave').trim() }] } });
      if (!r.length) return toast('Protocolo ou chave não conferem.', 'erro');
      prefs.adicionarRegistro(fd.get('protocolo').trim(), fd.get('chave').trim());
      desenhar();
    });
  }
  await desenhar();
  return aoVivo((tipo) => tipo === 'barreira' && desenhar());
}

async function documento(main, protocolo, chave) {
  const d = await api(`/api/barreiras/${encodeURIComponent(protocolo)}/documento${chave ? `?chave=${encodeURIComponent(chave)}` : ''}`);
  main.innerHTML = `
    <p class="pequeno nao-imprimir"><a href="#/registros">← Meus registros</a></p>
    <h1>Registro ${esc(d.protocolo)}</h1>
    <div class="linha nao-imprimir" style="margin-bottom:1rem">
      <span class="etiqueta etiqueta-${STATUS_REGISTRO[d.status].cor}">${STATUS_REGISTRO[d.status].rotulo}</span>
      <button class="botao botao-peq" id="imprimir">🖨️ Imprimir ou salvar PDF</button>
      <button class="botao botao-sec botao-peq" id="copiar">📋 Copiar texto</button>
    </div>
    <div class="documento">${esc(d.documento)}</div>
    ${d.foto ? `<h2>Registro fotográfico</h2><img src="${esc(d.foto)}" alt="Foto da barreira registrada no protocolo ${esc(d.protocolo)}" style="max-width:480px;border-radius:8px">` : ''}
    <h2 class="nao-imprimir">Histórico</h2>
    <ul class="linha-tempo nao-imprimir">${d.historico.map((h) => `<li><span class="pequeno suave">${dataHoraBR(h.em)}</span><br>${esc(h.texto)}</li>`).join('')}</ul>
    <div class="nao-imprimir">${canais(d.canais)}</div>`;
  main.querySelector('#imprimir').addEventListener('click', () => print());
  main.querySelector('#copiar').addEventListener('click', async () => {
    await navigator.clipboard.writeText(d.documento);
    toast('Texto copiado.');
  });
}

export function render(main, { documento: doc, params, query }) {
  return doc ? documento(main, params[0], query.get('chave')) : lista(main);
}
