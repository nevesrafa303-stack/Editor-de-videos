// Gera os arquivos de produção do site (sites/vanessa-marinho):
//   assets/js/app.min.js   = GSAP + ScrollTrigger + Lenis + main.js minificado
//   assets/css/style.min.css
//   boot.js embutido no <head> e hash sha256 atualizado na CSP (HTML, _headers, vercel.json, .htaccess)
// Uso: cd sites/_fontes/vanessa-marinho && npm install && npm run build
import { transform } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SITE = new URL('../../vanessa-marinho/', import.meta.url).pathname;
const r = (p) => readFileSync(join(SITE, p), 'utf8');
const w = (p, s) => writeFileSync(join(SITE, p), s);

// JS
const main = await transform(r('assets/js/main.js'), { minify: true, target: 'es2019', legalComments: 'none' });
const vendor = ['gsap.min.js', 'ScrollTrigger.min.js', 'lenis.min.js'].map((f) => r('assets/vendor/' + f)).join('\n;\n');
w('assets/js/app.min.js', vendor + '\n;\n' + main.code);

// CSS
const css = await transform(r('assets/css/style.css'), { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] });
w('assets/css/style.min.css', css.code);

// boot inline + hash
const boot = (await transform(r('assets/js/boot.js'), { minify: true, target: 'es2015' })).code.trim();
const hash = "'sha256-" + createHash('sha256').update(boot).digest('base64') + "'";
const cspScript = (s) => s.replace(/script-src 'self'( 'sha256-[^']+')?/g, "script-src 'self' " + hash);

let html = r('index.html');
html = html.replace(/<script(?: data-boot)?>[^<]*<\/script>\n?(?=<\/head>)|<script src="assets\/js\/boot\.js"><\/script>\n?/, '<script data-boot>' + boot + '</script>\n');
html = cspScript(html);
w('index.html', html);
for (const f of ['_headers', 'vercel.json', '.htaccess']) w(f, cspScript(r(f)));

const kb = (p) => (readFileSync(join(SITE, p)).length / 1024).toFixed(1) + ' KB';
console.log('app.min.js', kb('assets/js/app.min.js'), '| style.min.css', kb('assets/css/style.min.css'), '| boot', boot.length, 'B', hash);
