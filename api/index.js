// Ponto de entrada da Vercel: a API Express roda como função serverless.
// Os arquivos de public/ são servidos pela CDN da Vercel (ver vercel.json).
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';

// Na Vercel só /tmp aceita escrita, e ele é temporário (ver DEPLOY.md).
const app = createApp({ dataDir: process.env.DATA_DIR || path.join(os.tmpdir(), 'rotalivre') });

export default app;
