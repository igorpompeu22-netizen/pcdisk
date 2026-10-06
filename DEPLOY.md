# Publicar a Rota Livre na Vercel

O projeto já está preparado para a Vercel:

- `public/` é servido pela CDN da Vercel (o site);
- `api/index.js` roda a API Express como função serverless;
- `vercel.json` direciona `/api/*` e `/uploads/*` para essa função.

Não é preciso build. São só alguns cliques.

> ⚠️ **Leia antes: os dados são temporários na Vercel.** Funções serverless não têm disco permanente: o app grava em `/tmp`, que é apagado quando a função “esfria” (minutos sem uso) ou troca de instância. Por isso, os registros, as confirmações e os cadastros feitos no site publicado **podem sumir**, e o app volta aos dados de demonstração. Para uma **apresentação ou demonstração**, funciona bem. Para uso real, veja a seção [Dados permanentes](#dados-permanentes) no fim.

---

## Opção A — Pelo site da Vercel (recomendado)

### 1. Crie a conta
1. Acesse **https://vercel.com/signup**.
2. Clique em **Continue with GitHub** e entre com a conta `igorpompeu22-netizen`.
3. Escolha o plano **Hobby** (gratuito).

### 2. Importe o repositório
1. No painel, clique em **Add New… → Project**.
2. Em **Import Git Repository**, procure `pcdisk`.
   - Se ele não aparecer, clique em **Adjust GitHub App Permissions** (ou **Configure GitHub App**) e dê acesso ao repositório `pcdisk`.
3. Clique em **Import** ao lado de `igorpompeu22-netizen/pcdisk`.

### 3. Configure o projeto
Na tela **Configure Project**:

| Campo | Valor |
|---|---|
| **Project Name** | `rota-livre` (ou `pcdisk`; vira o endereço `rota-livre.vercel.app`) |
| **Framework Preset** | **Other** |
| **Root Directory** | `./` (deixe como está) |
| **Build Command** | deixe vazio |
| **Output Directory** | `public` (já vem do `vercel.json`) |
| **Install Command** | `npm install` (padrão) |

Abra **Environment Variables** e adicione:

| Name | Value |
|---|---|
| `ADMIN_TOKEN` | uma senha forte só sua, ex.: `Rl-2026-k9#tQ7v!` |

> Sem `ADMIN_TOKEN`, a moderação usa o código público `admin-demo` — qualquer pessoa conseguiria aprovar ou rejeitar registros. **Defina essa variável.**

### 4. Publique
1. Clique em **Deploy**.
2. Aguarde 1 a 2 minutos. Vai aparecer **Congratulations!** com uma prévia do site.
3. Clique em **Continue to Dashboard**. O endereço público aparece em **Domains**, por exemplo `https://rota-livre.vercel.app`.

### 5. Confira se está tudo funcionando
Abra estes endereços (troque pelo seu domínio):

| Endereço | O que deve aparecer |
|---|---|
| `https://SEU-DOMINIO.vercel.app/` | Página inicial da Rota Livre |
| `https://SEU-DOMINIO.vercel.app/api/catalogo` | Um texto em JSON começando com `{"itens":` |
| `https://SEU-DOMINIO.vercel.app/#/painel` | Painel com o elevador do Bloco A parado |
| `https://SEU-DOMINIO.vercel.app/#/moderacao` | Entra com o **seu** `ADMIN_TOKEN` |

### 6. Atualizações automáticas
Cada `git push` na branch padrão do repositório (hoje `claude/pcdisk-web-app-d89x7o`) gera uma nova publicação em produção, sozinha. Pushes em outras branches geram **links de prévia** separados.

> Se depois você criar uma branch `main` e torná-la a padrão no GitHub, ajuste na Vercel: **Settings → Environments → Production → Branch Tracking** e escolha `main`.

---

## Opção B — Pelo terminal (Vercel CLI)

```bash
npm install -g vercel          # instala a CLI
cd pcdisk                      # pasta do projeto
vercel login                   # abre o navegador para entrar
vercel                         # primeira publicação (prévia) — responda:
                               #   Set up and deploy? → Y
                               #   Which scope? → sua conta
                               #   Link to existing project? → N
                               #   Project name? → rota-livre
                               #   In which directory is your code located? → ./
                               #   Want to modify these settings? → N
vercel env add ADMIN_TOKEN production   # digite a senha da moderação
vercel --prod                  # publica em produção
```

No fim, a CLI mostra o endereço de produção (`https://rota-livre.vercel.app`).

---

## Domínio próprio (opcional)
Em **Settings → Domains → Add**, digite o domínio (ex.: `rotalivre.com.br`) e siga as instruções de DNS que a Vercel mostrar. O certificado HTTPS é automático.

## Placas QR
O QR de cada local aponta para o endereço em que o site estiver no momento da impressão. **Imprima as placas só depois de definir o domínio final.**

---

## Como fica cada recurso na Vercel

| Recurso | Na Vercel |
|---|---|
| Site, semáforo, rotas, direitos, placas QR | ✅ Funcionam normalmente |
| Painel “ao vivo” | ✅ A conexão em tempo real é renovada a cada ~50 s e, como reserva, o painel se atualiza a cada 30 s |
| Registros, confirmações, cadastros e eventos novos | ⚠️ Temporários: podem sumir quando a função reinicia |
| Fotos enviadas | ⚠️ Temporárias, pelo mesmo motivo |

Para demonstrar, **faça o roteiro inteiro em sequência** (relatar → moderar → responder → acompanhar). Assim tudo acontece na mesma instância, enquanto ela está ativa.

## Dados permanentes

Para os dados não se perderem, troque o armazenamento em arquivo (`server/store.js`) por um serviço gerenciado:

- **Banco de dados:** Neon (Postgres) ou Upstash (Redis), pelo **Storage / Marketplace** da Vercel — têm plano gratuito;
- **Fotos:** Vercel Blob.

A interface de `store.js` é pequena (`all`, `get`, `insert`, `save`), então a troca fica concentrada nesse arquivo e em `salvarFoto` (em `server/app.js`).

Outra saída, sem mudar código: publicar em um serviço com **servidor contínuo e disco persistente** (Render, Railway ou Fly.io). Neles, `npm start` roda o app como está, com `DATA_DIR` apontando para o volume persistente.

## Problemas comuns

| Sintoma | Solução |
|---|---|
| `404` em `/api/...` | Confira se `vercel.json` e a pasta `api/` estão no repositório e se o **Root Directory** é `./` |
| Página em branco | Confira se o **Output Directory** é `public` e se o **Framework Preset** é **Other** |
| “Acesso restrito à moderação” | Use o valor de `ADMIN_TOKEN`. Se mudou a variável, faça **Redeploy** (Deployments → ⋯ → Redeploy) |
| Dados de teste sumiram | Comportamento esperado na Vercel — veja [Dados permanentes](#dados-permanentes) |
| Erro de build mencionando Node | Em **Settings → General → Node.js Version**, escolha **22.x** |
