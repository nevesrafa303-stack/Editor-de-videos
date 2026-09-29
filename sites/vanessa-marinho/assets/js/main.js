/* =========================================================
   Dra. Vanessa Marinho — interações (v3)
   ========================================================= */
(() => {
  'use strict';

  // ===== CONFIGURAÇÃO =====
  // WhatsApp: só dígitos, com 55 + DDD + número (ex.: '5547999999999').
  // Enquanto estiver vazio, os botões abrem o Direct do Instagram.
  const CONFIG = {
    whatsapp: '',
    instagram: 'dravanessamarinho_'
  };

  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = html.classList.contains('reduced');
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduced;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!motion) html.classList.add('no-motion');

  /* ---------- links de contato ---------- */
  const wa = /^\d{12,13}$/.test(CONFIG.whatsapp) ? 'https://wa.me/' + CONFIG.whatsapp : null;
  $$('.js-wa').forEach((a) => {
    a.href = wa ? wa + '?text=' + encodeURIComponent(a.dataset.msg || '') : 'https://ig.me/m/' + CONFIG.instagram;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  const ano = $('#ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  /* ---------- scroll suave ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- menu ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) {
      nav.classList.remove('is-hidden');
      $('a', menu).focus();
      if (motion) gsap.from($$('li, .btn, .menu-foot', menu), { y: 40, opacity: 0, stagger: 0.05, duration: 0.9, ease: 'expo.out' });
    }
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });

  /* ---------- âncoras ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.5 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', id === '#topo' ? location.pathname : id);
  });

  /* ---------- antes / depois ---------- */
  const CASES = [
    { t: 'Rinomodelação', a: 'rino2-antes-1280', d: 'rino2-depois-1280', r: 'ratio-a', pos: '50% 50%' },
    { t: 'Rinomodelação', a: 'rino1-antes-720', d: 'rino1-depois-720', r: 'ratio-b', pos: '50% 55%' },
    { t: 'Preenchimento labial · 1 ml', a: 'labios-antes-1280', d: 'labios-depois-1280', r: 'ratio-c', pos: '50% 50%' }
  ];
  const ba = $('#ba');
  const range = $('.ba-range', ba);
  const setP = (v) => ba.style.setProperty('--p', v + '%');
  range.addEventListener('input', () => setP(range.value));
  const tabs = $$('.tabs [role=tab]');
  const selectCase = (i, focus) => {
    const c = CASES[i];
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    if (focus) tabs[i].focus();
    ba.setAttribute('aria-labelledby', tabs[i].id);
    ba.classList.remove('ratio-a', 'ratio-b', 'ratio-c');
    ba.classList.add(c.r);
    const after = $('.ba-after', ba);
    const before = $('.ba-before img', ba);
    after.src = 'assets/img/' + c.d + '.webp';
    before.src = 'assets/img/' + c.a + '.webp';
    [after, before].forEach((img) => { img.style.objectPosition = c.pos; });
    $('#caseTitle').textContent = c.t;
    range.value = 50;
    if (motion) gsap.fromTo(ba, { '--p': '88%' }, { '--p': '50%', duration: 1.3, ease: 'expo.out' });
    else setP(50);
    if (hasGsap) ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectCase(i));
    t.addEventListener('keydown', (e) => {
      const k = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!k) return;
      e.preventDefault();
      selectCase((i + k + tabs.length) % tabs.length, true);
    });
  });
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    CASES.forEach((c) => { new Image().src = 'assets/img/' + c.a + '.webp'; new Image().src = 'assets/img/' + c.d + '.webp'; });
    obs.disconnect();
  }, { rootMargin: '600px' }).observe(ba);

  /* ---------- jornada ---------- */
  const frameImgs = $$('.journey-frame img');
  const count = $('.journey-count b');
  const steps = $$('.step');
  let current = -1;
  const setStep = (i) => {
    if (i === current) return;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    frameImgs.forEach((img, k) => {
      img.classList.toggle('was-active', k === current && k !== i);
      img.classList.toggle('is-active', k === i);
    });
    if (count) count.textContent = String(i + 1).padStart(2, '0');
    current = i;
  };

  /* ---------- análise facial ---------- */
  const anSteps = $$('.an-step');
  const anCount = $('.an-count');
  let anCurrent = 0;
  const setAn = (i) => {
    if (i === anCurrent) return;
    anCurrent = i;
    anSteps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (anCount) anCount.textContent = String(i + 1).padStart(2, '0');
  };

  /* ---------- sem animação: só o essencial ---------- */
  const waFloat = $('.wa-float');
  if (!motion) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', scrollY > 40);
      waFloat.classList.toggle('is-on', scrollY > innerHeight * 0.6);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setStep(Number(e.target.dataset.step)); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
    setStep(0);
    anSteps.forEach((s) => s.classList.add('is-active'));
    return;
  }

  /* =========================================================
     Coreografia (GSAP + ScrollTrigger)
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  setStep(0);

  // prepara traços SVG para "desenhar"
  const prepDraw = (els) => els.forEach((el) => {
    const len = el.getTotalLength ? Math.ceil(el.getTotalLength()) + 2 : 0;
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    el.dataset.len = len;
  });

  /* ----- intro + entrada ----- */
  const intro = html.classList.contains('intro');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (intro) {
    if (lenis) lenis.stop();
    const ld = $$('.loader-svg circle, .loader-svg line');
    prepDraw(ld);
    tl.to(ld, { strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: 'power2.inOut' })
      .from('.loader-mark > *', { yPercent: 110, duration: 1.1, stagger: 0.1 }, 0.2)
      .from('.loader-cro', { opacity: 0, y: 10, duration: 0.8 }, 0.5)
      .to('.loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '+=0.15')
      .add(() => { html.classList.remove('intro'); if (lenis) lenis.start(); });
  }
  const hl = $$('.hero-lines .hl');
  prepDraw(hl);
  tl.to(hl, { strokeDashoffset: 0, duration: 2.4, stagger: 0.1, ease: 'power2.inOut' }, intro ? '-=0.8' : 0)
    .from('.hero-title .ln > span', { yPercent: 110, duration: 1.4, stagger: 0.1 }, '<0.1')
    .from('.hero-figure', { y: 140, opacity: 0, duration: 1.8 }, '<0.1')
    .from('.eyebrow, .hero-sub, .hero-ctas, .hero-foot', { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, '<0.4')
    .from('.nav-in > *', { y: -20, opacity: 0, duration: 1, stagger: 0.05 }, '<');

  /* ----- nav, progresso, botão flutuante ----- */
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      if (!menuOpen) nav.classList.toggle('is-hidden', self.direction === 1 && y > innerHeight * 0.8);
    }
  });
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 70%', onEnter: () => waFloat.classList.add('is-on'), onLeaveBack: () => waFloat.classList.remove('is-on') });
  $$('.nav-links a').forEach((a) => {
    const sec = document.getElementById(a.getAttribute('href').slice(1));
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
  });

  /* ----- hero ao rolar ----- */
  mm.add('(min-width: 901px)', () => {
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero-copy', { yPercent: -30, opacity: 0, ease: 'none' }, 0)
      .to('.hero-figure', { yPercent: 8, scale: 0.94, ease: 'none' }, 0)
      .to('.hero-lines', { rotation: 12, scale: 1.15, transformOrigin: '70% 56%', ease: 'none' }, 0);
  });

  /* ----- credenciais ----- */
  gsap.from('.creds-grid li', { y: 30, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.creds-band', start: 'top 90%' } });

  /* ----- manifesto ----- */
  const manifesto = $('[data-words]');
  const splitWords = (el) => {
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = part;
          frag.appendChild(s);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) splitWords(node);
    });
  };
  splitWords(manifesto);
  gsap.fromTo($$('.w', manifesto), { opacity: 0.1 }, {
    opacity: 1, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: manifesto, start: 'top 80%', end: 'bottom 40%', scrub: true }
  });
  gsap.timeline({ scrollTrigger: { trigger: '.qa', start: 'top 75%', end: 'center 40%', scrub: 0.6 } })
    .to('.qa-list li:not(.qa-stamp)', { '--s': 1, stagger: 0.25, ease: 'power2.inOut' })
    .to('.qa-list li:not(.qa-stamp)', { opacity: 0.35, stagger: 0.25 }, '<0.2')
    .fromTo('.qa-stamp', { scale: 1.8, opacity: 0, rotation: -20 }, { scale: 1, opacity: 1, rotation: -8, ease: 'back.out(2)' })
    .from('.qa-answer > *', { y: 40, opacity: 0, stagger: 0.15 }, '<');

  /* ----- análise facial ----- */
  const groups = $$('.an-g');
  groups.forEach((g) => {
    prepDraw($$('.an-l:not(.an-axis)', g));
    gsap.set($$('.an-axis, .an-p, .an-t', g), { opacity: 0 });
  });
  const drawGroup = (tlA, g, at) => {
    tlA.to($$('.an-l:not(.an-axis)', g), { strokeDashoffset: 0, duration: 1, stagger: 0.15, ease: 'power2.inOut' }, at)
      .to($$('.an-p', g), { opacity: 1, duration: 0.4, stagger: 0.08 }, '<0.3')
      .to($$('.an-t', g), { opacity: 1, duration: 0.5, stagger: 0.08 }, '<0.2');
    const axis = $$('.an-axis', g);
    if (axis.length) tlA.to(axis, { opacity: 0.6, duration: 0.6 }, '<');
  };
  mm.add('(min-width: 901px)', () => {
    const tlA = gsap.timeline({
      scrollTrigger: {
        trigger: '.analysis', start: 'top top', end: '+=260%', pin: true, scrub: 1, anticipatePin: 1,
        onUpdate: (s) => setAn(s.progress < 0.36 ? 0 : s.progress < 0.7 ? 1 : 2)
      }
    });
    tlA.from('.analysis-fig img', { scale: 1.12, duration: 1 }, 0);
    drawGroup(tlA, groups[0], 0.1);
    tlA.to(groups[0], { opacity: 0.28, duration: 0.5 }, '+=0.4');
    drawGroup(tlA, groups[1], '<');
    tlA.to(groups[1], { opacity: 0.28, duration: 0.5 }, '+=0.4');
    drawGroup(tlA, groups[2], '<');
    tlA.to(groups, { opacity: 1, duration: 0.5 }, '+=0.3');
  });
  mm.add('(max-width: 900px)', () => {
    anSteps.forEach((s) => s.classList.add('is-active'));
    const tlA = gsap.timeline({ scrollTrigger: { trigger: '.analysis-fig', start: 'top 70%' } });
    groups.forEach((g, i) => drawGroup(tlA, g, i * 0.9));
  });

  /* ----- tese: harmonização estrutural ----- */
  gsap.from('.thesis-title .ln > span', { yPercent: 110, duration: 1.4, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.thesis-title', start: 'top 80%' } });
  gsap.fromTo($$('.strata li').reverse(), { clipPath: 'inset(0% 100% 0% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, stagger: 0.14, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.strata', start: 'top 85%' }
  });

  /* ----- camadas: cartões que empilham e recuam ----- */
  const layers = $$('.layer');
  layers.forEach((layer, i) => {
    const next = layers[i + 1];
    if (!next) return;
    gsap.to(layer, {
      scale: 0.93 + i * 0.01, filter: 'brightness(.7)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top 55%', end: 'top 12%', scrub: true }
    });
  });
  layers.forEach((layer) => {
    gsap.fromTo($('.layer-img img', layer), { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: layer, start: 'top bottom', end: 'top 20%', scrub: true } });
    gsap.from($$('h3, .layer-sub, .chips li', layer), { y: 40, opacity: 0, duration: 1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: layer, start: 'top 70%' } });
  });

  /* ----- compromissos ----- */
  $$('.pledge-list li').forEach((li) => {
    gsap.timeline({ scrollTrigger: { trigger: li, start: 'top 82%' } })
      .from(li.children, { y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out' })
      .to(li, { '--pl': 1, duration: 1.4, ease: 'expo.inOut' }, 0);
  });

  /* ----- assinatura se escrevendo ----- */
  gsap.fromTo('.signature', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.signature', start: 'top 85%' } });

  /* ----- rótulos "decodificando" ----- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  $$('.label').forEach((label) => {
    const node = Array.from(label.childNodes).reverse().find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const final = node.textContent;
    ScrollTrigger.create({
      trigger: label, start: 'top 90%', once: true,
      onEnter: () => {
        const state = { p: 0 };
        gsap.to(state, {
          p: 1, duration: 1.1, ease: 'power2.out',
          onUpdate: () => {
            const n = Math.floor(final.length * state.p);
            node.textContent = final.slice(0, n) + final.slice(n).replace(/\S/g, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
          },
          onComplete: () => { node.textContent = final; }
        });
      }
    });
  });

  /* ----- etiqueta do cursor ----- */
  if (finePointer) {
    const tag = $('.cursor-tag');
    gsap.set(tag, { xPercent: -50, yPercent: -50, scale: 0.5 });
    const tx = gsap.quickTo(tag, 'x', { duration: 0.35, ease: 'power3' });
    const ty = gsap.quickTo(tag, 'y', { duration: 0.35, ease: 'power3' });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => { tag.textContent = el.dataset.cursor; gsap.to(tag, { opacity: 1, scale: 1, duration: 0.4, ease: 'expo.out' }); });
      el.addEventListener('pointerleave', () => gsap.to(tag, { opacity: 0, scale: 0.5, duration: 0.3 }));
      el.addEventListener('pointermove', (e) => { tx(e.clientX); ty(e.clientY - 56); });
    });
  }

  /* ----- resultados ----- */
  ScrollTrigger.create({ trigger: ba, start: 'top 70%', once: true, onEnter: () => gsap.fromTo(ba, { '--p': '95%' }, { '--p': '50%', duration: 1.9, ease: 'expo.inOut' }) });
  gsap.from(ba, { clipPath: 'inset(14% 14% 14% 14% round 2px)', ease: 'none', scrollTrigger: { trigger: ba, start: 'top 95%', end: 'top 40%', scrub: true } });

  /* ----- jornada ----- */
  steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => st.isActive && setStep(i) }));
  gsap.to('.journey-steps', { '--jp': 1, ease: 'none', scrollTrigger: { trigger: '.journey-steps', start: 'top 55%', end: 'bottom 55%', scrub: true } });

  /* ----- sobre ----- */
  gsap.fromTo('.arch img', { scale: 1.55 }, { scale: 1.34, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.fromTo('.arch', { clipPath: 'inset(30% 0% 0% 0% round 999px 999px 2px 2px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 2px 2px)', ease: 'none', scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'top 25%', scrub: true } });
  gsap.fromTo('.about-surgery', { yPercent: 25 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ----- revelações gerais ----- */
  const reveals = $$('.results-head h2, .results-head .muted-l, .journey-title, .about-copy h2, .faq-head h2, .faq-head .muted, .letter > p, .timeline li, .faq-list details, .tabs, .analysis-copy h2, .analysis-copy .muted-l, .thesis-side > p, .layers-head h2, .layers-head .muted, .layers-foot, .pledge-head h2, .pledge-head .muted-l, .notes-head h2, .notes-head .link-arrow, .note')
    .filter((el) => !el.closest('.hero') && !el.closest('.cta') && !el.closest('.analysis'));
  gsap.set(reveals, { y: 36, opacity: 0 });
  ScrollTrigger.batch(reveals, { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: 'expo.out' }) });

  /* ----- CTA ----- */
  gsap.timeline({ scrollTrigger: { trigger: '.cta', start: 'top 60%' }, defaults: { ease: 'expo.out' } })
    .from('.cta .label', { y: 20, opacity: 0, duration: 1 })
    .from('.cta-title .ln > span', { yPercent: 110, duration: 1.4, stagger: 0.12 }, '<0.1')
    .from('.magnet, .cta-info', { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, '<0.5');
  gsap.fromTo('.cta-lines', { rotation: -20, scale: 0.9 }, { rotation: 20, scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.footer-word', { xPercent: 4 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ----- botão magnético ----- */
  if (finePointer) {
    const wrap = $('.magnet');
    const btn = $('.btn', wrap);
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.45, duration: 0.6, ease: 'power3.out' });
    });
    wrap.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' }));
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
