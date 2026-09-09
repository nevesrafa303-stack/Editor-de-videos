#!/usr/bin/env node
/**
 * ETAPA 0 (pre-requisito) — Fontes LOCAIS.
 *
 * O pipeline tem de ser 100% local e reproduzivel: carregar Google Fonts pela
 * rede durante o render torna o resultado dependente de rede e de CA do
 * ambiente. Aqui baixamos UMA VEZ os woff2 de que os presets precisam
 * (subsets latin + latin-ext, so os pesos usados) para public/fonts/, e o
 * Remotion passa a registra-los com @remotion/fonts via staticFile().
 *
 * Rode uma vez por maquina. Depois disso o render nao toca a rede.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'public/fonts');
fs.mkdirSync(destino, {recursive: true});

// Apenas os pesos que os componentes realmente usam.
const FAMILIAS = [
  {familia: 'Montserrat', spec: 'ital,wght@0,500;0,700;0,800;0,900'},
  {familia: 'Playfair Display', spec: 'wght@500;800'},
  {familia: 'Lora', spec: 'ital,wght@0,500;1,500'},
];

// Subsets que cobrem PT-BR. O resto (cirilico, vietnamita) e peso morto.
const SUBSETS = ['latin', 'latin-ext'];

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const manifesto = [];

for (const {familia, spec} of FAMILIAS) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familia).replace(/%20/g, '+')}:${spec}&display=swap`;
  const css = await (await fetch(url, {headers: {'User-Agent': UA}})).text();

  // O CSS vem em blocos comentados com o nome do subset antes de cada @font-face.
  const blocos = css.split('/*').slice(1);
  for (const bloco of blocos) {
    const subset = bloco.slice(0, bloco.indexOf('*/')).trim();
    if (!SUBSETS.includes(subset)) continue;

    const src = bloco.match(/url\((https:[^)]+\.woff2)\)/);
    const peso = bloco.match(/font-weight:\s*(\d+)/);
    const estilo = bloco.match(/font-style:\s*(\w+)/);
    if (!src) continue;

    const nome =
      `${familia.replace(/\s+/g, '')}-${peso ? peso[1] : '400'}` +
      `${estilo && estilo[1] === 'italic' ? '-italic' : ''}-${subset}.woff2`;
    const arquivo = path.join(destino, nome);

    if (!fs.existsSync(arquivo)) {
      const buf = Buffer.from(await (await fetch(src[1])).arrayBuffer());
      fs.writeFileSync(arquivo, buf);
      console.log(`baixado ${nome} (${(buf.length / 1024).toFixed(0)} kB)`);
    } else {
      console.log(`ja existe ${nome}`);
    }

    manifesto.push({
      familia,
      arquivo: `fonts/${nome}`,
      peso: peso ? peso[1] : '400',
      estilo: estilo ? estilo[1] : 'normal',
      subset,
    });
  }
}

fs.writeFileSync(
  path.join(raiz, 'src/generated/fonts.json'),
  JSON.stringify(manifesto, null, 2),
);
console.log(`\n${manifesto.length} arquivos em public/fonts/ | manifesto: src/generated/fonts.json`);
