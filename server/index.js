import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { TOKENS_DEMO } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const port = Number(process.env.PORT) || 3000;

const app = createApp({ dataDir });
app.listen(port, () => {
  console.log(`Rota Livre — by PCDisk rodando em http://localhost:${port}`);
  if (!process.env.ADMIN_TOKEN) {
    console.log('Moderação: código de demonstração "admin-demo" (defina ADMIN_TOKEN em produção).');
  }
  console.log(`Painel do estabelecimento (demo): ${Object.values(TOKENS_DEMO).join(', ')}`);
});
