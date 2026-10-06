import { api, getCatalogo, aoVivo } from '../api.js';
import { esc, quando, dataBR, semaforo, selo, falar, toast, lerFoto, STATUS_EQUIP, STATUS_REGISTRO } from '../ui.js';
import { prefs } from '../prefs.js';

const VALOR = {
  true: { rotulo: 'Tem', cor: 'verde' },
  false: { rotulo: 'Não tem / não funciona', cor: 'vermelho' },
  null: { rotulo: 'Sem informação', cor: 'neutro' },
};

function origemTexto(e, cat) {
  if (e.origem === 'tempo_real') return `Agora: ${e.tempoReal.equipamento} ${STATUS_EQUIP[e.tempoReal.status]?.rotulo.toLowerCase()} (${quando(e.em)})`;
  if (e.origem === 'comunidade') return e.valor ? `Confirmado por ${e.confirmam} usuário(s) · última ${quando(e.em)}` : `Contestado por ${e.contestam} usuário(s) · último ${quando(e.em)}`;
  if (e.origem === 'auditoria') return `${cat.origens.auditoria} · ${dataBR(e.em)}`;
  if (e.origem === 'autodeclaracao') return `${cat.origens.autodeclaracao} · ${dataBR(e.em)}`;
  return 'Ninguém informou ainda';
}

