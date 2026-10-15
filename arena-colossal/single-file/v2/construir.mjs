/**
 * Monta a v2 a partir do template + os pedaços já testados da v1.
 *
 *   node v2/construir.mjs
 *
 * A v2 não é um fork: ela importa da v1 os ativos pesados (fontes, logo,
 * vídeo, imagens dos serviços) e os três blocos do motor de agendamento,
 * verbatim. O que é dela são o desenho, o texto e o boot. Assim um
 * conserto no agendamento vale para as duas sem copiar nada à mão.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const V1 = join(AQUI, '..', 'arena-colossal.html');
const SAIDA = join(AQUI, '..', 'arena-colossal-v2.html');

const v1 = await readFile(V1, 'utf8');
const css1 = v1.match(/<style>([\s\S]*?)<\/style>/)[1];
const blocos = [...v1.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

const pegar = (re, rotulo) => {
  const m = v1.match(re) || css1.match(re);
  if (!m) throw new Error(`não achei na v1: ${rotulo}`);
  return m[1] ?? m[0];
};

/* ---------- ativos ---------- */
const inter = css1.match(/@font-face\{[^}]*font-family:'Inter'[^}]*\}/)[0];
const anton = await readFile(join(AQUI, 'Anton-latin.woff2'));
const fontes = [
  `@font-face{font-family:'Anton';src:url(data:font/woff2;base64,${anton.toString('base64')}) format('woff2');font-weight:400;font-style:normal;font-display:swap}`,
  inter,
].join('\n');

/* As dez regras .qNN vêm inteiras: são as mesmas fotos, no mesmo tamanho. */
const imagens = [...css1.matchAll(/\.q\d\d\{background-image:url\(data:image\/webp;base64,[^)]+\)\}/g)]
  .map(m => m[0]).join('\n');
if (imagens.split('\n').length !== 10) throw new Error('esperava 10 regras .qNN');

const logo = pegar(/<img[^>]+class="logo__m"[^>]+src="(data:image\/[^"]+)"/, 'logo')
  || pegar(/src="(data:image\/webp;base64,[A-Za-z0-9+/=]{2000,})"/, 'logo');

const vhero = v1.match(/<video class="hero__vid"[\s\S]*?<\/video>/)[0];
const poster = vhero.match(/poster="(data:image\/webp;base64,[^"]+)"/)[1];
const videoLargo = vhero.match(/<source media="\(min-width:760px\)" src="(data:video\/mp4;base64,[^"]+)"/)[1];

const favicon = pegar(/<link rel="icon"[^>]+href="([^"]+)"/, 'favicon');

/* ---------- o estilo do formulário de agendamento, da v1 ---------- */
const marcas = ['.bk{', '.bk__', '.slot', '.days', '.campo', '.note', '.done'];
const regras = [...css1.matchAll(/(?:^|\n)([^\n{}]*\{[^{}]*\})/g)].map(m => m[1]);
const estiloAg = regras.filter(r => marcas.some(mk => r.trimStart().startsWith(mk))).join('\n');

/* ---------- as linhas de serviço, escritas na montagem ---------- */
const dados = blocos.find(b => /const\s+SERVICOS\s*=/.test(b));
const servicos = [...dados.matchAll(
  /\{\s*slug:'([^']+)',\s*n:'(\d+)',\s*nome:'([^']+)',\s*min:(\d+),\s*[\s\S]*?resumo:'([^']*)'/g)]
  .map(m => ({ slug:m[1], n:m[2], nome:m[3], min:+m[4], resumo:m[5] }));
if (servicos.length !== 10) throw new Error(`esperava 10 serviços, achei ${servicos.length}`);

const dur = (m) => m % 60 === 0 ? `${m / 60}h` : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const linhas = servicos.map(s => `<li><article class="linha">
  <div class="linha__n"><s>${s.n}</s><h3>${esc(s.nome)}</h3></div>
  <i class="linha__i q q${s.n}" aria-hidden="true"></i>
  <div class="linha__d">${esc(s.resumo)}
    <p class="linha__m"><span>${dur(s.min)}</span><b>Orçamento na avaliação</b></p>
  </div>
  <a class="seta linha__a" href="#agendamento" aria-label="Agendar ${esc(s.nome)}">Agendar</a>
</article></li>`).join('\n');

/* ---------- montagem ---------- */
const boot = await readFile(join(AQUI, 'boot.js'), 'utf8');
let html = await readFile(join(AQUI, 'template.html'), 'utf8');

/* ---------- ajustes de texto da v1 para a v2 ----------
   O motor do agendamento é o mesmo, mas a v2 é uma página só: não tem a
   ferramenta de diagnóstico nem a rota de acompanhamento. Deixar as duas
   frases como estão mandaria o cliente para lugar nenhum. */
const TEXTOS = [
  [`text:'Não tem certeza? Use o diagnóstico. Ele monta o processo e já traz o serviço marcado aqui.'`,
   `text:'Na dúvida, escolha o mais próximo: a combinação final é definida na avaliação, com o carro na frente.'`],

  ["html:`<a href=\"#/acompanhar/${encodeURIComponent(c.id)}\" style=\"color:var(--laranja);border-bottom:1px solid currentColor\">Acompanhar este agendamento</a>. Guarde o link, ele mostra o estado atual a qualquer momento.` }));",
   "html:`Código da reserva: <b style=\"color:var(--laranja)\">${c.id}</b>. Guarde este código, é por ele que a Arena localiza o seu horário.` }));"],
];
{
  let ag = blocos[4];
  for (const [de, para] of TEXTOS) {
    if (!ag.includes(de)) throw new Error('texto da v1 mudou, ajuste TEXTOS: ' + de.slice(0, 60));
    ag = ag.replace(de, () => para);
  }
  blocos[4] = ag;
}

const peças = {
  __FONTES__: fontes,
  __IMAGENS__: imagens,
  __ESTILO_AGENDAMENTO__: estiloAg,
  __LOGO__: logo,
  __FAVICON__: favicon,
  __POSTER__: poster,
  __VIDEO__: videoLargo,
  __SERVICOS__: linhas,
  __DADOS__: blocos[1].split(/\n(?=const CAMADAS)/)[0],
  __UTILIDADES__: blocos[2],
  __GRADE__: blocos[3],
  __AGENDAMENTO__: blocos[4],
  __BOOT__: boot,
};
for (const [chave, valor] of Object.entries(peças)) {
  if (!html.includes(chave)) throw new Error(`template sem o marcador ${chave}`);
  // Função, não string: com string o replaceAll interpreta $$, $& e $1 do
  // texto injetado. O código da v1 tem `const $$ = ...`, que virava `const $`
  // e derrubava tudo com "Identifier '$' has already been declared".
  html = html.replaceAll(chave, () => valor);
}
const sobrou = html.match(/__[A-Z_]+__/);
if (sobrou) throw new Error(`marcador não preenchido: ${sobrou[0]}`);

await writeFile(SAIDA, html);
const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
console.log(`v2 montada: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Anton ${kb(anton.length)} · Inter ${kb(inter.length)} · imagens ${kb(imagens.length)} · vídeo ${kb(videoLargo.length)}`);
console.log(`  ${servicos.length} serviços em linha · estilo do agendamento ${kb(estiloAg.length)}`);
