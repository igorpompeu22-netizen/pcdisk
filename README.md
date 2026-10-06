# Rota Livre — by PCDisk

> App gratuito que informa se um lugar é acessível **de verdade** para o perfil de cada pessoa, guia o trajeto até e dentro dele e transforma cada barreira encontrada em um **registro com a norma violada**.

Projeto da equipe **PCDisk (C169BA)** — LegalTech para acessibilidade PCD · Tema: Pessoa com deficiência · JusForge.

## O problema (Relatório de Problematização)

Pessoas com deficiência física, especialmente cadeirantes, não têm autonomia de deslocamento no campus: a estrutura acessível é incompleta e **não existe informação confiável sobre ela**. Nas 11 entrevistas:

| Pergunta | Média (1–5) |
|---|---|
| Já encontrou uma estrutura “acessível” que não funcionava? | **4,5** |
| Consegue fazer suas atividades sem se adaptar? | **1,6** |
| Já deixou de participar de atividades por não conseguir acessar o local? | 4,0 |
| Informação nas placas para locomoção | 2,6 |
| Segurança ao usar rampas e elevadores | 2,6 |
| Ferramentas que ajudariam a mudar a situação | 4,8 |

A acessibilidade existe no papel, mas falha na prática — e a pessoa só descobre ao chegar, sem saber o que fazer juridicamente.

## A solução (Relatório de Solução)

A **Rota Livre** foi a alternativa escolhida na matriz de decisão (103/115). As outras três ideias entraram como camadas do produto: mapa de obstáculos, guia de direitos e canal de defesa. Abaixo, como cada requisito virou funcionalidade.

| Requisito do relatório | Onde está no app |
|---|---|
| 1. Estabelecimento preenche **autodeclaração guiada pela NBR 9050**, com termo de responsabilidade (CDC arts. 6º, III, e 31) | `#/empresa` — cadastro com CNPJ validado, checklist de 12 itens, termo de responsabilidade |
| 2. Usuários **confirmam ou contestam cada item com foto** | Página do local → “Confirmo” / “Não é verdade”, com foto |
| 3. Cruzamento com o **perfil de necessidade** → semáforo **compatível / parcial / incompatível** | `#/perfil` + `#/locais` + página do local (`server/compat.js`) |
| 4. **QR/NFC** na entrada abre o **trajeto interno** (com versão impressa em **braille** e **áudio**) | `#/placa/:id` (QR em SVG, braille, leitura em voz alta) → `#/chegada/:id` |
| 5. Barreira vira **registro com a norma violada**, enviado ao estabelecimento **com prazo** para responder | `#/relatar` (3 passos + revisão) → protocolo `RL-AAAA-NNNNNN`, documento formal, `#/registros` |
| Três níveis de confiança: autodeclaração, comunidade, auditoria | Selos nível 1, 2 e 3 (`#/moderacao` registra auditoria) |
| Aviso quando a informação tem **mais de 30 dias** | Página do local e lista de locais |
| Transparência: quem declarou, quando foi verificado, prazo de resposta | Seção “Transparência” do local |
| Moderação contra denúncias falsas; foto sem rosto de terceiros; **reportante anônimo** para o estabelecimento | `#/moderacao`; a API nunca envia dados de quem relatou |
| Se não resolverem: orientar **Procon, MP, Defensoria** | Canais aparecem em `#/registros` quando o prazo vence ou há resposta |
| Linguagem simples; a norma aparece só quando o usuário pede | “Ver a norma” em itens, direitos e registros |
| Leitor de tela, **alto contraste**, **fonte ajustável**, **comando de voz**, botões grandes | Barra de acessibilidade no topo, ARIA, áreas de toque de 44–48 px |
| LGPD: perfil é dado sensível — consentimento específico, **fica no aparelho**, botão para **apagar** | `#/perfil` (localStorage), fotos reencodadas no aparelho (remove EXIF/GPS) |
| Não depender exclusivamente de mapas | Rotas em texto passo a passo e por voz; o mapa é complementar |
| Teste de compreensão: ≥ 80% entendem o semáforo e registram sem ajuda; ≥ 70% preferem a informação verificada | `#/indicadores` — registro das sessões de teste e metas |

As **intervenções priorizadas pelo RICE** na Problematização também estão implementadas:

