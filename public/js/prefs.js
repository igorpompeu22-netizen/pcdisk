// Preferências guardadas SOMENTE no aparelho (LGPD: o perfil de necessidade é dado sensível).
const K = { perfil: 'rl.perfil', consent: 'rl.consentimento', a11y: 'rl.acessibilidade', registros: 'rl.registros' };

function ler(chave, padrao) {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : padrao;
  } catch {
    return padrao;
  }
}
function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* armazenamento indisponível: segue sem guardar */
  }
}

export const prefs = {
  perfil() {
    return ler(K.consent, null)?.aceito ? ler(K.perfil, null) : null;
  },
  consentimento() {
    return ler(K.consent, null);
  },
  salvarPerfil(perfil) {
    gravar(K.consent, { aceito: true, em: new Date().toISOString(), versao: '1.0' });
    gravar(K.perfil, perfil);
  },
  a11y() {
    return ler(K.a11y, { fonte: 1, contraste: false, movimento: false });
  },
  salvarA11y(v) {
    gravar(K.a11y, v);
  },
  registros() {
    return ler(K.registros, []);
  },
  adicionarRegistro(protocolo, chave) {
    const lista = ler(K.registros, []).filter((r) => r.protocolo !== protocolo);
    lista.unshift({ protocolo, chave, em: new Date().toISOString() });
    gravar(K.registros, lista);
  },
  apagarTudo() {
    try {
      for (const k of Object.values(K)) localStorage.removeItem(k);
      for (const k of Object.keys(localStorage)) if (k.startsWith('rl.')) localStorage.removeItem(k);
    } catch {
      /* nada a apagar */
    }
  },
  get(chave, padrao) {
    return ler(`rl.${chave}`, padrao);
  },
  set(chave, valor) {
    gravar(`rl.${chave}`, valor);
  },
};
