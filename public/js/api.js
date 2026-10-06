// Cliente da API e conexão em tempo real.
export async function api(url, { method = 'GET', body, headers = {} } = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const dados = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(dados?.erro ?? `Erro ${res.status}`);
  return dados;
}

let catalogo = null;
export async function getCatalogo() {
  catalogo ??= await api('/api/catalogo');
  return catalogo;
}

const ouvintes = new Set();
let fonte = null;
export function aoVivo(fn) {
  ouvintes.add(fn);
  if (!fonte && 'EventSource' in window) {
    fonte = new EventSource('/api/stream');
    for (const tipo of ['equipamento', 'barreira', 'local']) {
      fonte.addEventListener(tipo, (ev) => {
        const dados = JSON.parse(ev.data);
        for (const f of ouvintes) f(tipo, dados);
      });
    }
  }
  return () => ouvintes.delete(fn);
}
