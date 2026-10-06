// Guia de direitos em linguagem simples. A norma aparece só quando o usuário pede.
// O app orienta e encaminha; não presta consultoria jurídica (Estatuto da OAB).

export const DIREITOS = [
  {
    id: 'informar-acessibilidade',
    pergunta: 'O local é obrigado a informar se é acessível?',
    resposta: 'Sim. Quem oferece um serviço deve dar informação clara e correta sobre ele — e essa informação precisa ser acessível para a pessoa com deficiência. Se o local diz que é acessível e não é, isso pode ser informação enganosa.',
    norma: 'CDC (Lei 8.078/1990), art. 6º, III, e parágrafo único (incluído pela LBI); art. 31 (informações corretas, claras e precisas na oferta); art. 37, § 1º (publicidade enganosa).',
    palavras: ['informar', 'informacao', 'acessivel', 'mentiu', 'enganosa', 'propaganda', 'disse', 'declarou', 'cdc', 'consumidor', 'falsa'],
  },
  {
    id: 'calcada',
    pergunta: 'A calçada quebrada ou com obstáculo viola meu direito?',
    resposta: 'Sim. Você tem direito de se deslocar com autonomia e segurança. Ruas, calçadas e espaços públicos devem ser acessíveis. Registre a barreira com foto: isso vira prova e pedido de correção.',
    norma: 'LBI (Lei 13.146/2015), art. 53; Lei 10.098/2000, arts. 3º e 4º; ABNT NBR 9050:2020 (rota acessível).',
    palavras: ['calcada', 'buraco', 'obstaculo', 'rua', 'caminho', 'quebrada', 'poste', 'carro', 'locomocao', 'deslocar'],
  },
  {
    id: 'local-acessivel',
    pergunta: 'O prédio não deveria ser acessível?',
    resposta: 'Sim. Prédios de uso coletivo — faculdade, restaurante, loja, clínica — devem ser acessíveis em todas as áreas e serviços, inclusive os que já existiam antes da lei. Construções e reformas novas também precisam ser acessíveis.',
    norma: 'LBI (Lei 13.146/2015), arts. 56 e 57; Lei 10.098/2000, art. 11; ABNT NBR 9050:2020.',
    palavras: ['predio', 'local', 'acessivel', 'rampa', 'degrau', 'escada', 'elevador', 'banheiro', 'porta', 'reforma', 'obra', 'nbr', '9050'],
  },
  {
    id: 'elevador-parado',
    pergunta: 'O elevador está parado. O que posso fazer?',
    resposta: 'Elevador e plataforma fazem parte da acessibilidade do prédio e precisam funcionar. Informe no Painel do app para avisar os outros, registre a barreira e acompanhe o prazo de resposta. Se não resolverem, procure a ouvidoria e, depois, o Ministério Público.',
    norma: 'LBI (Lei 13.146/2015), art. 57; ABNT NBR 9050:2020 (equipamentos eletromecânicos).',
    palavras: ['elevador', 'parado', 'quebrado', 'plataforma', 'andar', 'escada'],
  },
  {
    id: 'discriminacao',
    pergunta: 'Ser carregado(a) ou recusado(a) é discriminação?',
    resposta: 'Pode ser. Você tem direito à igualdade e não pode ser excluído(a) por causa da deficiência. Recusar uma adaptação razoável também é discriminação. Discriminar pessoa com deficiência é crime. Você não é obrigado(a) a aceitar ser carregado(a).',
    norma: 'LBI (Lei 13.146/2015), art. 4º e § 1º (recusa de adaptações razoáveis é discriminação); art. 88 (crime: reclusão de 1 a 3 anos e multa).',
    palavras: ['carregado', 'carregada', 'recusado', 'recusada', 'negaram', 'entrar', 'expulso', 'discriminacao', 'preconceito', 'humilhacao', 'barrado', 'impedido', 'colo', 'tratado'],
  },
  {
    id: 'reclamar',
    pergunta: 'A quem reclamar e com que base?',
    resposta: 'Comece pelo próprio app: o registro de barreira gera protocolo, cita a norma violada e é enviado ao responsável com prazo de resposta. Se não houver resposta, leve o protocolo à ouvidoria, ao Procon (quando for estabelecimento), ao Ministério Público ou à Defensoria Pública.',
    norma: 'LBI (Lei 13.146/2015), art. 79 (acesso à justiça); Lei 7.853/1989 (atuação do Ministério Público).',
    palavras: ['reclamar', 'denunciar', 'denuncia', 'procon', 'ministerio', 'defensoria', 'ouvidoria', 'justica', 'processo', 'advogado', 'onde'],
  },
  {
    id: 'educacao',
    pergunta: 'Quais são meus direitos na faculdade?',
    resposta: 'Você tem direito a estudar em igualdade de condições, com acessibilidade nos prédios, nos materiais e nas atividades. A instituição deve fazer as adaptações necessárias e oferecer recursos de acessibilidade, inclusive tradutor e intérprete de Libras quando preciso.',
    norma: 'LBI (Lei 13.146/2015), art. 27 (educação inclusiva em todos os níveis); art. 28, XIII (acesso ao ensino superior em igualdade de condições) e demais incisos.',
    palavras: ['faculdade', 'universidade', 'aula', 'curso', 'educacao', 'estudar', 'professor', 'sala', 'material', 'libras', 'interprete'],
  },
  {
    id: 'provas',
    pergunta: 'Tenho direito a tempo extra ou prova adaptada?',
    resposta: 'Sim. Em processos seletivos e atividades acadêmicas, você pode pedir prova em formato acessível e tempo adicional, desde que solicite antes e comprove a necessidade. O formulário de inscrição deve perguntar quais recursos você precisa.',
    norma: 'LBI (Lei 13.146/2015), art. 30, II, IV e V.',
    palavras: ['prova', 'tempo', 'extra', 'adicional', 'vestibular', 'exame', 'avaliacao', 'enem', 'adaptada', 'selecao'],
  },
  {
    id: 'vaga',
    pergunta: 'Como funcionam as vagas de estacionamento reservadas?',
    resposta: 'Estacionamentos abertos ao público devem reservar vagas perto da entrada para veículos que transportam pessoa com deficiência com dificuldade de locomoção — 2% do total, no mínimo uma. É preciso usar a credencial. Estacionar na vaga sem credencial é infração gravíssima.',
    norma: 'LBI (Lei 13.146/2015), art. 47 e § 1º; Código de Trânsito Brasileiro, art. 181, XX.',
    palavras: ['vaga', 'estacionamento', 'estacionar', 'carro', 'credencial', 'ocupada'],
  },
  {
    id: 'dados',
    pergunta: 'O que o app faz com meus dados de saúde?',
    resposta: 'Seu perfil de necessidade é dado sensível. Ele só é usado com o seu consentimento, fica guardado no seu aparelho e você pode apagá-lo quando quiser. Quem registra uma barreira não tem a deficiência nem a identidade revelada ao estabelecimento.',
    norma: 'LGPD (Lei 13.709/2018), art. 5º, II (dado sensível); art. 11, I (consentimento específico e destacado); art. 18 (direitos do titular, inclusive eliminação).',
    palavras: ['dados', 'privacidade', 'lgpd', 'perfil', 'apagar', 'saude', 'sigilo', 'anonimo'],
  },
  {
    id: 'banheiro',
    pergunta: 'O banheiro acessível está trancado ou virou depósito. Pode?',
    resposta: 'Não. O banheiro acessível precisa estar livre e pronto para uso. Usá-lo como depósito ou mantê-lo trancado sem atendimento imediato impede seu uso e descumpre a acessibilidade exigida.',
    norma: 'LBI (Lei 13.146/2015), art. 57; ABNT NBR 9050:2020, seção 7 (sanitários).',
    palavras: ['banheiro', 'sanitario', 'trancado', 'deposito', 'fechado', 'chave'],
  },
];

