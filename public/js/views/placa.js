import { api } from '../api.js';
import { esc, falar } from '../ui.js';

export async function render(main, { params: [id] }) {
  const p = await api(`/api/locais/${id}/placa`);
  const url = `${location.origin}/#/chegada/${id}`;
  main.innerHTML = `
    <p class="pequeno nao-imprimir"><a href="#/local/${esc(id)}">← Voltar ao local</a></p>
    <h1 class="nao-imprimir">Placa da entrada</h1>
    <p class="nao-imprimir">Imprima e fixe na entrada, na altura de 0,90 m a 1,20 m. O QR abre o trajeto interno e os itens de acessibilidade. Para NFC, grave na etiqueta o endereço: <code>${esc(url)}</code></p>
    <div class="placa">
      <h2>${esc(p.nome)}</h2>
      <img src="/api/locais/${esc(id)}/qr.svg" alt="Código QR que abre o trajeto interno de ${esc(p.nome)}">
      <p><strong>Rota Livre — by PCDisk</strong><br>Aponte a câmera ou aproxime o celular</p>
      <p class="braille" aria-label="Transcrição em braille do nome do local">${esc(p.braille)}</p>
      <p class="braille" aria-hidden="true" style="font-size:1.4rem">${esc(p.brailleInstrucao)}</p>
      <p class="pequeno">A transcrição braille deve ser impressa em relevo por gráfica especializada.</p>
    </div>
    <div class="linha nao-imprimir" style="justify-content:center;margin-top:1rem">
      <button class="botao" id="imprimir">🖨️ Imprimir placa</button>
      <button class="botao botao-sec" id="ouvir">🔊 Versão em áudio</button>
    </div>`;
  main.querySelector('#imprimir').addEventListener('click', () => print());
  main.querySelector('#ouvir').addEventListener('click', () => falar(p.audio));
}
