/* =========================================================
   Dra. Vanessa Marinho — interações
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

  /* ---------- scroll suave (Lenis) ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- menu mobile ---------- */
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
      $('#nav').classList.remove('is-hidden');
      $('a', menu).focus();
      if (motion) gsap.from($$('li, .btn, .menu-foot', menu), { y: 30, opacity: 0, stagger: 0.05, duration: 0.8, ease: 'expo.out' });
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
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
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
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
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
    if (motion) gsap.fromTo(ba, { '--p': '85%' }, { '--p': '50%', duration: 1.2, ease: 'expo.out' });
    else setP(50);
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
  // pré-carrega os outros casos quando a seção se aproxima
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    CASES.forEach((c) => { new Image().src = 'assets/img/' + c.a + '.webp'; new Image().src = 'assets/img/' + c.d + '.webp'; });
    obs.disconnect();
  }, { rootMargin: '600px' }).observe(ba);

  /* ---------- jornada: troca de imagem ---------- */
  const frameImgs = $$('.journey-frame img');
  const count = $('.journey-count b');
  const steps = $$('.step');
  let current = 0;
  const setStep = (i) => {
    if (i === current && steps[i].classList.contains('is-active')) return;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    frameImgs.forEach((img, k) => {
      img.classList.toggle('was-active', k === current && k !== i);
      img.classList.toggle('is-active', k === i);
    });
    if (count) count.textContent = String(i + 1).padStart(2, '0');
    current = i;
  };

  /* ---------- sem animação: só o essencial ---------- */
  const nav = $('#nav');
  const waFloat = $('.wa-float');
  if (!motion) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', scrollY > 40);
      waFloat.classList.toggle('is-on', scrollY > innerHeight * 0.6);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) setStep(Number(e.target.dataset.step));
    }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
    setStep(0);
    return;
  }

  /* =========================================================
     Coreografia com GSAP + ScrollTrigger
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  setStep(0);

  /* intro + entrada do hero */
  const intro = html.classList.contains('intro');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (intro) {
    if (lenis) lenis.stop();
    tl.from('.loader-mark span', { yPercent: 110, duration: 1, stagger: 0.1 })
      .to('.loader-line span', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '<0.1')
      .to('.loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '+=0.05')
      .add(() => { html.classList.remove('intro'); if (lenis) lenis.start(); });
  }
  tl.from('.hero-word', { yPercent: 60, opacity: 0, duration: 1.6, stagger: 0.12 }, intro ? '-=0.7' : 0.1)
    .from('.hero-orb', { scale: 0.5, opacity: 0, duration: 1.8 }, '<')
    .from('.hero-figure', { y: 120, opacity: 0, duration: 1.6 }, '<0.1')
    .from('.hero-side > *', { y: 26, opacity: 0, duration: 1.1, stagger: 0.08 }, '<0.5')
    .from('.nav-in > *', { y: -20, opacity: 0, duration: 1, stagger: 0.06 }, '<');

  /* nav, progresso, botão flutuante, link ativo */
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

  /* hero em camadas */
  mm.add('(min-width: 901px)', () => {
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero-word-1', { xPercent: -22, ease: 'none' }, 0)
      .to('.hero-word-2', { xPercent: 22, ease: 'none' }, 0)
      .to('.hero-figure', { yPercent: 10, scale: 0.94, ease: 'none' }, 0)
      .to('.hero-orb', { scale: 1.35, ease: 'none' }, 0)
      .to('.hero-side', { y: -60, opacity: 0, ease: 'none' }, 0);
  });
  mm.add('(max-width: 900px)', () => {
    gsap.to('.hero-word-1', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-word-2', { xPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* marquee que reage à velocidade da rolagem */
  const marq = gsap.to('.marquee-track', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
  let dir = 1;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      dir = self.direction;
      const boost = Math.min(Math.abs(self.getVelocity()) / 350, 6);
      gsap.to(marq, { timeScale: dir * (1 + boost), duration: 0.2, overwrite: true, onComplete: () => gsap.to(marq, { timeScale: dir, duration: 1.2 }) });
    }
  });

  /* manifesto: palavras acendem com a rolagem */
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
  gsap.fromTo($$('.w', manifesto), { opacity: 0.12 }, {
    opacity: 1, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: manifesto, start: 'top 80%', end: 'bottom 40%', scrub: true }
  });

  /* perguntas riscadas → resposta */
  gsap.timeline({ scrollTrigger: { trigger: '.qa', start: 'top 75%', end: 'center 45%', scrub: 0.6 } })
    .to('.qa-list li', { '--s': 1, stagger: 0.25, ease: 'power2.inOut' })
    .to('.qa-list li', { opacity: 0.35, stagger: 0.25 }, '<0.2')
    .from('.qa-answer > *', { y: 40, opacity: 0, stagger: 0.15 }, '<0.3');

  /* procedimentos: rolagem horizontal fixada */
  mm.add('(min-width: 901px)', () => {
    const track = $('.procs-track');
    const dist = () => track.scrollWidth - innerWidth;
    const horiz = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.procs', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true }
    });
    $$('.card').forEach((card) => {
      gsap.fromTo($('.card-img img', card), { yPercent: -10 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true }
      });
      gsap.from(card, {
        opacity: 0.25, y: 60, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: horiz, start: 'left 100%', end: 'left 65%', scrub: true }
      });
    });
  });

  /* antes/depois: revela sozinho na primeira vez */
  ScrollTrigger.create({
    trigger: ba, start: 'top 70%', once: true,
    onEnter: () => gsap.fromTo(ba, { '--p': '94%' }, { '--p': '50%', duration: 1.8, ease: 'expo.inOut' })
  });
  gsap.from(ba, { clipPath: 'inset(12% 12% 12% 12%)', ease: 'none', scrollTrigger: { trigger: ba, start: 'top 95%', end: 'top 45%', scrub: true } });

  /* jornada: passos trocam a imagem fixa */
  steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => st.isActive && setStep(i) }));

  /* sobre */
  gsap.fromTo('.reveal-clip', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.about-surgery', start: 'top 85%' } });
  gsap.to('.about-surgery', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.portrait', { scale: 0.85, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.portrait', start: 'top 80%' } });

  /* revelações gerais */
  const reveals = $$('.chapter, .results-copy h2, .journey-title, .about-copy h2, .faq h2, .lead, .tabs, .disclaimer, .about-copy > p:not(.chapter), .creds > div, .faq-list details')
    .filter((el) => !el.closest('.procs') && !el.closest('.cta'));
  gsap.set(reveals, { y: 36, opacity: 0 });
  ScrollTrigger.batch(reveals, { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'expo.out' }) });

  /* CTA */
  gsap.timeline({ scrollTrigger: { trigger: '.cta', start: 'top 65%' }, defaults: { ease: 'expo.out' } })
    .from('.cta-avatar', { scale: 0.6, opacity: 0, duration: 1.2 })
    .from('.cta .chapter', { y: 20, opacity: 0, duration: 1 }, '<0.1')
    .from('.cta-title > *', { yPercent: 60, opacity: 0, duration: 1.4, stagger: 0.12 }, '<0.1')
    .from('.magnet, .cta-note', { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, '<0.4');
  gsap.fromTo('.footer-word', { xPercent: 4 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* botão magnético (só com mouse) */
  mm.add('(hover: hover) and (pointer: fine)', () => {
    const wrap = $('.magnet');
    const btn = $('.btn', wrap);
    const move = (e) => {
      const r = wrap.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.45, duration: 0.6, ease: 'power3.out' });
    };
    const leave = () => gsap.to(btn, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' });
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerleave', leave);
    return () => { wrap.removeEventListener('pointermove', move); wrap.removeEventListener('pointerleave', leave); };
  });

  /* recalcula depois das fontes e imagens */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