export async function render(main, { params: [id], chegada }) {
  const cat = await getCatalogo();

  async function desenhar() {
    const perfil = prefs.perfil() ?? '';
    const l = await api(`/api/locais/${id}?perfil=${perfil}`);
    const essenciais = new Set(cat.perfis[perfil]?.essenciais ?? []);
    const itens = Object.values(l.itens).filter((e) => e.valor !== 'na')
      .sort((a, b) => Number(essenciais.has(b.item)) - Number(essenciais.has(a.item)));
    const naoAplica = Object.values(l.itens).filter((e) => e.valor === 'na');
    const fotos = l.confirmacoes.filter((c) => c.foto);
    const resumoAudio = `${l.nome}. ${l.compat.titulo}. ${l.compat.motivos.join(' ')} ${l.compat.resumo} ${l.interno.length ? `Trajeto interno: ${l.interno.join(' ')}` : ''}`;

    const blocoInterno = l.interno.length ? `
      <section aria-labelledby="h-interno">
        <h2 id="h-interno">${chegada ? 'Trajeto dentro do local' : 'Trajeto interno'}</h2>
        <ol class="passos-internos">${l.interno.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
      </section>` : chegada ? '<p class="alerta alerta-aviso">Este local ainda não cadastrou o trajeto interno.</p>' : '';

    main.innerHTML = `
      ${chegada ? '<p class="etiqueta etiqueta-azul">Você leu o QR/NFC da entrada</p>' : '<p class="pequeno"><a href="#/locais">← Locais</a></p>'}
      <h1>${chegada ? `Você chegou: ${esc(l.nome)}` : esc(l.nome)}</h1>
      <p class="suave">${esc(l.categoria)} · ${esc(l.descricao ?? '')}</p>

      <div class="cartao">
        ${semaforo(l.compat, { grande: true })}
        ${l.compat.motivos.length ? `<ul>${l.compat.motivos.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
        <p><strong>${esc(l.compat.resumo)}</strong></p>
        ${l.compat.nivel === 'sem_perfil' ? '<p><a class="botao botao-peq" href="#/perfil">Definir meu perfil</a></p>' : ''}
        ${l.antiga || l.compat.antiga ? `<p class="alerta alerta-aviso">⚠️ Parte desta informação tem mais de ${cat.diasInfoAntiga} dias sem confirmação. Se você estiver no local, confirme ou conteste os itens abaixo.</p>` : ''}
        <div class="linha">${selo(l.selo)}</div>
        <div class="linha" style="margin-top:.75rem">
          ${l.no ? `<a class="botao" href="#/rota?para=${esc(l.no)}">🧭 Rota até aqui</a>` : ''}
          <a class="botao botao-perigo" href="#/relatar?local=${esc(l.id)}">📸 Relatar barreira</a>
          <button class="botao botao-sec" id="ouvir" type="button">🔊 Ouvir</button>
          <a class="botao botao-sec" href="#/placa/${esc(l.id)}">QR da entrada</a>
        </div>
      </div>

      ${chegada ? blocoInterno : ''}

      ${l.equipamentos.length ? `<h2>Equipamentos agora</h2><ul class="lista-limpa">${l.equipamentos.map((e) => `<li class="linha"><span class="etiqueta etiqueta-${STATUS_EQUIP[e.status].cor}">${STATUS_EQUIP[e.status].icone} ${STATUS_EQUIP[e.status].rotulo}</span> ${esc(e.nome)} <span class="suave pequeno">· ${quando(e.atualizadoEm)}</span></li>`).join('')}</ul>` : ''}

      <h2>Itens de acessibilidade</h2>
      <p class="suave pequeno">Itens essenciais para o seu perfil aparecem primeiro. Você está no local? Confirme ou conteste com uma foto.</p>
      <div class="itens">
        ${itens.map((e) => {
          const info = cat.itens[e.item];
          const v = VALOR[String(e.valor)];
          return `
          <div class="item" data-item="${e.item}">
            <span class="item-icone" aria-hidden="true">${info.icone}</span>
            <div>
              <div class="linha entre"><strong>${esc(info.nome)}</strong> <span class="etiqueta etiqueta-${v.cor}">${v.rotulo}</span></div>
              ${essenciais.has(e.item) ? '<span class="etiqueta etiqueta-azul">essencial para você</span>' : ''}
              <p class="pequeno suave" style="margin:.25rem 0 0">${esc(origemTexto(e, cat))}${e.antiga ? ' · <strong>verificação antiga</strong>' : ''}</p>
              <details class="norma"><summary>Ver a norma</summary><p>${esc(info.norma)}</p></details>
            </div>
            <div class="item-acoes">
              <button class="botao botao-sec botao-peq" data-voto="confirma">👍 Confirmo</button>
              <button class="botao botao-sec botao-peq" data-voto="contesta">👎 Não é verdade</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${naoAplica.length ? `<p class="pequeno suave">Não se aplica a este local: ${naoAplica.map((e) => esc(cat.itens[e.item].curto)).join(', ')}.</p>` : ''}

      ${chegada ? '' : blocoInterno}

      ${fotos.length ? `<h2>Fotos da comunidade</h2><div class="fotos">${fotos.map((c) => `<img src="${esc(c.foto)}" alt="Foto de ${esc(cat.itens[c.item].curto)} enviada ${quando(c.criadoEm)} (${c.valor === 'confirma' ? 'confirmando' : 'contestando'})">`).join('')}</div>` : ''}

      <h2>Barreiras registradas aqui</h2>
      ${l.barreiras.length ? `<ul class="lista-limpa">${l.barreiras.map((b) => `<li class="cartao"><div class="linha entre"><span class="protocolo">${esc(b.protocolo)}</span><span class="etiqueta etiqueta-${STATUS_REGISTRO[b.status].cor}">${STATUS_REGISTRO[b.status].rotulo}${b.vencido ? ' · prazo vencido' : ''}</span></div><p style="margin:.3rem 0">${esc(b.categoriaNome)} — ${esc(b.descricao)}</p><a class="pequeno" href="#/registro/${esc(b.protocolo)}">Ver registro</a></li>`).join('')}</ul>` : '<p class="suave">Nenhuma barreira registrada.</p>'}

      <h2>Transparência</h2>
      <dl class="cartao pequeno">
        <dt><strong>Quem declarou</strong></dt><dd>${esc(l.responsavel.razaoSocial ?? '—')}${l.responsavel.responsavel ? ` — responsável: ${esc(l.responsavel.responsavel)}` : ''}</dd>
        <dt><strong>Última declaração</strong></dt><dd>${dataBR(l.declaradoEm)}</dd>
        <dt><strong>Auditoria profissional</strong></dt><dd>${l.auditoria ? `${esc(l.auditoria.auditor)} em ${dataBR(l.auditoria.em)}` : 'Ainda não auditado'}</dd>
        <dt><strong>Depois de um registro de barreira</strong></dt><dd>O responsável recebe o relato (sem saber quem enviou) e tem ${cat.diasPrazo} dias para responder.</dd>
      </dl>

      <dialog id="dlg-voto" aria-labelledby="dlg-titulo">
        <form method="dialog" id="form-voto">
          <h2 id="dlg-titulo" style="margin-top:0">Confirmar item</h2>
          <div class="campo"><label for="voto-foto">Foto <span class="dica">recomendado — evite rostos de outras pessoas</span></label><input type="file" id="voto-foto" accept="image/*" capture="environment"></div>
          <div class="campo"><label for="voto-nota">Comentário <span class="dica">opcional</span></label><input type="text" id="voto-nota" maxlength="280"></div>
          <div class="linha"><button class="botao" value="ok">Enviar</button><button class="botao botao-sec" value="cancelar" formnovalidate>Cancelar</button></div>
        </form>
      </dialog>
    `;

    main.querySelector('#ouvir').addEventListener('click', () => falar(resumoAudio));

    const dlg = main.querySelector('#dlg-voto');
    let voto = null;
    main.querySelector('.itens').addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-voto]');
      if (!btn) return;
      voto = { item: btn.closest('[data-item]').dataset.item, valor: btn.dataset.voto, botao: btn };
      main.querySelector('#dlg-titulo').textContent = `${voto.valor === 'confirma' ? 'Confirmar' : 'Contestar'}: ${cat.itens[voto.item].curto}`;
      dlg.showModal();
    });
    dlg.addEventListener('close', async () => {
      if (dlg.returnValue !== 'ok' || !voto) return voto?.botao.focus();
      try {
        const foto = await lerFoto(main.querySelector('#voto-foto').files[0]);
        await api(`/api/locais/${id}/confirmacoes`, { method: 'POST', body: { item: voto.item, valor: voto.valor, nota: main.querySelector('#voto-nota').value, foto } });
        toast('Obrigado! Sua verificação já aparece para todos.');
        await desenhar();
      } catch (e) {
        toast(e.message, 'erro');
      }
    });
  }

  await desenhar();
  return aoVivo((tipo, dados) => {
    const ocupado = main.querySelector('#dlg-voto')?.open;
    if (!ocupado && ((tipo === 'local' && dados.id === id) || tipo === 'equipamento')) desenhar();
  });
}
