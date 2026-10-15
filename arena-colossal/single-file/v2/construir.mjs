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

/* ---------- o estilo do formulário de agendamento, da v1 ----------
   Esta lista NÃO é adivinhada por prefixo. Foi levantada percorrendo os cinco
   passos do formulário num navegador e juntando toda classe que aparece no
   DOM. A versão por prefixo pegava `.days` e deixava `.day` de fora: os chips
   de data nasciam com largura zero, empilhados uns sobre os outros, e nada
   no build acusava. Classe nova no formulário da v1 entra aqui.

   Para refazer a lista: abra a v1, ande pelos cinco passos e colete
   `[...document.querySelectorAll('#bkBox *')]` com suas classes. */
const CLASSES_AG = [
  'bk', 'bk__act', 'bk__help', 'bk__legend', 'bk__nav', 'bk__opt', 'bk__opts',
  'bk__panel', 'bk__pbar', 'bk__s', 'bk__steps',
  'check', 'day', 'day__m', 'days', 'diag__back',
  'done', 'done__a', 'done__m', 'done__p',
  'field', 'form', 'hp', 'note', 'note--i', 'note--w',
  'row', 'slot', 'slots', 'sum', 'sum__r',
];
// `(?![\w-])` para `.day` não casar com `.days` por acidente — e vice-versa:
// as duas estão na lista porque as duas existem, não porque uma cobre a outra.
const alvoAg = new RegExp(
  '\\.(?:' + CLASSES_AG.slice().sort((a, b) => b.length - a.length)
    .map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\w-])');
const casa = (regra) => alvoAg.test(regra.split('{')[0]);

const soltas = [...css1.matchAll(/(?:^|\n)([^\n{}]*\{[^{}]*\})/g)]
  .map(m => m[1]).filter(casa);

/* As regras dentro de @media precisam voltar com o @media em volta, senão o
   formulário perde o layout largo e cai no de celular em qualquer tela. */
const emMedia = [];
for (const m of css1.matchAll(/@media[^{]*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
  const dentro = [...m[1].matchAll(/([^\n{}]*\{[^{}]*\})/g)].map(x => x[1]).filter(casa);
  if (dentro.length) emMedia.push(`${m[0].slice(0, m[0].indexOf('{') + 1)}${dentro.join('')}}`);
}

const estiloAg = [...soltas, ...emMedia].join('\n');
// Rede de segurança: se a v1 reorganizar o CSS e o casamento quebrar, a
// montagem para aqui em vez de publicar um formulário sem estilo.
if (soltas.length < 60) throw new Error(`só ${soltas.length} regras do agendamento casaram — a lista CLASSES_AG ficou desatualizada`);

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
