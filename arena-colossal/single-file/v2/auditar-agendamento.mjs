/**
 * Auditoria visual dos cinco passos do agendamento.
 *
 *   node v2/auditar-agendamento.mjs [mob|peq|desk] [v1]
 *
 * Por que existe: o teste de ponta a ponta clicava pelo formulário inteiro
 * sem nunca olhar para ele. Quando a montagem da v2 deixou as regras `.day`
 * de fora, os chips de data nasceram com largura zero, empilhados uns sobre
 * os outros — e o teste passou, porque os cliques funcionavam.
 *
 * Esta auditoria entra em cada passo e mede: elemento com largura zero,
 * linha estreita demais para a própria palavra, elemento fora da tela e
 * transbordo da página. Ignora o que é fora de propósito: trilhos que rolam
 * na horizontal e o campo-isca contra robô.
 *
 * Grava `fluxo-<tela>-<passo>.png` no diretório atual, para olhar depois.
 *
 * Passe `v1` como segundo argumento para auditar a v1 e comparar.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Este script precisa do Playwright:\n  npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const AQUI = dirname(fileURLToPath(import.meta.url));
const ARQ = process.argv[3] === 'v1'
  ? pathToFileURL(join(AQUI, '..', 'arena-colossal.html')).href + '#/agendamento'
  : pathToFileURL(join(AQUI, '..', 'arena-colossal-v2.html')).href + '#agendamento';
const [nome,W,H] = ({mob:['mob',390,844], peq:['peq',360,740], desk:['desk',1280,900]})[process.argv[2]||'mob'];
const b = await chromium.launch();
const ctx = await b.newContext({viewport:{width:W,height:H},isMobile:W<700,hasTouch:W<700,deviceScaleFactor:2});
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push('PE '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.goto(ARQ,{waitUntil:'load'}); await p.waitForTimeout(2500);

const auditar = async (passo) => {
  await p.evaluate(()=>document.getElementById('bkBox').scrollIntoView({block:'start'}));
  await p.waitForTimeout(450);
  const r = await p.evaluate((W)=>{
    const bx = document.getElementById('bkBox');
    const vis = e => e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true,contentVisibilityAuto:true});
    const todos = [...bx.querySelectorAll('*')].filter(vis);
    /* Trilhos que rolam na horizontal (passos, dias, horários) têm filhos
       fora da tela de propósito: é assim que se alcança o 30º dia num
       celular. Medir "está fora" dentro deles só produz alarme falso. */
    const emTrilho = (e) => {
      for (let n = e.parentElement; n && n !== document.body; n = n.parentElement){
        const o = getComputedStyle(n).overflowX;
        if ((o === 'auto' || o === 'scroll') && n.scrollWidth > n.clientWidth + 1) return true;
      }
      return false;
    };
    /* O campo-isca contra robô vive em -9999px de propósito. */
    const naIsca = (e) => !!e.closest('.hp');
    const marca = e => e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\s+/).join('.'):'');
    const zero = todos.filter(e=>{const q=e.getBoundingClientRect();
      return !naIsca(e) && e.textContent.trim() && q.height>2 && q.width<4;}).map(marca);   // largura zero é sempre defeito, trilho ou não
    // texto espremido: cabe menos que 6 caracteres na linha
    /* Espremido de verdade é a linha que não cabe a palavra mais longa do
       próprio texto: aí quebra no meio da palavra ou vaza. Largura menor que
       N vezes o corpo da fonte acusava rótulo curto ("DATA") como defeito. */
    const espremido = todos.filter(e=>{
      if (e.children.length || emTrilho(e) || naIsca(e)) return false;
      const t=e.textContent.trim();
      // Uma palavra só nunca é "espremida": rótulo curto cabe em qualquer lugar.
      if (t.length < 4 || !/\s/.test(t)) return false;
      const q=e.getBoundingClientRect(); if(q.width<2) return false;
      const maior=t.split(/\s+/).reduce((a,w)=>Math.max(a,w.length),0);
      // ~0,55em por caractere é uma estimativa folgada para Inter.
      return q.width < maior*parseFloat(getComputedStyle(e).fontSize)*0.55 - 1;
    }).map(marca);
    const fora = todos.filter(e=>{const q=e.getBoundingClientRect();
      return q.width>2 && (q.right>W+1 || q.left<-1)
        && getComputedStyle(e).position!=='fixed' && !emTrilho(e) && !naIsca(e);}).map(marca);
    return {zero:[...new Set(zero)].slice(0,8), espremido:[...new Set(espremido)].slice(0,8),
      fora:[...new Set(fora)].slice(0,8),
      transbordoPagina: document.documentElement.scrollWidth-document.documentElement.clientWidth,
      titulo:(bx.querySelector('h3')?.textContent||'').trim().slice(0,40)};
  }, W);
  const ok = !r.zero.length && !r.espremido.length && !r.fora.length && !r.transbordoPagina;
  console.log(`  passo ${passo} [${ok?'ok':'FALHA'}] ${r.titulo}`);
  if(!ok) console.log('     zero:',r.zero,'| espremido:',r.espremido,'| fora:',r.fora,'| pagina:',r.transbordoPagina);
  await p.screenshot({path:`fluxo-${nome}-${passo}.png`});
  return ok;
};

const d={nome:'Teste Arena',telefone:'47999990000',email:'t@exemplo.com',marca:'Honda',modelo:'Civic',ano:'2020'};
let bom=true;
console.log('===', nome, W+'x'+H, process.argv[3]||'v2');
for (let i=1;i<=6;i++){
  bom = (await auditar(i)) && bom;
  await p.evaluate(x=>{
    document.querySelectorAll('#bkBox input:not([type=hidden]):not([type=checkbox]),#bkBox textarea').forEach(inp=>{
      const k=inp.name||inp.id; const v=x[k]??(inp.type==='email'?x.email:inp.type==='tel'?x.telefone:'');
      if(v&&!inp.value){inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));}});
    document.querySelectorAll('#bkBox input[type=checkbox]').forEach(c=>{if(!c.checked){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));}});
    if(!document.querySelector('#bkBox [data-sel="true"]')) document.querySelector('#bkBox .bk__opt,#bkBox .days button:not([disabled])')?.click();
  },d);
  await p.waitForTimeout(400);
  await p.evaluate(()=>{const s=document.querySelector('#bkBox .slot:not([disabled])'); s&&!document.querySelector('.slot[data-sel="true"]')&&s.click();});
  await p.waitForTimeout(350);
  const seguiu = await p.evaluate(()=>{const b=[...document.querySelectorAll('#bkBox button')].find(b=>/continuar|confirmar/i.test(b.textContent)&&!b.disabled); if(!b)return false; b.click(); return true;});
  await p.waitForTimeout(900);
  if(!seguiu) break;
}
console.log('  errs:', errs.slice(0,3), '| veredito:', bom && !errs.length ? 'OK' : 'FALHOU');
await b.close();
if (!bom || errs.length) process.exit(1);
