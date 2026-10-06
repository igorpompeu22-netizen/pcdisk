// Dados iniciais do piloto. Todos os locais, empresas e registros são fictícios.
import { hashToken } from './store.js';
import { DIAS_PRAZO_RESPOSTA } from './catalog.js';

const DIA = 24 * 60 * 60 * 1000;
const atras = (dias, horas = 0) => new Date(Date.now() - dias * DIA - horas * 3600 * 1000).toISOString();
const frente = (dias) => new Date(Date.now() + dias * DIA).toISOString();

// Tokens de demonstração para o painel do estabelecimento (documentados no README).
export const TOKENS_DEMO = {
  'loc-sabor': 'demo-sabor',
  'loc-blA': 'demo-campus',
};

function itens(valores, em, extra = {}) {
  const out = {};
  for (const [k, v] of Object.entries(valores)) {
    out[k] = { declarado: v, em, ...(extra[k] ?? {}) };
  }
  return out;
}

const UNIVERSIDADE = {
  razaoSocial: 'Universidade (gestão do campus) — dado fictício',
  cnpj: '11.222.333/0001-81',
  responsavel: 'Coordenação de Acessibilidade do Campus',
  email: 'acessibilidade@campus.exemplo',
};

export function seed(db) {
  const tokenCampus = hashToken(TOKENS_DEMO['loc-blA']);

  db.locais.push(
    {
      id: 'loc-blA', nome: 'Bloco A — Ciências Jurídicas', tipo: 'campus', categoria: 'Prédio de aulas', no: 'blA',
      descricao: 'Salas de aula de Direito no térreo e no 2º andar; Núcleo de Prática Jurídica.',
      estabelecimento: UNIVERSIDADE, tokenHash: tokenCampus, revisado: true, revisadoEm: atras(60),
      andares: 2,
      itens: itens({ entrada: true, rampa: true, porta: true, elevador: true, banheiro: true, circulacao: true, piso_tatil: true, sinalizacao: false, balcao: true, vaga: 'na', mesa: 'na', libras: false }, atras(60)),
      interno: [
        'Entre pela rampa principal, de frente para a praça central.',
        'O elevador fica logo à direita da entrada, ao lado da recepção.',
        'Banheiro acessível no térreo, no fim do corredor à esquerda.',
        'Salas 201 a 214 no 2º andar: saia do elevador e siga à direita.',
      ],
      criadoEm: atras(90),
    },
    {
      id: 'loc-blB', nome: 'Bloco B — Engenharias', tipo: 'campus', categoria: 'Prédio de aulas', no: 'blB',
      descricao: 'Laboratórios e salas de Engenharia; prédio térreo.',
      estabelecimento: UNIVERSIDADE, tokenHash: tokenCampus, revisado: true, revisadoEm: atras(70), andares: 1,
      itens: itens({ entrada: true, rampa: 'na', porta: false, elevador: 'na', banheiro: true, circulacao: true, piso_tatil: false, sinalizacao: true, balcao: false, vaga: 'na', mesa: 'na', libras: false }, atras(70)),
      interno: ['Entrada única pela calçada do Bloco B, sem degrau.', 'Laboratórios 1 a 4: portas de 70 cm — peça apoio na coordenação.'],
      criadoEm: atras(90),
    },
    {
      id: 'loc-blC', nome: 'Bloco C — Ciências da Saúde', tipo: 'campus', categoria: 'Prédio de aulas', no: 'blC',
      descricao: 'Psicologia, Fisioterapia e clínica-escola no 2º andar.',
      estabelecimento: UNIVERSIDADE, tokenHash: tokenCampus, revisado: true, revisadoEm: atras(20), andares: 2,
      itens: itens({ entrada: true, rampa: true, porta: true, elevador: true, banheiro: true, circulacao: true, piso_tatil: true, sinalizacao: true, balcao: true, vaga: 'na', mesa: 'na', libras: true }, atras(20)),
      auditoria: { em: atras(15), auditor: 'Arq. Helena Moura (consultoria em acessibilidade) — fictício', itens: { entrada: true, porta: true, elevador: true, banheiro: true, circulacao: true, rampa: true } },
      interno: ['Entrada principal sem degrau.', 'Elevador à esquerda do hall.', 'Clínica-escola: 2º andar, recepção em frente ao elevador.'],
      criadoEm: atras(90),
    },
    {
      id: 'loc-bib', nome: 'Biblioteca Central', tipo: 'campus', categoria: 'Biblioteca', no: 'bib',
      descricao: 'Acervo, salas de estudo em grupo e computadores com leitor de tela.',
      estabelecimento: UNIVERSIDADE, tokenHash: tokenCampus, revisado: true, revisadoEm: atras(45), andares: 1,
      itens: itens({ entrada: true, rampa: true, porta: true, elevador: 'na', banheiro: true, circulacao: true, piso_tatil: true, sinalizacao: true, balcao: true, vaga: 'na', mesa: true, libras: true }, atras(45)),
      interno: ['Entre pela rampa vinda da passarela central.', 'Balcão rebaixado à esquerda da catraca.', 'Computadores com leitor de tela na sala 3.'],
      criadoEm: atras(90),
    },
    {
      id: 'loc-ru', nome: 'Praça de alimentação', tipo: 'campus', categoria: 'Alimentação', no: 'ru',
      descricao: 'Lanchonetes e restaurante universitário.',
      estabelecimento: UNIVERSIDADE, tokenHash: tokenCampus, revisado: true, revisadoEm: atras(50), andares: 1,
      itens: itens({ entrada: true, rampa: 'na', porta: 'na', elevador: 'na', banheiro: true, circulacao: false, piso_tatil: false, sinalizacao: false, balcao: false, vaga: 'na', mesa: true, libras: false }, atras(50)),
      interno: ['Acesso sem degrau pelas laterais.', 'Mesas adaptadas perto da entrada leste.'],
      criadoEm: atras(90),
    },
    {
      id: 'loc-gin', nome: 'Ginásio poliesportivo', tipo: 'campus', categoria: 'Esporte', no: 'gin',
      descricao: 'Quadras, vestiários e aulas de Educação Física.',
      estabelecimento: UNIVERSIDADE, tokenHash: tokenCampus, revisado: true, revisadoEm: atras(100), andares: 1,
      itens: itens({ entrada: true, rampa: false, porta: true, elevador: 'na', banheiro: true, circulacao: true, piso_tatil: false, sinalizacao: false, balcao: 'na', vaga: true, mesa: 'na', libras: false }, atras(100)),
      interno: ['Prefira a entrada lateral (calçada do bosque): a rampa curta é íngreme.', 'Vestiário acessível ao lado da quadra 1.'],
      criadoEm: atras(120),
    },
    {
      id: 'loc-reit', nome: 'Reitoria e Secretaria Acadêmica', tipo: 'campus', categoria: 'Atendimento', no: 'reit',
      descricao: 'Matrícula, documentos e protocolo geral.',
      estabelecimento: UNIVERSIDADE, tokenHash: tokenCampus, revisado: true, revisadoEm: atras(10), andares: 1,
      itens: itens({ entrada: true, rampa: true, porta: true, elevador: 'na', banheiro: true, circulacao: true, piso_tatil: true, sinalizacao: true, balcao: true, vaga: true, mesa: 'na', libras: true }, atras(10)),
      interno: ['Guichê preferencial e rebaixado: número 1.', 'Senha preferencial no totem da entrada.'],
      criadoEm: atras(120),
    },
    {
      id: 'loc-sabor', nome: 'Restaurante Sabor da Esquina', tipo: 'estabelecimento', categoria: 'Restaurante', no: 'ext1',
      descricao: 'Restaurante self-service em frente ao portão leste (fictício).',
      estabelecimento: { razaoSocial: 'Sabor da Esquina Alimentos Ltda. — fictício', cnpj: '45.723.174/0001-10', responsavel: 'Marcos Lima (sócio-administrador)', email: 'contato@sabordaesquina.exemplo' },
      tokenHash: hashToken(TOKENS_DEMO['loc-sabor']), revisado: true, revisadoEm: atras(25), andares: 2,
      aceiteTermo: { em: atras(26), versao: '1.0' },
      itens: itens({ entrada: true, rampa: true, porta: true, elevador: true, banheiro: true, circulacao: true, piso_tatil: false, sinalizacao: false, balcao: true, vaga: true, mesa: true, libras: false }, atras(26)),
      interno: [
        'Entre pela rampa à esquerda da porta principal.',
        'Mesas adaptadas no salão à direita.',
        'Banheiro acessível no fundo, à esquerda do caixa.',
        'Salão do 2º andar: elevador ao lado da escada.',
      ],
      criadoEm: atras(26),
    },
  );

  const conf = (localId, item, valor, dias, nota) => ({ id: `c-${localId}-${item}-${dias}-${valor}`, localId, item, valor, nota, criadoEm: atras(dias) });
  db.confirmacoes.push(
    conf('loc-sabor', 'rampa', 'confirma', 2, 'Rampa livre, consegui entrar sozinha.'),
    conf('loc-sabor', 'rampa', 'confirma', 2.2),
    conf('loc-sabor', 'rampa', 'confirma', 3),
    conf('loc-sabor', 'banheiro', 'confirma', 2),
    conf('loc-sabor', 'banheiro', 'confirma', 2.5),
    conf('loc-sabor', 'banheiro', 'confirma', 4),
    conf('loc-sabor', 'entrada', 'confirma', 2),
    conf('loc-blA', 'rampa', 'confirma', 1),
    conf('loc-blA', 'sinalizacao', 'contesta', 6, 'Não há placa indicando o elevador.'),
    conf('loc-blB', 'porta', 'contesta', 12, 'Portas dos laboratórios são estreitas.'),
    conf('loc-ru', 'banheiro', 'contesta', 3, 'Banheiro acessível trancado, usado como depósito.'),
    conf('loc-ru', 'banheiro', 'contesta', 1),
    conf('loc-bib', 'rampa', 'confirma', 5),
    conf('loc-bib', 'balcao', 'confirma', 5),
  );

  const historico = (status, dias, fonte, obs) => ({ status, em: atras(dias), fonte, obs });
  db.equipamentos.push(
    {
      id: 'eq-elev-a', nome: 'Elevador do Bloco A', tipo: 'elevador', localId: 'loc-blA', item: 'elevador',
      status: 'parado', atualizadoEm: atras(0, 2), fonte: 'comunidade', confirmacoes: 3,
      obs: 'Porta não abre no térreo.',
      historico: [historico('funcionando', 9, 'gestao'), historico('parado', 0.09, 'comunidade', 'Porta não abre no térreo.')],
    },
    {
      id: 'eq-elev-c', nome: 'Elevador do Bloco C', tipo: 'elevador', localId: 'loc-blC', item: 'elevador',
      status: 'funcionando', atualizadoEm: atras(0, 5), fonte: 'gestao', confirmacoes: 1,
      historico: [historico('manutencao', 3, 'gestao', 'Manutenção preventiva'), historico('funcionando', 0.2, 'gestao')],
    },
    {
      id: 'eq-passarela', nome: 'Passarela coberta Bloco B–Bloco C', tipo: 'rota', localId: null, item: null,
      status: 'interditado', atualizadoEm: atras(1), fonte: 'gestao', confirmacoes: 2,
      obs: 'Obra no piso até sexta-feira. Use a calçada da Biblioteca.',
      historico: [historico('interditado', 1, 'gestao', 'Obra no piso até sexta-feira.')],
    },
    {
      id: 'eq-rampa-a', nome: 'Rampa principal do Bloco A', tipo: 'rampa', localId: 'loc-blA', item: 'rampa',
      status: 'funcionando', atualizadoEm: atras(1), fonte: 'comunidade', confirmacoes: 4, historico: [],
    },
    {
      id: 'eq-elev-sabor', nome: 'Elevador do Restaurante Sabor da Esquina', tipo: 'elevador', localId: 'loc-sabor', item: 'elevador',
      status: 'funcionando', atualizadoEm: atras(2), fonte: 'estabelecimento', confirmacoes: 0, historico: [],
    },
  );

  db.meta.protocolo = 2;
  const ano = new Date().getFullYear();
  db.barreiras.push(
    {
      id: 'b-demo-1', protocolo: `RL-${ano}-000001`, chaveHash: hashToken('demo-chave-1'),
      localId: 'loc-ru', trecho: null, categoria: 'banheiro',
      descricao: 'O banheiro acessível da praça de alimentação está trancado e sendo usado como depósito de caixas.',
      foto: null, geo: null, moderacao: 'aprovado', status: 'aberto',
      enviadoEm: atras(12), prazoEm: atras(2),
      historico: [
        { em: atras(12, 1), status: 'em_moderacao', texto: 'Registro recebido.' },
        { em: atras(12), status: 'aberto', texto: 'Aprovado pela moderação e enviado ao responsável pelo local.' },
      ],
      criadoEm: atras(12, 1),
    },
    {
      id: 'b-demo-2', protocolo: `RL-${ano}-000002`, chaveHash: hashToken('demo-chave-2'),
      localId: 'loc-sabor', trecho: null, categoria: 'elevador',
      descricao: 'Elevador interno parado; não consegui chegar ao salão do 2º andar.',
      foto: null, geo: null, moderacao: 'aprovado', status: 'resolvido',
      enviadoEm: atras(6), prazoEm: frente(DIAS_PRAZO_RESPOSTA - 6),
      historico: [
        { em: atras(6, 2), status: 'em_moderacao', texto: 'Registro recebido.' },
        { em: atras(6), status: 'aberto', texto: 'Aprovado pela moderação e enviado ao responsável pelo local.' },
        { em: atras(4), status: 'resolvido', texto: 'Resposta do estabelecimento: o elevador foi consertado e passou por revisão. Pedimos desculpas.', autor: 'estabelecimento' },
      ],
      criadoEm: atras(6, 2),
    },
  );

  db.eventos.push(
    {
      id: 'ev-1', titulo: 'Semana Jurídica — Direitos da Pessoa com Deficiência', data: frente(5).slice(0, 10), hora: '19:00',
      localId: 'loc-blC', organizador: 'Centro Acadêmico de Direito',
      descricao: 'Mesa-redonda sobre a LBI e acesso à justiça.',
      checklist: { local_acessivel: true, banheiro: true, assentos: true, libras: true, legendas: true, audiodescricao: false, material: true, inscricao: true, palco: true, divulgacao: true },
      criadoEm: atras(3),
    },
    {
      id: 'ev-2', titulo: 'Torneio interno de vôlei', data: frente(9).slice(0, 10), hora: '15:00',
      localId: 'loc-gin', organizador: 'Atlética Universitária',
      descricao: 'Abertura do torneio de vôlei.',
      checklist: { local_acessivel: false, banheiro: true, assentos: false, libras: false, legendas: false, audiodescricao: false, material: false, inscricao: true, palco: false, divulgacao: false },
      criadoEm: atras(1),
    },
  );
}
