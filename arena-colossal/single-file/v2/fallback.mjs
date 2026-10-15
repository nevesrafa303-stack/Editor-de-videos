/**
 * Regenera o conteúdo estático da v2.
 *
 * Mesma ideia do `regenerar-fallback.mjs` da v1: o rodapé e alguns textos são
 * montados pelo JavaScript a partir do CONFIG, e sem JavaScript ficariam
 * vazios. Este script abre o arquivo num Chromium, deixa o boot montar, e
 * grava o resultado de volta no HTML. O JS continua reescrevendo por cima.
 *
 *   node v2/fallback.mjs
 *
 * Rode sempre depois de `construir.mjs`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ARQUIVO = join(AQUI, '..', 'arena-colossal-v2.html');

const CONTAINERS = ['agP1', 'peEnd', 'peHoras', 'peContato', 'peSelo', 'ano'];

/* `#bkBox` fica de fora de propósito: sem JavaScript o formulário não teria
   como confirmar nada, e o HTML já traz a explicação e o botão do WhatsApp
   no lugar dele. */

/** Fim do conteúdo de um elemento, contando abertura e fechamento da mesma tag. */
function fimDoConteudo(html, inicio, tag) {
  const re = new RegExp(`<(/?)${tag}(?=[\\s/>])`, 'gi');
  re.lastIndex = inicio;
  let nivel = 1;
  for (let m = re.exec(html); m !== null; m = re.exec(html)) {
    nivel += m[1] === '/' ? -1 : 1;
    if (nivel === 0) return m.index;
  }
  throw new Error(`fechamento de <${tag}> não encontrado`);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Este script precisa do Playwright:\n  npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
const erros = [];
pagina.on('pageerror', (e) => erros.push(e.message));
await pagina.goto(pathToFileURL(ARQUIVO).href, { waitUntil: 'load' });
await pagina.waitForTimeout(2500);

const linkWhats = await pagina.evaluate(() => {
  const a = document.querySelector('[data-wa][href]');
  return a instanceof HTMLAnchorElement ? a.href : null;
});
const linkMapa = await pagina.evaluate(() => document.getElementById('peMapa')?.getAttribute('href') ?? null);

const fragmentos = await pagina.evaluate(
  (ids) => Object.fromEntries(ids.map((id) => [id, document.getElementById(id)?.innerHTML ?? null])),
  CONTAINERS,
);
await navegador.close();

if (erros.length > 0) {
  console.error('A página lançou erro; nada foi gravado:\n' + erros.join('\n'));
  process.exit(1);
}

let html = await readFile(ARQUIVO, 'utf8');

for (const id of CONTAINERS) {
  const conteudo = fragmentos[id];
  if (conteudo === null) {
    console.error(`#${id} não existe na página — confira CONTAINERS.`);
    process.exit(1);
  }
  const marca = html.indexOf(`id="${id}"`);
  if (marca === -1) throw new Error(`id="${id}" não encontrado no arquivo`);
  const aberturaInicio = html.lastIndexOf('<', marca);
  const tag = /^<([a-zA-Z][\w-]*)/.exec(html.slice(aberturaInicio))[1];
  const aberturaFim = html.indexOf('>', marca) + 1;
  const fim = fimDoConteudo(html, aberturaFim, tag);
  html = html.slice(0, aberturaFim) + conteudo + html.slice(fim);
}

/* O link do mapa também só nasce no JS. */
if (linkMapa) {
  html = html.replace(/(<a\b(?=[^>]*\bid="peMapa")[^>]*?)>/i, (_t, attrs) =>
    `${attrs.replace(/\s+href="[^"]*"/i, '')} href="${linkMapa}">`);
}

/* Os CTAs de WhatsApp escritos à mão só ganham href pelo JS (`ligarWhats`).
   Sem JS virariam texto morto — justamente o botão que mais converte. */
html = html.replace(/(<a\b(?=[^>]*\bdata-wa\b)[^>]*?)>/gi, (_tag, atributos) => {
  const limpo = atributos
    .replace(/\s+href="[^"]*"/i, '')
    .replace(/\s+target="[^"]*"/i, '')
    .replace(/\s+rel="[^"]*"/i, '');
  if (linkWhats === null) return `${limpo}>`;
  return `${limpo} href="${linkWhats}" target="_blank" rel="noopener noreferrer">`;
});

await writeFile(ARQUIVO, html);
console.log(`${CONTAINERS.length} containers regravados · ${Math.round(html.length / 1024)} kB`);