| # | Intervenção (RICE) | Onde |
|---|---|---|
| 1º | Painel de status em tempo real de elevadores e rotas (22,9) | `#/painel` (Server-Sent Events, atualização ao vivo) |
| 2º | Mapa de rotas acessíveis com navegação passo a passo (14,4) | `#/rota` (Dijkstra por perfil, desvia de equipamentos parados) |
| 3º | Registro colaborativo de barreiras com foto e localização (11,2) | `#/relatar` |
| 4º | Chatbot de direitos baseado na LBI (9,1) | `#/direitos` |
| 5º | Solicitação formal com protocolo, prazo e histórico rastreável (9,0) | Documento do registro (`#/registro/:protocolo`) |
| 6º | Agenda de eventos com selo de acessibilidade (5,4/5,5) | `#/eventos` (selo Bronze/Prata/Ouro) |

## Como rodar

Requer **Node.js 20+**.

```bash
npm install
npm start          # http://localhost:3000
npm test           # 22 testes (motor de compatibilidade, rotas e API)
```

Variáveis de ambiente opcionais: `PORT` (padrão 3000), `DATA_DIR` (padrão `./data`) e `ADMIN_TOKEN` (código da moderação; **defina em produção**).

Os dados ficam em `data/db.json`, e as fotos em `data/uploads/`. Apague a pasta `data/` para voltar aos dados de demonstração.

### Publicar na internet

Veja o passo a passo em **[DEPLOY.md](DEPLOY.md)** (Vercel). O projeto já inclui `vercel.json` e `api/index.js`.

### Acessos de demonstração

| Área | Código |
|---|---|
| Estabelecimento — Restaurante Sabor da Esquina | `demo-sabor` |
| Gestão do campus (todos os prédios) | `demo-campus` |
| Moderação | `admin-demo` (ou o valor de `ADMIN_TOKEN`) |

### Roteiro sugerido (storyboard da Ana)

1. Em **Meu perfil**, escolha “Uso cadeira de rodas” e dê o consentimento.
2. Em **Locais**, abra o *Restaurante Sabor da Esquina*: verde, com “rampa e banheiro confirmados por 3 usuários há 2 dias”.
3. Em **Painel agora**, veja o elevador do Bloco A parado e a passarela interditada.
4. Em **Rota**, trace *Portaria → Bloco C — 2º andar*: a rota desvia da passarela. *Portaria → Bloco A — 2º andar* não tem rota para cadeirante enquanto o elevador estiver parado.
5. Em **QR da entrada** (na página do local), abra a placa e o link de chegada com o trajeto interno.
6. Em **Relatar barreira**, registre algo no restaurante. Em **Moderação**, aprove. Em **Área do estabelecimento** (`demo-sabor`), responda. Em **Meus registros**, acompanhe.

## Arquitetura

```
api/index.js    entrada da função serverless na Vercel
vercel.json     rotas da Vercel (site estático + API)
server/
  app.js        API REST + SSE (Express 5)
  catalog.js    itens NBR 9050, perfis, categorias de barreira → normas, canais
  compat.js     estado de cada item (autodeclaração → comunidade → auditoria → tempo real), semáforo e selos
  routing.js    grafo do campus + Dijkstra por perfil, equipamentos e barreiras
  campus.js     grafo do campus-piloto (fictício)
  rights.js     guia de direitos em linguagem simples + busca
  documents.js  documento formal do registro, braille (grau 1) e validação de CNPJ
  seed.js       dados de demonstração (fictícios)
  store.js      armazenamento JSON com escrita atômica
public/         SPA em JavaScript puro (sem build), acessível e responsiva
test/           node:test
```

## Limites e avisos

- **Todos os locais, empresas, CNPJs, pessoas e registros de demonstração são fictícios.** O mapa é um campus-piloto inspirado na comunidade UNIFOR, não a planta real.
- As referências normativas (LBI, CDC, LGPD, Lei 10.098/2000, CTB, NBR 9050 e NBR 16537) estão em `server/catalog.js` e `server/rights.js`. Elas devem ser **revisadas pela equipe jurídica** antes de qualquer uso real.
- O app **orienta e encaminha; não presta consultoria nem representação jurídica** (Estatuto da Advocacia e da OAB). A rota é orientação, não garantia.
- O prazo de resposta (10 dias) é uma regra da plataforma, não um prazo legal.
- O armazenamento em JSON atende ao piloto. Em produção, use um banco de dados, autenticação de verdade e HTTPS.