const normaliza = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');

export function perguntar(texto) {
  const tokens = normaliza(texto).split(/\s+/).filter((t) => t.length > 2);
  const pontuados = DIREITOS.map((d) => {
    const alvo = new Set([...d.palavras, ...normaliza(d.pergunta).split(/\s+/)]);
    let pontos = 0;
    for (const t of tokens) {
      if (alvo.has(t)) pontos += d.palavras.includes(t) ? 2 : 1;
      // Aproximação por radical: "recusaram" ~ "recusado", "quebrou" ~ "quebrado".
      else if (t.length >= 5 && d.palavras.some((p) => p.length >= 5 && p.slice(0, 5) === t.slice(0, 5))) pontos += 2;
    }
    return { d, pontos };
  }).sort((a, b) => b.pontos - a.pontos);

  const [melhor, ...resto] = pontuados;
  if (!melhor || melhor.pontos < 2) {
    return {
      encontrou: false,
      resposta: 'Não encontrei uma resposta pronta para isso. Veja os temas abaixo ou procure a Defensoria Pública para orientação jurídica gratuita.',
      relacionados: DIREITOS.slice(0, 4).map(({ id, pergunta }) => ({ id, pergunta })),
    };
  }
  return {
    encontrou: true,
    ...melhor.d,
    relacionados: resto.filter((r) => r.pontos >= 2).slice(0, 3).map(({ d }) => ({ id: d.id, pergunta: d.pergunta })),
  };
}
