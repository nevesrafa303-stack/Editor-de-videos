/* =========================================================
   Luiz Quadros — interações
   ========================================================= */
(() => {
  'use strict';

  // ===== CONFIGURAÇÃO =====
  // WhatsApp: só dígitos, com 55 + DDD + número (ex.: '5547999999999').
  // Enquanto estiver vazio, os botões abrem o Direct do Instagram.
  // Meta Pixel: preencha o ID para ativar. Só carrega após o consentimento do visitante
  // (LGPD). Ao ativar, libere os domínios da Meta na CSP — veja o README.
  const CONFIG = {
    whatsapp: '',
    instagram: 'luizquadrosde',
    metaPixelId: ''
  };

  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = html.classList.contains('reduced');
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGsap && !reduced;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!motion) html.classList.add('no-motion');
  if (!motion) html.classList.remove('intro');

  /* ---------- links de contato ---------- */
  const wa = /^\d{12,13}$/.test(CONFIG.whatsapp) ? 'https://wa.me/' + CONFIG.whatsapp : null;
  const setWa = (a) => {
    a.href = wa ? wa + '?text=' + encodeURIComponent(a.dataset.msg || '') : 'https://ig.me/m/' + CONFIG.instagram;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  };
  $$('.js-wa').forEach(setWa);
  // sem WhatsApp configurado, a mensagem vai para a área de transferência (para colar no Direct)
  const toast = $('#pToast');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.js-wa');
    if (!a) return;
    if (window.fbq) window.fbq('track', 'Contact');
    if (wa || !a.dataset.msg || !navigator.clipboard) return;
    navigator.clipboard.writeText(a.dataset.msg).then(() => {
      if (toast && a.closest('.planner')) toast.textContent = 'Mensagem copiada — é só colar no Direct do Instagram.';
    }).catch(() => {});
  });

  /* ---------- medição com consentimento (LGPD) ---------- */
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } }
  };
  const loadPixel = () => {
    if (window.fbq || !/^\d{10,20}$/.test(CONFIG.metaPixelId)) return;
    const n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    const t = document.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(t);
    window.fbq('init', CONFIG.metaPixelId);
    window.fbq('track', 'PageView');
  };
  const showConsent = () => {
    if ($('.consent')) return;
    const box = document.createElement('div');
    box.className = 'consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Preferências de privacidade');
    box.innerHTML = '<p class="mono consent-tag">Privacidade</p>' +
      '<p>Usamos cookies de medição da Meta para entender as visitas e melhorar a divulgação. Nada é ativado sem a sua permissão.</p>' +
      '<div class="consent-btns"><button type="button" class="btn btn-sm consent-no">Recusar</button><button type="button" class="btn btn-sm consent-yes">Aceitar</button></div>' +
      '<a class="mono consent-more" href="privacidade.html">Política de privacidade</a>';
    document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add('is-on'));
    const close = (v) => { store.set('lq-consent', v); box.classList.remove('is-on'); setTimeout(() => box.remove(), 500); if (v === 'yes') loadPixel(); };
    $('.consent-yes', box).addEventListener('click', () => close('yes'));
    $('.consent-no', box).addEventListener('click', () => close('no'));
  };
  if (/^\d{10,20}$/.test(CONFIG.metaPixelId)) {
    const c = store.get('lq-consent');
    if (c === 'yes') loadPixel();
    else if (c !== 'no') setTimeout(showConsent, 2500);
    const prefs = $('.js-consent');
    if (prefs) { prefs.hidden = false; prefs.addEventListener('click', (e) => { e.preventDefault(); showConsent(); }); }
  }

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

  /* ---------- sliders: preenchimento ---------- */
  const fillRange = (r) => r.style.setProperty('--v', ((r.value - r.min) / (r.max - r.min) * 100).toFixed(2) + '%');

  /* ---------- simulador de fluxo ---------- */
  const sim = $('#sim');
  if (sim) {
    const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    const round = (v) => Math.round(v / 100) * 100;
    const inp = { valor: $('#sValor'), entrada: $('#sEntrada'), obra: $('#sObra'), prazo: $('#sPrazo'), val: $('#sVal') };
    const out = (id, t) => { $(id).textContent = t; };
    const bars = { e: $('.sb-e', sim), o: $('.sb-o', sim), c: $('.sb-c', sim) };
    const simBtn = $('.js-sim', sim);
    const pct = (v) => String(v).replace('.', ',') + '%';
    const calc = () => {
      const valor = Number(inp.valor.value);
      const e = Number(inp.entrada.value);
      inp.obra.max = String(100 - e);
      const o = Math.min(Number(inp.obra.value), 100 - e);
      inp.obra.value = String(o);
      const n = Number(inp.prazo.value);
      const t = Number(inp.val.value) / 100;
      const c = 100 - e - o;
      const vE = valor * e / 100;
      const vO = valor * o / 100;
      const vC = valor - vE - vO;
      const futuro = valor * Math.pow(1 + t, n / 12);
      const pago = vE + vO;
      out('#oValor', brl.format(valor));
      out('#oEntrada', e + '% · ' + brl.format(vE));
      out('#oObra', o + '%');
      out('#oPrazo', n + ' meses');
      out('#oVal', pct(Number(inp.val.value)));
      out('#rEntrada', brl.format(vE));
      out('#rMensal', o ? n + '× ' + brl.format(round(vO / n)) : '—');
      out('#rChaves', brl.format(vC) + ' · ' + c + '%');
      out('#rFuturo', brl.format(round(futuro)));
      out('#rGanho', t ? '+ ' + brl.format(round(futuro - valor)) + ' de valorização hipotética, com ' + brl.format(pago) + ' desembolsados até as chaves' : 'Sem valorização no cenário escolhido.');
      bars.e.style.flexBasis = e + '%';
      bars.o.style.flexBasis = o + '%';
      bars.c.style.flexBasis = c + '%';
      Object.values(inp).forEach(fillRange);
      simBtn.dataset.msg = 'Olá, Luiz! Fiz uma simulação no seu site: imóvel de ' + brl.format(valor) + ', entrada de ' + e + '%, ' + o + '% durante ' + n + ' meses de obra e ' + c + '% nas chaves. Quero ver empreendimentos com esse fluxo.';
      setWa(simBtn);
    };
    sim.addEventListener('input', calc);
    sim.addEventListener('submit', (e) => e.preventDefault());
    calc();
  }

  /* ---------- planejador de mensagem ---------- */
  const planner = $('.planner');
  if (planner) {
    const msgOut = $('#pMsg');
    const btn = $('.js-planner');
    const nameIn = $('#pName');
    const val = (n) => ($('input[name=' + n + ']:checked', planner) || {}).value || '';
    const compose = () => {
      const nome = nameIn.value.replace(/[<>]/g, '').trim();
      const msg = 'Olá, Luiz!' + (nome ? ' Aqui é ' + nome + '.' : '') + ' Vim pelo seu site. Quero ' + val('obj') + ' ' + val('cid') +
        ', com investimento ' + val('fx') + '. Pode me apresentar as melhores opções na planta?';
      msgOut.textContent = msg;
      btn.dataset.msg = msg;
      setWa(btn);
      if (toast) toast.textContent = '';
    };
    planner.addEventListener('change', compose);
    planner.addEventListener('submit', (e) => e.preventDefault());
    nameIn.addEventListener('input', compose);
    compose();
  }

  /* ---------- mapa x cidades ---------- */
  $$('.city').forEach((city) => {
    const pin = $('.map-pin[data-city="' + city.dataset.city + '"]');
    const on = (v) => () => { city.classList.toggle('is-on', v); if (pin) pin.classList.toggle('is-on', v); };
    city.addEventListener('pointerenter', on(true));
    city.addEventListener('pointerleave', on(false));
  });

  /* ---------- botão voltar ao topo com progresso ---------- */
  const toTop = $('.to-top');
  if (toTop) {
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      toTop.style.setProperty('--tp', max > 0 ? (scrollY / max).toFixed(3) : 0);
    };
    addEventListener('scroll', upd, { passive: true });
    upd();
  }


  /* ---------- método: etapa ativa ---------- */
  const msteps = $$('.mstep');
  const mCount = $('.method-count b');
  let current = -1;
  const setStep = (i) => {
    if (i === current) return;
    current = i;
    msteps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (mCount) mCount.textContent = String(i + 1).padStart(2, '0');
  };
  const pathLen = (el) => { try { return Math.ceil(el.getTotalLength()) + 2; } catch (e) { return 0; } };

  /* ---------- sem animação: só o essencial ---------- */
  const waFloat = $('.float-cta');
  if (!motion) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', scrollY > 40);
      waFloat.classList.toggle('is-on', scrollY > innerHeight * 0.6);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    msteps.forEach((s) => s.classList.add('is-active'));
    return;
  }

  /* =========================================================
     Coreografia (GSAP + ScrollTrigger)
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  const DESK = '(min-width: 901px)';
  const MOB = '(max-width: 900px)';
  setStep(0);

  const prepDraw = (els) => els.forEach((el) => {
    const len = pathLen(el);
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
  });

  /* ----- intro + entrada ----- */
  const intro = html.classList.contains('intro');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (intro) {
    if (lenis) lenis.stop();
    const num = $('.loader-num');
    tl.from('.loader-mark > *', { yPercent: 110, duration: 1.1, stagger: 0.1 }, 0.1)
      .from('.loader-meta', { opacity: 0, y: 10, duration: 0.8 }, 0.3)
      .to('.loader-bar span', { scaleX: 1, duration: 1.6, ease: 'power3.inOut' }, 0.2)
      .to({ v: 0 }, { v: 130, duration: 1.6, ease: 'power3.inOut', onUpdate() { num.textContent = 'R$ ' + String(Math.round(this.targets()[0].v)).padStart(3, '0') + ' mi'; } }, 0.2)
      .to('.loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '+=0.15')
      .add(() => { html.classList.remove('intro'); if (lenis) lenis.start(); });
  }
  tl.from('.hn-1', { xPercent: -30, opacity: 0, duration: 2 }, intro ? '-=0.7' : 0)
    .from('.hn-2', { xPercent: 30, opacity: 0, duration: 2 }, '<')
    .from('.hero-figure', { yPercent: 6, duration: 2 }, '<')
    .from('.hero-glow', { opacity: 0, duration: 2.4, ease: 'power2.out' }, '<')
    .from('.hero-title .ln > span', { yPercent: 110, duration: 1.4, stagger: 0.1 }, '<0.3')
    .from('.eyebrow, .hero-sub, .hero-ctas', { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, '<0.2')
    .from('.hero-card', { y: 40, opacity: 0, duration: 1.3 }, '<')
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

  const tasks = [];
  const later = (fn) => tasks.push(fn);

  /* ----- hero: o nome se abre e a cena recua ----- */
  later(() => {
    mm.add(DESK, () => {
      gsap.timeline({ scrollTrigger: { trigger: '.hero-stage', start: 'top top', end: '+=110%', pin: true, scrub: 1, anticipatePin: 1 } })
        .to('.hn-1', { xPercent: -48, ease: 'none' }, 0)
        .to('.hn-2', { xPercent: 48, ease: 'none' }, 0)
        .to('.hero-name', { opacity: 0.25, scale: 1.08, ease: 'none' }, 0)
        .to('.hero-figure', { scale: 0.86, yPercent: 4, transformOrigin: '50% 100%', ease: 'none' }, 0)
        .to('.hero-copy', { y: -90, opacity: 0, ease: 'none', duration: 0.6 }, 0)
        .to('.hero-card', { y: -90, opacity: 0, ease: 'none', duration: 0.6 }, 0.05)
        .to('.hero-glow', { scale: 1.4, opacity: 0.4, ease: 'none' }, 0);
    });
    mm.add(MOB, () => {
      gsap.to('.hero-name', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
  });

  /* ----- faixa: velocidade acompanha a rolagem ----- */
  later(() => {
    const track = $('.marquee-track');
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    const skew = gsap.quickTo(track, 'skewX', { duration: 0.6, ease: 'power3' });
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        gsap.to(loop, { timeScale: (self.direction || 1) * Math.min(6, 1 + Math.abs(v) / 300), duration: 0.3, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: self.direction || 1, duration: 1.2 }) });
        skew(gsap.utils.clamp(-8, 8, v / -250));
      },
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause())
    });
  });

  /* ----- número gigante: contador preso à rolagem ----- */
  later(() => {
    const bigCount = $('.big .count');
    const meter = $('.big-meter span');
    const setBig = (p) => { bigCount.textContent = String(Math.round(130 * p)); meter.style.transform = 'scaleX(' + p.toFixed(3) + ')'; };
    mm.add(DESK, () => {
      setBig(0);
      const row = $$('.big-row > *');
      gsap.set(row, { y: 40, opacity: 0 });
      const st = { p: 0 };
      gsap.timeline({ scrollTrigger: { trigger: '.big-stage', start: 'top top', end: '+=120%', pin: true, scrub: 0.8, anticipatePin: 1 } })
        .from('.big-cur, .big-unit', { y: 40, opacity: 0, duration: 0.2 }, 0)
        .to(st, { p: 1, duration: 0.7, ease: 'power1.inOut', onUpdate: () => setBig(st.p) }, 0)
        .fromTo('.big-num', { backgroundPosition: '50% 0%' }, { backgroundPosition: '50% 100%', duration: 0.9, ease: 'none' }, 0)
        .to(row, { y: 0, opacity: 1, stagger: 0.08, duration: 0.25 }, 0.62);
      return () => setBig(1);
    });
    mm.add(MOB, () => {
      setBig(0);
      const st = { p: 0 };
      gsap.to(st, { p: 1, duration: 2.2, ease: 'power3.out', onUpdate: () => setBig(st.p), scrollTrigger: { trigger: '.big-figure', start: 'top 85%', once: true } });
    });
    $$('.stats .count').forEach((el) => {
      const to = Number(el.dataset.to);
      const obj = { v: 0 };
      el.textContent = '0';
      gsap.to(obj, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = String(Math.round(obj.v)); }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    gsap.from('.stats li', { y: 50, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.stats', start: 'top 88%' } });
  });

  /* ----- manifesto: palavras acendem ----- */
  later(() => {
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
      opacity: 1, stagger: 0.08, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: manifesto, start: 'top 85%', end: 'bottom 45%', scrub: true }
    });
    gsap.fromTo('.manifesto .signature', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: '.manifesto-foot', start: 'top 90%' } });
  });

  /* ----- tese: cartões empilham e recuam ----- */
  later(() => {
    const cards = $$('.why-card');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      gsap.from($$('.why-n, .why-body > *, .why-tag', card), { y: 40, opacity: 0, duration: 1.1, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 80%' } });
      if (!next) return;
      gsap.to(card, {
        scale: 0.9 + i * 0.02, filter: 'brightness(.55)', ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 20%', scrub: true }
      });
    });
  });

  /* ----- método: rolagem horizontal ----- */
  later(() => {
    const track = $('.method-track');
    const bar = $('.method-bar span');
    mm.add(DESK, () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.method-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (s) => {
            bar.style.transform = 'scaleX(' + s.progress.toFixed(3) + ')';
            setStep(Math.min(msteps.length - 1, Math.floor(s.progress * msteps.length * 0.999 + 0.0001)));
          }
        }
      });
      msteps.forEach((m) => gsap.fromTo($('.mstep-n', m), { yPercent: 30 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.method-pin', start: 'top top', end: () => '+=' + dist(), scrub: true } }));
    });
    mm.add(MOB, () => {
      msteps.forEach((m, i) => {
        gsap.from(m, { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: m, start: 'top 88%' } });
        ScrollTrigger.create({ trigger: m, start: 'top 60%', end: 'bottom 40%', onToggle: (s) => s.isActive && setStep(i) });
      });
    });
  });

  /* ----- região ----- */
  later(() => {
    const coast = $$('.map-coast');
    prepDraw(coast);
    gsap.timeline({ scrollTrigger: { trigger: '.map', start: 'top 75%' } })
      .from('.map-sea', { opacity: 0, duration: 1.2, ease: 'power2.out' })
      .to(coast, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 0)
      .from('.map-pin', { opacity: 0, y: 10, duration: 0.8, stagger: 0.12, ease: 'expo.out' }, 0.8);
    gsap.from('.city, .region-note', { y: 50, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.cities', start: 'top 82%' } });
  });

  /* ----- simulador ----- */
  later(() => {
    gsap.from('.sim-inputs, .sim-result', { y: 60, opacity: 0, duration: 1.3, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.sim-box', start: 'top 82%' } });
  });

  /* ----- reconhecimentos: a foto cresce até ocupar a tela ----- */
  later(() => {
    mm.add(DESK, () => {
      gsap.timeline({ scrollTrigger: { trigger: '.zoom-stage', start: 'top top', end: '+=150%', pin: true, scrub: 1, anticipatePin: 1 } })
        .fromTo('.zoom-fig', { clipPath: 'inset(20% 35% 20% 35% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
        .fromTo('.zoom-fig img', { scale: 1.35 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
        .to('.zoom-l', { xPercent: -70, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0.1)
        .to('.zoom-r', { xPercent: 70, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0.1)
        .from('.zoom-cap > *', { y: 50, opacity: 0, stagger: 0.08, duration: 0.3 }, 0.75)
        .to({}, { duration: 0.25 });
    });
    mm.add(MOB, () => {
      gsap.fromTo('.zoom-fig', { clipPath: 'inset(12% 8% 12% 8% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.zoom', start: 'top 90%', end: 'top 20%', scrub: true } });
    });
    $$('.proof-grid .pf').forEach((pf, i) => {
      gsap.from(pf, { y: 80, opacity: 0, duration: 1.3, delay: i * 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.proof-grid', start: 'top 88%' } });
      const img = $('.pf-img img', pf);
      if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: pf, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* ----- sobre ----- */
  later(() => {
    gsap.fromTo('.about-disc', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'top 20%', scrub: true } });
    gsap.fromTo('.about-fig img', { yPercent: 14 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'center center', scrub: true } });
    gsap.from('.about-badge', { x: -40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.about-fig', start: 'top 60%' } });
    gsap.fromTo('.sig-wrap .signature', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.sig-wrap', start: 'top 88%' } });
  });

  /* ----- compromissos ----- */
  later(() => {
    gsap.from('.pledge-list li', { y: 70, opacity: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.pledge-list', start: 'top 85%' } });
  });

  /* ----- títulos: palavras sobem por máscara ----- */
  later(() => {
    const maskWords = (el) => {
      Array.from(el.childNodes).forEach((node) => {
        if (node.nodeType === 3) {
          const frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = 'wm';
            const inner = document.createElement('span');
            inner.className = 'wi';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceWith(frag);
        } else if (node.nodeType === 1 && !node.classList.contains('wm')) maskWords(node);
      });
    };
    $$('.sec-head h2, .why-head h2, .method-head h2, .about-copy h2, .faq-head h2').forEach((h) => {
      maskWords(h);
      gsap.from($$('.wi', h), { yPercent: 115, duration: 1.2, stagger: 0.045, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    const reveals = $$('.sec-head .muted-l, .why-head .muted-l, .manifesto-foot .kicker, .letter > p, .faq-head .muted, .faq-head .btn, .faq-list details, .label');
    gsap.set(reveals, { y: 30, opacity: 0 });
    ScrollTrigger.batch(reveals, { start: 'top 92%', once: true, onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: 'expo.out' }) });
  });

  /* ----- contato + rodapé ----- */
  later(() => {
    gsap.timeline({ scrollTrigger: { trigger: '.cta', start: 'top 65%' }, defaults: { ease: 'expo.out' } })
      .from('.cta-title .ln > span', { yPercent: 110, duration: 1.4, stagger: 0.12 })
      .from('.cta-info li', { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, '<0.4')
      .from('.planner', { y: 60, opacity: 0, duration: 1.3 }, '<');
    gsap.fromTo('.cta-glow', { opacity: 0.3, scale: 0.8 }, { opacity: 1, scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.footer-word', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });

  /* ----- botão flutuante, links ativos e medidor ----- */
  later(() => {
    ScrollTrigger.create({
      trigger: '.hero', start: 'bottom 70%', endTrigger: '#contato', end: 'top 85%',
      onToggle: (st) => waFloat.classList.toggle('is-on', st.isActive)
    });
    $$('.nav-links a').forEach((a) => {
      const sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
    });
    const gauge = $('.gauge');
    if (gauge && getComputedStyle(gauge).display !== 'none') {
      const gSecs = $$('[data-gauge]');
      const gN = $('.gauge-n');
      const gName = $('.gauge-name');
      gSecs.forEach((sec, i) => ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: (st) => {
          if (!st.isActive) return;
          gN.textContent = String(i + 1).padStart(2, '0');
          gName.textContent = sec.dataset.gauge;
        }
      }));
      ScrollTrigger.create({
        trigger: gSecs[0], start: 'top 60%', endTrigger: '.footer', end: 'top bottom',
        onUpdate: (st) => gauge.style.setProperty('--g', st.progress.toFixed(4)),
        onToggle: (st) => gauge.classList.toggle('is-on', st.isActive)
      });
    }
  });

  /* ----- cursor e botões magnéticos ----- */
  if (finePointer) later(() => {
    const cur = $('.cursor');
    html.classList.add('has-cursor');
    gsap.set(cur, { x: -100, y: -100 });
    const cx = gsap.quickTo(cur, 'x', { duration: 0.18, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.18, ease: 'power3' });
    addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => cur.classList.toggle('is-link', !!e.target.closest('a, button, summary, label, input')));
    document.addEventListener('pointerleave', () => gsap.to(cur, { opacity: 0, duration: 0.2 }));
    document.addEventListener('pointerenter', () => gsap.to(cur, { opacity: 1, duration: 0.2 }));
    $$('.btn:not(.btn-sm):not(.btn-block), .float-cta').forEach((btn) => {
      let r = null;
      btn.addEventListener('pointerenter', () => { r = btn.getBoundingClientRect(); });
      btn.addEventListener('pointermove', (e) => {
        if (!r) return;
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.6, ease: 'power3.out' });
      });
      btn.addEventListener('pointerleave', () => { r = null; gsap.to(btn, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' }); });
    });
  });

  // monta a coreografia em tarefas curtas, para não travar a abertura no celular
  const run = () => {
    const fn = tasks.shift();
    if (fn) { fn(); setTimeout(run, 0); return; }
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => ScrollTrigger.refresh());
  };
  setTimeout(run, intro ? 400 : 60);
})();
