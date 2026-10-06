import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularRota } from '../server/routing.js';

test('cadeirante nunca usa escada', () => {
  const r = calcularRota({ de: 'portaria', para: 'blA', perfil: 'cadeirante' });
  assert.equal(r.encontrada, true);
  assert.ok(!r.passos.some((p) => p.tipo === 'escada'));
});

test('sem restrição de perfil, a escada do atalho é usada', () => {
  const r = calcularRota({ de: 'portaria', para: 'blA', perfil: '' });
  assert.ok(r.passos.some((p) => p.tipo === 'escada'));
});

test('elevador parado bloqueia o 2º andar para cadeirante e gera aviso', () => {
  const equipamentos = [{ id: 'eq-elev-a', nome: 'Elevador do Bloco A', status: 'parado' }];
  const r = calcularRota({ de: 'portaria', para: 'blA2', perfil: 'cadeirante', equipamentos });
  assert.equal(r.encontrada, false);
  assert.match(r.avisos[0], /Elevador do Bloco A/);
});

test('passarela interditada faz a rota desviar', () => {
  const livre = calcularRota({ de: 'blB', para: 'blC', perfil: 'cadeirante' });
  assert.ok(livre.arestas.includes('a15'));
  const equipamentos = [{ id: 'eq-passarela', nome: 'Passarela', status: 'interditado' }];
  const desvio = calcularRota({ de: 'blB', para: 'blC', perfil: 'cadeirante', equipamentos });
  assert.equal(desvio.encontrada, true);
  assert.ok(!desvio.arestas.includes('a15'));
  assert.ok(desvio.avisos.length > 0);
});

test('rampa íngreme (11%) é evitada por cadeirante', () => {
  const r = calcularRota({ de: 'ru', para: 'gin', perfil: 'cadeirante' });
  assert.equal(r.encontrada, true);
  assert.ok(!r.arestas.includes('a22'));
});

test('barreira aprovada em trecho é considerada', () => {
  const barreiras = [{ trecho: 'a19', moderacao: 'aprovado', status: 'aberto', protocolo: 'RL-X', categoria: 'calcada' }];
  const r = calcularRota({ de: 'bib', para: 'ru', perfil: 'cadeirante', barreiras });
  assert.ok(!r.arestas.includes('a19'));
});
