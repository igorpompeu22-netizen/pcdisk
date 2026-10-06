// Catálogo jurídico-técnico da Rota Livre.
// Itens de acessibilidade guiados pela ABNT NBR 9050:2020, perfis de necessidade,
// categorias de barreira com a norma violada e canais oficiais de encaminhamento.

export const ITENS = {
  entrada: {
    nome: 'Entrada sem degrau ou com rampa',
    curto: 'Entrada acessível',
    icone: '🚪',
    norma: 'NBR 9050:2020, seção 6 (acessos e circulação); LBI art. 57',
  },
  rampa: {
    nome: 'Rampas com inclinação de até 8,33% e corrimão dos dois lados',
    curto: 'Rampa adequada',
    icone: '↗️',
    norma: 'NBR 9050:2020, seção 6 (rampas: inclinação máxima de 8,33%)',
  },
  porta: {
    nome: 'Portas com vão livre de pelo menos 80 cm',
    curto: 'Portas largas',
    icone: '↔️',
    norma: 'NBR 9050:2020, seção 6 (portas: vão livre mínimo de 0,80 m)',
  },
  elevador: {
    nome: 'Elevador ou plataforma funcionando (quando há mais de um andar)',
    curto: 'Elevador',
    icone: '🛗',
    norma: 'NBR 9050:2020, seção 6 (equipamentos eletromecânicos); LBI art. 57',
  },
  banheiro: {
    nome: 'Banheiro acessível livre para uso (barras de apoio e área de giro)',
    curto: 'Banheiro acessível',
    icone: '🚻',
    norma: 'NBR 9050:2020, seção 7 (sanitários, banheiros e vestiários)',
  },
  circulacao: {
    nome: 'Corredores e passagens livres de obstáculos',
    curto: 'Circulação livre',
    icone: '🧭',
    norma: 'NBR 9050:2020, seção 6 (circulação interna)',
  },
  balcao: {
    nome: 'Balcão ou guichê de atendimento rebaixado',
    curto: 'Balcão rebaixado',
    icone: '🛎️',
    norma: 'NBR 9050:2020, seção 9 (mobiliário: balcões de atendimento)',
  },
  mesa: {
    nome: 'Mesas com altura e espaço livre para cadeira de rodas',
    curto: 'Mesa adaptada',
    icone: '🍽️',
    norma: 'NBR 9050:2020, seção 9 (mobiliário: mesas)',
  },
  vaga: {
    nome: 'Vaga de estacionamento reservada perto da entrada',
    curto: 'Vaga reservada',
    icone: '🅿️',
    norma: 'LBI art. 47 (2% das vagas, no mínimo uma)',
  },
  piso_tatil: {
    nome: 'Piso tátil direcional e de alerta',
    curto: 'Piso tátil',
    icone: '⠿',
    norma: 'ABNT NBR 16537 (sinalização tátil no piso)',
  },
  sinalizacao: {
    nome: 'Sinalização visual clara e em braille',
    curto: 'Sinalização',
    icone: '🪧',
    norma: 'NBR 9050:2020, seção 5 (informação e sinalização)',
  },
  libras: {
    nome: 'Atendimento em Libras ou recurso de comunicação acessível',
    curto: 'Libras',
    icone: '🤟',
    norma: 'Lei 10.436/2002; LBI art. 3º, V (comunicação)',
  },
};

// Para cada perfil: itens essenciais (sem eles o local é incompatível)
// e desejáveis (sem eles o local fica "parcial").
export const PERFIS = {
  cadeirante: {
    nome: 'Uso cadeira de rodas',
    essenciais: ['entrada', 'porta', 'circulacao', 'elevador', 'banheiro'],
    desejaveis: ['rampa', 'balcao', 'mesa', 'vaga'],
    evitaEscada: true,
    inclinacaoMax: 8.33,
  },
  mobilidade_reduzida: {
    nome: 'Tenho mobilidade reduzida (muleta, andador, bengala, cansaço)',
    essenciais: ['entrada', 'circulacao'],
    desejaveis: ['elevador', 'rampa', 'banheiro', 'vaga'],
    evitaEscada: false,
    penalidadeEscada: 4,
    inclinacaoMax: 10,
  },
  visual: {
    nome: 'Tenho deficiência visual',
    essenciais: ['circulacao', 'piso_tatil'],
    desejaveis: ['sinalizacao', 'elevador'],
    evitaEscada: false,
    penalidadeEscada: 1.5,
    preferePisoTatil: true,
  },
  auditiva: {
    nome: 'Tenho deficiência auditiva',
    essenciais: ['libras'],
    desejaveis: ['sinalizacao'],
    evitaEscada: false,
  },
};

export const ORIGENS = {
  autodeclaracao: 'Autodeclaração do estabelecimento',
  comunidade: 'Confirmação da comunidade',
  auditoria: 'Auditoria profissional',
};

