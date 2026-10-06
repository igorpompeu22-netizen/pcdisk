export async function render(main) {
  main.innerHTML = `
    <h1>Sobre a Rota Livre</h1>
    <p class="lead">App gratuito que informa se um lugar é acessível de verdade para o perfil de cada pessoa, guia o trajeto até e dentro dele e transforma cada barreira encontrada em um registro com a norma violada.</p>
    <div class="cartao">
      <h2 style="margin-top:0">O problema</h2>
      <p>A acessibilidade existe no papel, mas falha na prática: rampa bloqueada, elevador quebrado, banheiro adaptado usado como depósito. Nas entrevistas com 11 cadeirantes, a nota para “já encontrei uma estrutura ‘acessível’ que não funcionava” foi <strong>4,5 de 5</strong>, enquanto “consigo fazer minhas atividades sem me adaptar” ficou em <strong>1,6 de 5</strong>. A pessoa só descobre a barreira ao chegar — e não sabe o que fazer juridicamente.</p>
    </div>
    <div class="cartao">
      <h2 style="margin-top:0">Como a Rota Livre responde</h2>
      <ol>
        <li>O estabelecimento preenche uma autodeclaração guiada pelos itens da NBR 9050.</li>
        <li>Os usuários confirmam ou contestam cada item com foto.</li>
        <li>O app cruza os itens com o seu perfil e mostra compatível, parcial ou incompatível.</li>
        <li>Na chegada, o QR/NFC abre o trajeto interno.</li>
        <li>Uma barreira gera um registro com a norma violada, enviado ao estabelecimento, que tem prazo para responder.</li>
      </ol>
      <p>Além disso: painel em tempo real de elevadores e rotas, rotas acessíveis passo a passo, guia de direitos e agenda de eventos com selo de acessibilidade — as intervenções priorizadas pelo método RICE na fase de Problematização.</p>
    </div>
    <div class="cartao">
      <h2 style="margin-top:0">Privacidade (LGPD)</h2>
      <ul>
        <li>O perfil de necessidade é dado de saúde (art. 5º, II): só com seu consentimento específico (art. 11, I) e guardado apenas no seu aparelho.</li>
        <li>Quem registra uma barreira não é identificado ao estabelecimento. Não pedimos nome para registrar.</li>
        <li>As fotos são reduzidas no aparelho, o que remove metadados como a localização do arquivo.</li>
        <li>Você pode apagar seus dados a qualquer momento em <a href="#/perfil">Meu perfil</a>.</li>
      </ul>
    </div>
    <div class="cartao">
      <h2 style="margin-top:0">Limites</h2>
      <p>A rota é orientação, não garantia. O app orienta e encaminha; não presta consultoria nem representação jurídica (Estatuto da Advocacia e da OAB). No piloto, cobre o campus e arredores; todos os locais e dados de demonstração são fictícios.</p>
      <p class="pequeno suave">Equipe PCDisk — C169BA · Tema: Pessoa com deficiência · JusForge.</p>
    </div>`;
}
