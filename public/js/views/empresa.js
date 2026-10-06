import { api, getCatalogo } from '../api.js';
import { esc, toast, dataBR, selo, STATUS_REGISTRO } from '../ui.js';

const CHAVE = 'rl.empresaToken';
const token = {
  get: () => sessionStorage.getItem(CHAVE),
  set: (t) => sessionStorage.setItem(CHAVE, t),
  sair: () => sessionStorage.removeItem(CHAVE),
};

const TERMO = `Declaro, como responsável legal, que as informações de acessibilidade prestadas são verdadeiras e correspondem às condições reais do local. Estou ciente de que elas constituem informação ao consumidor (CDC, arts. 6º, III, e 31), de que a comunidade pode confirmá-las ou contestá-las com fotos e de que devo mantê-las atualizadas e responder aos registros de barreira no prazo indicado.`;

export async function render(main) {
  const cat = await getCatalogo();
  if (!token.get()) return entrada(main, cat);
  try {
    const dados = await api('/api/empresa/me', { headers: { Authorization: `Bearer ${token.get()}` } });
    return painel(main, cat, dados);
  } catch (e) {
    token.sair();
    toast(e.message, 'erro');
    return entrada(main, cat);
  }
}

async function entrada(main, cat) {
  const campus = await api('/api/campus');
  main.innerHTML = `
    <h1>Área do estabelecimento</h1>
    <p class="lead">Declare a acessibilidade do seu local, mostre que está em conformidade e responda aos registros de barreira. Mais clientes, menos risco.</p>
    <div class="grade">
      <form id="entrar" class="cartao">
        <h2 style="margin-top:0">Já sou cadastrado</h2>
        <div class="campo"><label for="tok">Código de acesso</label><input type="password" id="tok" name="token" required autocomplete="current-password"></div>
        <button class="botao">Entrar</button>
        <p class="pequeno suave">Demonstração: <code>demo-sabor</code> (restaurante) ou <code>demo-campus</code> (gestão do campus).</p>
      </form>
      <div class="cartao">
        <h2 style="margin-top:0">Por que participar?</h2>
        <ul><li>Selo de acessibilidade verificável (níveis 1 a 3).</li><li>Prova de conformidade e menor risco de autuação.</li><li>Recebe as barreiras antes que virem reclamação formal.</li><li>Gratuito para a pessoa com deficiência.</li></ul>
      </div>
    </div>
    <form id="cadastro" class="cartao" style="margin-top:1rem">
      <h2 style="margin-top:0">Cadastrar meu estabelecimento</h2>
      <div class="grade">
        <div class="campo"><label for="c-nome">Nome do local</label><input type="text" id="c-nome" name="nome" required></div>
        <div class="campo"><label for="c-cat">Categoria</label><input type="text" id="c-cat" name="categoria" placeholder="Restaurante, loja, clínica…"></div>
        <div class="campo"><label for="c-razao">Razão social</label><input type="text" id="c-razao" name="razaoSocial" required></div>
        <div class="campo"><label for="c-cnpj">CNPJ</label><input type="text" id="c-cnpj" name="cnpj" inputmode="numeric" required placeholder="00.000.000/0000-00"></div>
        <div class="campo"><label for="c-resp">Responsável legal</label><input type="text" id="c-resp" name="responsavel" required></div>
        <div class="campo"><label for="c-email">E-mail</label><input type="email" id="c-email" name="email" required></div>
        <div class="campo"><label for="c-andares">Andares</label><input type="number" id="c-andares" name="andares" min="1" max="50" value="1"></div>
        <div class="campo"><label for="c-no">Ponto mais próximo no mapa do campus</label><select id="c-no" name="no"><option value="">Fora da área mapeada</option>${campus.nos.filter((n) => n.rotulo).map((n) => `<option value="${n.id}">${esc(n.rotulo)}</option>`).join('')}</select></div>
      </div>
      <div class="campo"><label for="c-desc">Descrição</label><textarea id="c-desc" name="descricao" maxlength="400"></textarea></div>
      <div class="alerta alerta-info"><strong>Termo de responsabilidade</strong><p style="margin:.3rem 0 0">${esc(TERMO)}</p></div>
      <label class="opcao"><input type="checkbox" name="aceiteTermo" required> Li e aceito o termo de responsabilidade.</label>
      <div style="margin-top:1rem"><button class="botao">Cadastrar</button></div>
    </form>`;

  main.querySelector('#entrar').addEventListener('submit', (ev) => {
    ev.preventDefault();
    token.set(ev.target.token.value.trim());
    render(main);
  });
  main.querySelector('#cadastro').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target));
    try {
      const r = await api('/api/estabelecimentos', { method: 'POST', body: { ...fd, aceiteTermo: fd.aceiteTermo === 'on' } });
      token.set(r.token);
      main.innerHTML = `<h1>Cadastro realizado</h1>
        <div class="alerta alerta-aviso" role="alert"><p>Guarde seu <strong>código de acesso</strong>. Ele aparece só agora:</p><p class="protocolo" style="font-size:1.2rem">${esc(r.token)}</p></div>
        <p>Agora preencha a autodeclaração de acessibilidade. Ela passa por uma revisão antes de receber o selo nível 1.</p>
        <button class="botao" id="seguir">Ir para o painel</button>`;
      main.querySelector('#seguir').addEventListener('click', () => render(main));
      main.querySelector('h1').focus();
    } catch (e) {
      toast(e.message, 'erro');
    }
  });
}

