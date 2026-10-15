'use strict';
/* ======================================================================
   BOOT — v2

   A v2 é uma página só: não há roteador, não há rotas de serviço. As
   linhas de serviço já vêm no HTML, escritas na montagem, então elas
   existem sem JavaScript. O que roda aqui é o que CSS não faz sozinho.
   ====================================================================== */

/* --- links de WhatsApp: o href real é montado aqui, com o número do
       CONFIG, para não haver link morto no HTML --- */
ligarWhats(document);

/* --- a promessa do agendamento muda com a infraestrutura --- */
{
  const p1 = $('#agP1');
  if (p1 && typeof TEXTO_AG === 'object') p1.textContent = TEXTO_AG.ponto1;
}

/* --- rodapé: endereço, horário, contatos e selo do Google --- */
{
  const end = $('#peEnd');
  if (end) end.textContent = enderecoCompleto || `${CONFIG.cidade}, ${CONFIG.uf}`;

  const mapa = $('#peMapa');
  if (mapa){
    const alvo = enderecoCompleto || `${CONFIG.cidade}, ${CONFIG.uf}`;
    mapa.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alvo)}`;
  }

  /* Os três blocos abaixo vêm prontos no HTML (ver `fallback.mjs`), para
     existirem sem JavaScript. Limpar antes de montar evita duplicar. */
  const horas = $('#peHoras');
  if (horas && agendaConfigurada){
    horas.replaceChildren();
    const nomes = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const porDia = {};
    CONFIG.horarios.forEach(h => { (porDia[h.dia] = porDia[h.dia] || []).push(`${h.de} às ${h.ate}`); });
    const linhas = []; let cur = null;
    [1,2,3,4,5,6,0].forEach(d => {
      const v = porDia[d] ? porDia[d].join(', ') : null;
      if (!v){ if (cur){ linhas.push(cur); cur = null; } return; }
      if (cur && cur.v === v){ cur.fim = d; cur.n++; }
      else { if (cur) linhas.push(cur); cur = { ini:d, fim:d, v, n:1 }; }
    });
    if (cur) linhas.push(cur);
    linhas.forEach(l => horas.append(el('li', {},
      el('span', { text: l.n === 1 ? nomes[l.ini]
        : l.n === 2 ? `${nomes[l.ini]} e ${nomes[l.fim]}`
        : `${nomes[l.ini]} a ${nomes[l.fim]}` }),
      el('br'), el('span', { style:'color:var(--fraco)', text:l.v }))));
  }

  const contato = $('#peContato');
  if (contato){
    contato.replaceChildren();
    const itens = [];
    if (CONFIG.whatsapp) itens.push(el('li', {}, el('a', { 'data-wa':'', 'data-src':'rodape', text:'WhatsApp' })));
    if (CONFIG.email) itens.push(el('li', {}, el('a', { href:`mailto:${CONFIG.email}`, text:CONFIG.email })));
    itens.push(el('li', {}, el('a', { href:'#agendamento', text:'Agendar online' })));
    itens.forEach(i => contato.append(i));
    ligarWhats(contato);
  }

  const selo = $('#peSelo');
  if (selo && typeof seloGoogle === 'function'){
    selo.replaceChildren();
    const s = seloGoogle('rodape');
    if (s){ s.classList.add('selo'); selo.append(s); }
  }

  const ano = $('#ano');
  if (ano) ano.textContent = String(new Date().getFullYear());
}

/* --- avaliações do Google ---
       A mesma URL do Apps Script serve a agenda e as avaliações; muda só a
       rota. Assim o cliente configura um endereço, não dois. Sem URL, a
       seção assume o estado honesto com link para o perfil: nada é
       inventado para preencher espaço. */
{
  if (!CONFIG.avaliacoesEndpoint && AGENDA_URL)
    CONFIG.avaliacoesEndpoint = AGENDA_URL + (AGENDA_URL.includes('?') ? '&' : '?') + 'rota=avaliacoes';
  renderAvaliacoes();
}

/* --- o formulário de agendamento, reaproveitado inteiro da v1 --- */
renderBooking();

/* --- nav ganha fundo depois que sai do topo; barra do celular aparece
       quando o hero passa. Um observador para cada coisa, nada de rAF. --- */
{
  const nav = $('#nav'), barra = $('#barra'), hero = $('#topo');
  if (nav && hero){
    const obs = new IntersectionObserver(([e]) => {
      nav.dataset.fix = String(!e.isIntersecting);
      if (barra) barra.dataset.vis = String(!e.isIntersecting);
    }, { rootMargin: '-72px 0px 0px 0px' });
    obs.observe(hero);
  }
}

/* --- entrada suave: uma vez por elemento, e nada fica preso invisível
       se o observador não existir --- */
{
  const alvos = $$('[data-sobe]');
  if (!('IntersectionObserver' in window)){
    alvos.forEach(n => { n.dataset.vis = 'true'; });
  } else {
    const obs = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting){ e.target.dataset.vis = 'true'; obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    alvos.forEach((n, i) => { n.style.transitionDelay = `${Math.min(i, 4) * 70}ms`; obs.observe(n); });
  }
}

/* --- o vídeo do hero respeita quem pediu menos movimento --- */
{
  const v = document.querySelector('.hero__bg video');
  const mq = window.matchMedia('(prefers-reduced-motion:reduce)');
  const ajustar = () => { if (!v) return; if (mq.matches){ v.pause(); v.currentTime = 0; } else { v.play().catch(() => {}); } };
  ajustar();
  mq.addEventListener ? mq.addEventListener('change', ajustar) : mq.addListener(ajustar);
}
