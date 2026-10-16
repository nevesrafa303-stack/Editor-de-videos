#!/usr/bin/env node
/**
 * Prepara os assets dos criativos Aport Seguros para o Remotion.
 *
 * - copia assets/aport/{hospitais,logos} -> public/aport/
 * - registra em src/generated/aport-assets.json quais logos oficiais existem
 *
 * Logos: coloque PNGs com fundo transparente em assets/aport/logos/ com os
 * nomes bradesco.png, sulamerica.png, porto.png e aport.png. Sem o arquivo,
 * o criativo usa a marca em texto nas cores da operadora.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const SRC = path.join(ROOT, 'assets/aport');
const DST = path.join(ROOT, 'public/aport');

for (const pasta of ['hospitais', 'logos']) {
  const de = path.join(SRC, pasta);
  if (!fs.existsSync(de)) continue;
  fs.mkdirSync(path.join(DST, pasta), {recursive: true});
  for (const f of fs.readdirSync(de)) {
    if (f.startsWith('.')) continue;
    fs.copyFileSync(path.join(de, f), path.join(DST, pasta, f));
  }
}

const logos = {};
for (const id of ['bradesco', 'sulamerica', 'porto', 'aport']) {
  if (fs.existsSync(path.join(SRC, 'logos', `${id}.png`))) logos[id] = `aport/logos/${id}.png`;
}

fs.writeFileSync(
  path.join(ROOT, 'src/generated/aport-assets.json'),
  JSON.stringify({logos}, null, 2) + '\n',
);
console.log(`assets Aport em public/aport | logos oficiais: ${Object.keys(logos).join(', ') || 'nenhum (usando marca em texto)'}`);
