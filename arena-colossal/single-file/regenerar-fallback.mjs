/**
 * Regenera o conteúdo estático do arquivo único.
 *
 * O site precisa aparecer inteiro mesmo quando o JavaScript não roda
 * (visualizador de arquivo, CSP, leitor). Para isso a home está escrita no
 * HTML — mas esse HTML é o mesmo que os renderizadores produzem, e eles leem
 * o `CONFIG`. Mudou o CONFIG (WhatsApp, endereço, horário, imagens, avaliações),
 * o HTML estático ficou desatualizado.
 *
 * Este script abre o arquivo num Chromium, deixa o JavaScript montar a home e
 * grava de volta o resultado de cada container. Nada é escrito à mão.
 *
 *   node single-file/regenerar-fallback.mjs
 *
 * Cada renderizador limpa o container antes de montar, então o JS reassume
 * esses blocos sem duplicar. Se um container novo for criado, acrescente o id
 * em CONTAINERS.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ARQUIVO = join(dirname(fileURLToPath(import.meta.url)), 'arena-colossal.html');

const CONTAINERS = [
  'navLinks', 'menuLinks', 'marq', 'svcList', 'layList', 'hotPts', 'hotPanel',
  'stdList', 'procList', 'revBox', 'audList', 'faqList',
  'locBox', 'mapBox', 'footNav', 'footContact', 'footHours',
  'seloHero', 'seloFinal',
];

/** `#agProx` fica de fora de propósito: o próximo horário livre depende da
 *  data de hoje e congelá-lo no HTML mostraria um dia que já passou.
 *  `#baList` saiu da home: a comparação antes/depois espera foto real da
 *  Arena — um comparador de placeholders não prova nada.
 *  `#diag` e `#bkBox` ficam de fora: sem JS eles não teriam como funcionar, e
 *  o HTML traz a explicação disso em vez de um formulário que não confirma nada. */

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

// Playwright é ferramenta de build, não dependência do site: o arquivo
// entregue não usa nada disso. Por isso a importação é tardia e o erro
// explica o que instalar.
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

/** Link de WhatsApp já resolvido a partir do CONFIG, ou null se não houver número. */
const linkWhats = await pagina.evaluate(() => {
  const a = document.querySelector('#footContact [data-wa], [data-wa][href]');
  return a instanceof HTMLAnchorElement ? a.href : null;
});

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

/* Os CTAs de WhatsApp escritos à mão no HTML só ganham href pelo JS
   (`ligarWhats`). Sem JS eles virariam texto morto — justamente o botão que
   mais converte. Aqui o link resolvido entra no próprio markup; o JS continua
   reescrevendo por cima, e sem número configurado o href some, que é o
   comportamento de quem não quer levar o visitante a lugar nenhum. */
const comData = /(<a\b(?=[^>]*\bdata-wa\b)[^>]*?)>/gi;
html = html.replace(comData, (_tag, atributos) => {
  const limpo = atributos
    .replace(/\s+href="[^"]*"/i, '')
    .replace(/\s+target="[^"]*"/i, '')
    .replace(/\s+rel="[^"]*"/i, '');
  if (linkWhats === null) return `${limpo}>`;
  return `${limpo} href="${linkWhats}" target="_blank" rel="noopener noreferrer">`;
});

await writeFile(ARQUIVO, html);
console.log(`${CONTAINERS.length} containers regravados · ${Math.round(html.length / 1024)} kB`);