function painel(raiz, cat, dados) {
  const main = document.createElement('div');
  raiz.replaceChildren(main);
  const rerender = () => render(raiz);
  const auth = { Authorization: `Bearer ${token.get()}` };
  main.innerHTML = `
    <div class="linha entre"><h1>Painel do estabelecimento</h1><button class="botao botao-sec botao-peq" id="sair">Sair</button></div>
    <h2>Registros de barreira recebidos</h2>
    <p class="suave pequeno">Você vê o relato e a foto, mas nunca quem registrou.</p>
    ${dados.barreiras.length ? dados.barreiras.map((b) => `
      <article class="cartao">
        <div class="linha entre"><span class="protocolo">${esc(b.protocolo)}</span><span class="etiqueta etiqueta-${STATUS_REGISTRO[b.status].cor}">${STATUS_REGISTRO[b.status].rotulo}</span></div>
        <p><strong>${esc(b.localNome)}</strong> — ${esc(b.categoriaNome)}</p>
        <p>${esc(b.descricao)}</p>
        ${b.foto ? `<img src="${esc(b.foto)}" alt="Foto anexada ao registro" style="max-height:180px;border-radius:8px">` : ''}
        <p class="pequeno">Normas: ${b.normas.map(esc).join('; ')}</p>
        <p class="pequeno">Responder até <strong>${dataBR(b.prazoEm)}</strong>${b.vencido ? ' <span class="etiqueta etiqueta-vermelho">vencido</span>' : ''}</p>
        ${b.status === 'resolvido' ? '' : `
        <form class="resposta" data-protocolo="${esc(b.protocolo)}">
          <div class="campo"><label for="r-${esc(b.protocolo)}">Resposta</label><textarea id="r-${esc(b.protocolo)}" name="texto" required></textarea></div>
          <label class="opcao"><input type="checkbox" name="resolvido"> A barreira foi corrigida</label>
          <div style="margin-top:.5rem"><button class="botao botao-peq">Enviar resposta</button></div>
        </form>`}
      </article>`).join('') : '<p class="suave">Nenhum registro recebido.</p>'}

    ${dados.locais.map((l) => `
      <section class="cartao" style="margin-top:1.5rem" data-local="${esc(l.id)}">
        <div class="linha entre"><h2 style="margin:0">${esc(l.nome)}</h2>${selo(l.selo)}</div>
        ${l.pendenteRevisao || !l.revisado ? '<p class="alerta alerta-aviso">Autodeclaração aguardando revisão da equipe Rota Livre.</p>' : ''}
        <form class="autodeclaracao">
          <h3>Autodeclaração de acessibilidade (NBR 9050)</h3>
          ${Object.entries(cat.itens).map(([k, it]) => {
            const v = l.itens?.[k]?.declarado;
            const r = (val, rot) => `<label><input type="radio" name="${k}" value="${val}" ${String(v) === val ? 'checked' : ''}> ${rot}</label>`;
            return `<div class="campo" role="group" aria-labelledby="it-${l.id}-${k}"><span id="it-${l.id}-${k}" style="font-weight:700;display:block">${it.icone} ${esc(it.nome)}</span><span class="dica">${esc(it.norma)}</span>
              <div class="tri">${r('true', 'Tem')}${r('false', 'Não tem')}${r('na', 'Não se aplica')}</div></div>`;
          }).join('')}
          <label class="opcao"><input type="checkbox" name="aceiteTermo" required> ${esc(TERMO)}</label>
          <div style="margin-top:.75rem"><button class="botao">Salvar autodeclaração</button></div>
        </form>
        <form class="interno">
          <h3>Trajeto interno (aberto pelo QR/NFC da entrada)</h3>
          <div class="campo"><label for="int-${esc(l.id)}">Um passo por linha <span class="dica">frases curtas: “Banheiro acessível no fundo, à esquerda do caixa.”</span></label>
          <textarea id="int-${esc(l.id)}" name="passos" rows="5">${esc(l.interno.join('\n'))}</textarea></div>
          <div class="linha"><button class="botao botao-sec">Salvar trajeto</button><a class="botao botao-sec" href="#/placa/${esc(l.id)}">Imprimir placa QR (com braille)</a></div>
        </form>
      </section>`).join('')}`;

  main.querySelector('#sair').addEventListener('click', () => {
    token.sair();
    rerender();
  });
  main.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const localId = f.closest('[data-local]')?.dataset.local;
    try {
      if (f.classList.contains('resposta')) {
        await api(`/api/empresa/barreiras/${f.dataset.protocolo}/resposta`, { method: 'POST', headers: auth, body: { texto: f.texto.value, resolvido: f.resolvido.checked } });
        toast('Resposta enviada. Quem registrou será avisado.');
      } else if (f.classList.contains('autodeclaracao')) {
        const fd = new FormData(f);
        const itens = {};
        for (const k of Object.keys(cat.itens)) {
          const v = fd.get(k);
          if (v) itens[k] = v === 'na' ? 'na' : v === 'true';
        }
        await api(`/api/empresa/locais/${localId}/itens`, { method: 'PUT', headers: auth, body: { itens, aceiteTermo: f.aceiteTermo.checked } });
        toast('Autodeclaração salva.');
      } else if (f.classList.contains('interno')) {
        await api(`/api/empresa/locais/${localId}/interno`, { method: 'PUT', headers: auth, body: { passos: f.passos.value.split('\n') } });
        toast('Trajeto interno salvo.');
      }
      rerender();
    } catch (e) {
      toast(e.message, 'erro');
    }
  });
}
