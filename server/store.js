// Armazenamento simples em arquivo JSON, com escrita atômica.
// Suficiente para o piloto no campus; troque por um banco de dados em produção.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const COLECOES = ['locais', 'confirmacoes', 'equipamentos', 'barreiras', 'eventos', 'testes'];

export function createStore(dataDir, seedFn) {
  fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });
  const file = path.join(dataDir, 'db.json');
  let db;
  if (fs.existsSync(file)) {
    db = JSON.parse(fs.readFileSync(file, 'utf8'));
  } else {
    db = Object.fromEntries(COLECOES.map((c) => [c, []]));
    db.meta = { protocolo: 0 };
    if (seedFn) seedFn(db);
  }
  for (const c of COLECOES) db[c] ??= [];
  db.meta ??= { protocolo: 0 };

  let timer = null;
  function persist() {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 1));
    fs.renameSync(tmp, file);
  }
  function save() {
    clearTimeout(timer);
    timer = setTimeout(persist, 50);
  }
  persist();

  return {
    db,
    dataDir,
    uploadsDir: path.join(dataDir, 'uploads'),
    save,
    flush() {
      clearTimeout(timer);
      persist();
    },
    all(col) {
      return db[col];
    },
    get(col, id) {
      return db[col].find((x) => x.id === id);
    },
    insert(col, obj) {
      const item = { id: obj.id ?? newId(), criadoEm: new Date().toISOString(), ...obj };
      db[col].push(item);
      save();
      return item;
    },
    nextProtocolo() {
      db.meta.protocolo += 1;
      save();
      const ano = new Date().getFullYear();
      return `RL-${ano}-${String(db.meta.protocolo).padStart(6, '0')}`;
    },
  };
}

export function newId() {
  return crypto.randomBytes(6).toString('base64url');
}

export function newToken() {
  return crypto.randomBytes(18).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}
