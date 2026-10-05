/**
 * Encaixa as imagens no site — um comando, sem edição manual.
 *
 *   1. coloque os arquivos em `imagens/entrada/` com os nomes do PROMPTS.md
 *   2. node imagens/aplicar.mjs
 *
 * O script converte cada um para WebP no tamanho que o lugar pede, troca o
 * base64 correspondente dentro do HTML e regenera o HTML estático.
 *
 * Aceita jpg, jpeg, png e webp. Arquivo ausente é pulado sem reclamar: dá
 * para ir subindo as imagens aos poucos.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const HTML = join(RAIZ, 'single-file', 'arena-colossal.html');
const ENTRADA = join(AQUI, 'entrada');
const TMP = join(AQUI, '.tmp');

/* Ordem igual à de SERVICOS no site: serviço N usa a classe .qNN. */
const SERVICOS = [
  'lavagem-tecnica', 'higienizacao-interna', 'higienizacao-couro',
  'higienizacao-ar-condicionado', 'descontaminacao', 'polimento-tecnico',
  'vitrificacao', 'protecao-plasticos', 'protecao-pneus', 'restauracao-farois',
];

/* Largura de entrega por lugar. O cartão nunca passa de ~400px na tela, e
   480 cobre telas de densidade 2x sem engordar o arquivo à toa. */
const CARTAO = { largura: 480, altura: 360, qualidade: 70 };

const achar = (nome) => {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const p = join(ENTRADA, `${nome}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
};

async function paraWebp(origem, destino, { largura, altura, qualidade }) {
  await exec('ffmpeg', ['-v', 'error', '-i', origem,
    '-vf', `scale=${largura}:${altura}:force_original_aspect_ratio=increase,crop=${largura}:${altura}`,
    '-c:v', 'libwebp', '-quality', String(qualidade), destino, '-y']);
  return readFile(destino);
}

const kb = (n) => `${Math.round(n / 1024)} kB`;

async function principal() {
  if (!existsSync(ENTRADA)) {
    console.error(`Pasta não encontrada: ${ENTRADA}`);
    process.exit(1);
  }
  await mkdir(TMP, { recursive: true });

  let html = await readFile(HTML, 'utf8');
  const antes = html.length;
  let trocadas = 0, faltando = [];

  for (let i = 0; i < SERVICOS.length; i++) {
    const slug = SERVICOS[i];
    const origem = achar(slug);
    if (!origem) { faltando.push(slug); continue; }

    const classe = `.q${String(i + 1).padStart(2, '0')}`;
    const buf = await paraWebp(origem, join(TMP, `${slug}.webp`), CARTAO);
    const b64 = buf.toString('base64');

    /* Troca só a URL dentro da regra daquela classe. O escape do ponto
       importa: sem ele `.q01` casaria com qualquer caractere antes de q01. */
    const re = new RegExp(`(\\${classe}\\{background-image:url\\(data:image/webp;base64,)[^)]+(\\)\\})`);
    if (!re.test(html)) {
      console.error(`  ! regra ${classe} não encontrada no HTML — pulei ${slug}`);
      continue;
    }
    html = html.replace(re, `$1${b64}$2`);
    trocadas++;
    console.log(`  ${classe}  ${slug.padEnd(30)} ${kb(buf.length)}`);
  }

  if (!trocadas) {
    console.log('\nNenhuma imagem encontrada em imagens/entrada/.');
    console.log('Os nomes esperados estão em imagens/PROMPTS.md.');
    return;
  }

  await writeFile(HTML, html);
  console.log(`\n${trocadas} imagem(ns) embutida(s) · arquivo ${kb(antes)} → ${kb(html.length)}`);
  if (faltando.length) console.log(`Ainda faltam: ${faltando.join(', ')}`);

  console.log('\nRegenerando o HTML estático…');
  const { stdout } = await exec('node', [join(RAIZ, 'single-file', 'regenerar-fallback.mjs')]);
  console.log(stdout.trim());
}

principal().catch((e) => { console.error(e); process.exit(1); });