export const CATEGORIAS_BARREIRA = {
  rampa: {
    nome: 'Rampa bloqueada, inexistente ou íngreme',
    item: 'rampa',
    normas: [
      'LBI (Lei 13.146/2015) art. 57 — edificações de uso coletivo devem garantir acessibilidade em todas as dependências',
      'ABNT NBR 9050:2020, seção 6 — rampas com inclinação máxima de 8,33%',
      'Lei 10.098/2000 art. 11 — edifícios de uso coletivo devem ser ou se tornar acessíveis',
    ],
  },
  elevador: {
    nome: 'Elevador ou plataforma parado',
    item: 'elevador',
    normas: [
      'LBI (Lei 13.146/2015) art. 57 — acessibilidade em todas as dependências e serviços',
      'ABNT NBR 9050:2020, seção 6 — equipamentos eletromecânicos de circulação',
      'Lei 10.098/2000 art. 11',
    ],
  },
  banheiro: {
    nome: 'Banheiro acessível fechado, inadequado ou usado como depósito',
    item: 'banheiro',
    normas: [
      'LBI (Lei 13.146/2015) art. 57',
      'ABNT NBR 9050:2020, seção 7 — sanitários acessíveis',
    ],
  },
  entrada: {
    nome: 'Entrada com degrau ou sem acesso',
    item: 'entrada',
    normas: [
      'LBI (Lei 13.146/2015) arts. 56 e 57',
      'ABNT NBR 9050:2020, seção 6 — acessos',
    ],
  },
  porta: {
    nome: 'Porta estreita ou passagem bloqueada',
    item: 'porta',
    normas: [
      'LBI (Lei 13.146/2015) art. 57',
      'ABNT NBR 9050:2020, seção 6 — vão livre mínimo de 0,80 m',
    ],
  },
  calcada: {
    nome: 'Calçada quebrada ou obstáculo no caminho',
    item: 'circulacao',
    normas: [
      'LBI (Lei 13.146/2015) art. 53 — acessibilidade como direito a viver com independência',
      'Lei 10.098/2000 arts. 3º e 4º — vias e espaços públicos acessíveis',
      'ABNT NBR 9050:2020, seção 6 — rota acessível',
    ],
  },
  vaga: {
    nome: 'Vaga reservada ocupada ou inexistente',
    item: 'vaga',
    normas: [
      'LBI (Lei 13.146/2015) art. 47 — reserva de 2% das vagas, no mínimo uma',
      'Código de Trânsito Brasileiro art. 181, XX — estacionar em vaga reservada sem credencial',
    ],
  },
  sinalizacao: {
    nome: 'Falta de sinalização ou piso tátil',
    item: 'sinalizacao',
    normas: [
      'ABNT NBR 9050:2020, seção 5 — informação e sinalização',
      'ABNT NBR 16537 — sinalização tátil no piso',
    ],
  },
  informacao_falsa: {
    nome: 'Local diz ser acessível, mas não é',
    item: null,
    normas: [
      'CDC (Lei 8.078/1990) art. 6º, III, e parágrafo único — informação adequada, clara e acessível',
      'CDC art. 31 — informações corretas, claras e precisas na oferta',
      'CDC art. 37, § 1º — publicidade enganosa',
    ],
  },
  discriminacao: {
    nome: 'Fui recusado(a), carregado(a) ou tratado(a) com discriminação',
    item: null,
    normas: [
      'LBI (Lei 13.146/2015) art. 4º — direito à igualdade e proibição de discriminação',
      'LBI art. 88 — crime de discriminação (reclusão de 1 a 3 anos e multa)',
    ],
  },
  outro: {
    nome: 'Outra barreira',
    item: null,
    normas: ['LBI (Lei 13.146/2015) art. 53 — direito à acessibilidade'],
  },
};

export const CANAIS = [
  {
    nome: 'Ouvidoria da instituição ou do estabelecimento',
    quando: 'Primeiro passo: peça a correção e guarde o número de protocolo.',
  },
  {
    nome: 'Procon ou consumidor.gov.br',
    quando: 'Quando um estabelecimento informou acessibilidade que não existe (CDC).',
  },
  {
    nome: 'Ministério Público (Promotoria da Pessoa com Deficiência)',
    quando: 'Quando a barreira continua ou atinge muitas pessoas (LBI art. 79; Lei 7.853/1989).',
  },
  {
    nome: 'Defensoria Pública',
    quando: 'Para orientação jurídica gratuita e, se preciso, ação judicial.',
  },
  {
    nome: 'Disque 100 (Direitos Humanos)',
    quando: 'Em caso de discriminação ou violência contra pessoa com deficiência.',
  },
];

export const CHECKLIST_EVENTO = {
  local_acessivel: 'Local do evento com rota acessível até a entrada',
  banheiro: 'Banheiro acessível próximo e liberado',
  assentos: 'Espaços reservados para cadeira de rodas e acompanhante',
  libras: 'Intérprete de Libras',
  legendas: 'Legendas em vídeos e projeções',
  audiodescricao: 'Audiodescrição',
  material: 'Material em formato acessível (digital, fonte ampliada ou braille)',
  inscricao: 'Inscrição pergunta sobre recursos de acessibilidade necessários',
  palco: 'Palco ou púlpito acessível para palestrantes com deficiência',
  divulgacao: 'Divulgação informa os recursos de acessibilidade disponíveis',
};

export const DIAS_INFO_ANTIGA = 30;
export const DIAS_PRAZO_RESPOSTA = 10;
