/* Troca o vídeo do hero (paisagem + vertical + poster) dentro do HTML.
   Uso: node trocar-hero.mjs <wide.mp4> <vert.mp4> <poster.webp>

   O arquivo é único e tudo mora nele em base64, então a troca é uma
   substituição cirúrgica: só os três data: URIs de dentro de <video>,
   nunca os das imagens dos serviços, que usam o mesmo esquema. */
import fs from 'node:fs';

const [, , pWide, pVert, pPoster] = process.argv;
if (!pWide || !pVert || !pPoster) {
  console.error('uso: node trocar-hero.mjs <wide.mp4> <vert.mp4> <poster.webp>');
  process.exit(1);
}

const ALVO = new URL('./arena-colossal.html', import.meta.url);
let html = fs.readFileSync(ALVO, 'utf8');

const ini = html.indexOf('<video class="hero__vid"');
const fim = html.indexOf('</video>', ini);
if (ini < 0 || fim < 0) throw new Error('bloco <video> do hero não encontrado');

let bloco = html.slice(ini, fim);
const b64 = (p) => fs.readFileSync(p).toString('base64');

const poster = b64(pPoster);
const n1 = bloco.replace(/poster="data:image\/webp;base64,[A-Za-z0-9+/=]+"/,
  () => `poster="data:image/webp;base64,${poster}"`);
if (n1 === bloco) throw new Error('poster não substituído');
bloco = n1;

// A primeira fonte é a de tela larga (tem media=), a segunda é a vertical.
const fontes = [...bloco.matchAll(/src="data:video\/mp4;base64,([A-Za-z0-9+/=]+)"/g)];
if (fontes.length !== 2) throw new Error(`esperava 2 fontes, achei ${fontes.length}`);
const novos = [b64(pWide), b64(pVert)];
let saida = '', ultimo = 0;
fontes.forEach((m, k) => {
  saida += bloco.slice(ultimo, m.index) + `src="data:video/mp4;base64,${novos[k]}"`;
  ultimo = m.index + m[0].length;
});
bloco = saida + bloco.slice(ultimo);

html = html.slice(0, ini) + bloco + html.slice(fim);
fs.writeFileSync(ALVO, html);

const kb = (p) => (fs.statSync(p).size / 1024).toFixed(1);
console.log(`hero trocado — paisagem ${kb(pWide)} kB · vertical ${kb(pVert)} kB · poster ${kb(pPoster)} kB`);
console.log(`arquivo agora com ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
