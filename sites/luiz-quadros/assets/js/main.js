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
    html.classList.toggle('menu-open', open);
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

  /* ---------- simulador do investidor (até 120x direto com a construtora) ---------- */
  const sim = $('#sim');
  if (sim) {
    const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    const short = (v) => v >= 1e6 ? 'R$ ' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace('.', ',') + ' mi' : 'R$ ' + Math.round(v / 1e3) + ' mil';
    const round = (v) => Math.round(v / 100) * 100;
    const inp = { valor: $('#sValor'), entrada: $('#sEntrada'), prazo: $('#sPrazo'), val: $('#sVal') };
    const out = (id, t) => { $(id).textContent = t; };
    const simBtn = $('.js-sim', sim);
    const plot = $('.ichart-plot', sim);
    const canvas = $('.ic-canvas', sim);
    const svg = $('.ichart-svg', sim);
    const pA = $('.ic-a', svg), pB = $('.ic-b', svg), pArea = $('.ic-area', svg);
    const gGrid = $('.ic-grid', svg), keys = $('.ic-keys', svg), cross = $('.ic-cross', svg);
    const dotA = $('.ic-dot-a', sim), dotB = $('.ic-dot-b', sim);
    const tip = $('.ic-tip', sim), keysLabel = $('.ic-keys-label', sim);
    const yAxis = $('.ic-y', sim), xAxis = $('.ic-x', sim);
    const W = 640, H = 300;
    let st = null;
    const pct = (v) => String(v).replace('.', ',') + '%';

    const draw = () => {
      const { V, E, P, parc, K, t, M } = st;
      const valAt = (m) => V * Math.pow(1 + t, m / 12);
      const capAt = (m) => E + parc * Math.min(m, P);
      const yMax = Math.max(valAt(M), V) * 1.08;
      const x = (m) => m / M * W;
      const y = (v) => H - v / yMax * H;
      st.x = x; st.y = y; st.valAt = valAt; st.capAt = capAt; st.yMax = yMax;
      let a = '', b = '';
      for (let m = 0; m <= M; m++) {
        a += (m ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(valAt(m)).toFixed(1);
        b += (m ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(capAt(m)).toFixed(1);
      }
      pA.setAttribute('d', a);
      pB.setAttribute('d', b);
      pArea.setAttribute('d', a + 'L' + W + ' ' + H + 'L0 ' + H + 'Z');
      keys.setAttribute('x1', x(K)); keys.setAttribute('x2', x(K));
      keysLabel.style.left = (K / M * 100) + '%';
      // grade e eixos
      gGrid.innerHTML = '';
      yAxis.innerHTML = '';
      for (let i = 0; i <= 4; i++) {
        const v = yMax / 1.08 * i / 4;
        const yy = y(v);
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('x1', 0); ln.setAttribute('x2', W); ln.setAttribute('y1', yy); ln.setAttribute('y2', yy);
        gGrid.appendChild(ln);
        const lb = document.createElement('span');
        lb.textContent = i ? short(v) : 'R$ 0';
        lb.style.top = (yy / H * 100) + '%';
        yAxis.appendChild(lb);
      }
      xAxis.innerHTML = '';
      const step = M > 90 ? 24 : 12;
      for (let m = 0; m <= M; m += step) {
        const lb = document.createElement('span');
        lb.textContent = m ? 'mês ' + m : 'início';
        lb.style.left = (m / M * 100) + '%';
        xAxis.appendChild(lb);
      }
    };

    const hover = (m) => {
      const { x, y, valAt, capAt, M } = st;
      m = Math.max(0, Math.min(M, Math.round(m)));
      const xx = x(m);
      cross.setAttribute('x1', xx); cross.setAttribute('x2', xx);
      const lx = (xx / W * 100) + '%';
      dotA.style.left = lx; dotA.style.top = (y(valAt(m)) / H * 100) + '%';
      dotB.style.left = lx; dotB.style.top = (y(capAt(m)) / H * 100) + '%';
      const label = m === 0 ? 'Assinatura' : m === st.K ? 'Mês ' + m + ' · chaves' : 'Mês ' + m + (m < st.K ? ' · obra' : ' · pós-chaves');
      tip.innerHTML = '<b>' + label + '</b><span>Valor estimado <em>' + brl.format(round(valAt(m))) + '</em></span><span>Desembolsado <em>' + brl.format(round(capAt(m))) + '</em></span>';
      const left = xx / W > 0.6;
      tip.style.left = left ? '' : 'calc(' + lx + ' + 14px)';
      tip.style.right = left ? 'calc(' + (100 - xx / W * 100) + '% + 14px)' : '';
      tip.style.top = '8px';
    };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      plot.classList.add('is-hover');
      hover((e.clientX - r.left) / r.width * st.M);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', () => plot.classList.remove('is-hover'));

    const calc = () => {
      const V = Number(inp.valor.value);
      const e = Number(inp.entrada.value);
      const P = Number(($('input[name=parc]:checked', sim) || {}).value || 120);
      const K = Math.min(Number(inp.prazo.value), P);
      const t = Number(inp.val.value) / 100;
      const E = V * e / 100;
      const parc = (V - E) / P;
      const M = P;
      st = { V, E, P, parc, K, t, M };
      const pago = E + parc * K;
      const futuro = V * Math.pow(1 + t, K / 12);
      const ganho = futuro - V;
      const restante = P - K;
      out('#oValor', brl.format(V));
      out('#oEntrada', e + '% · ' + brl.format(E));
      out('#oPrazo', K + ' meses');
      out('#oVal', pct(Number(inp.val.value)));
      out('#rEntrada', brl.format(round(E)));
      out('#rMensal', P + '× ' + brl.format(round(parc)));
      out('#rPago', brl.format(round(pago)));
      out('#rFuturo', brl.format(round(futuro)));
      const ins = $('#rGanho');
      ins.innerHTML = 'Nas chaves, no mês ' + K + ', você terá desembolsado <strong>' + brl.format(round(pago)) + '</strong> — ' + Math.round(pago / V * 100) + '% do valor do imóvel' +
        (t ? ', e o ativo estimado valerá <strong>' + brl.format(round(futuro)) + '</strong>. A valorização hipotética de ' + brl.format(round(ganho)) + ' equivale a ' + Math.round(ganho / pago * 100) + '% do capital desembolsado.' : '.') +
        (restante > 0 ? ' O saldo segue em ' + restante + ' parcelas direto com a construtora.' : '');
      Object.values(inp).forEach(fillRange);
      draw();
      simBtn.dataset.msg = 'Olá, Luiz! Fiz uma simulação no seu site: imóvel de ' + brl.format(V) + ', entrada de ' + e + '% e ' + P + ' parcelas direto com a construtora, com chaves em ' + K + ' meses. Quero conhecer oportunidades com esse fluxo.';
      setWa(simBtn);
    };
    sim.addEventListener('input', calc);
    sim.addEventListener('change', calc);
    sim.addEventListener('submit', (e) => e.preventDefault());
    calc();
  }

  /* ---------- abas de estratégias ---------- */
  const tabs = $$('.tabs [role=tab]');
  if (tabs.length) {
    const select = (i, focus) => {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tabs[i].focus();
      const panel = document.getElementById(tabs[i].getAttribute('aria-controls'));
      if (window.gsap && !reduced) gsap.from(panel.children, { y: 24, opacity: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out' });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!k) return;
        e.preventDefault();
        select((i + k + tabs.length) % tabs.length, true);
      });
    });
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
        ', com entrada disponível ' + val('fx') + ', pagando direto com a construtora. Pode me apresentar as melhores oportunidades na planta?';
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


  /* ---------- números ---------- */
  const fmt = (v, kind) => {
    if (kind === 'th') return Math.round(v).toLocaleString('pt-BR');
    if (kind === 'pct') return (v / 100).toFixed(2).replace('.', ',');
    return String(Math.round(v));
  };

  /* ---------- sem animação: só o essencial ---------- */
  const waFloat = $('.float-cta');
  const darkSecs = $$('.hero, .dark');
  const navOnDark = () => {
    const y = 36;
    nav.classList.toggle('on-dark', darkSecs.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }));
  };
  if (!motion) {
    const onScroll = () => {
      nav.classList.toggle('is-scrolled', scrollY > 40);
      waFloat.classList.toggle('is-on', scrollY > innerHeight * 0.6);
      navOnDark();
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return;
  }

  /* =========================================================
     Coreografia (GSAP + ScrollTrigger)
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  const DESK = '(min-width: 901px)';
  const MOB = '(max-width: 900px)';
  const pathLen = (el) => { try { return Math.ceil(el.getTotalLength()) + 2; } catch (e) { return 0; } };

  /* ----- intro + entrada ----- */
  const intro = html.classList.contains('intro');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (intro) {
    if (lenis) lenis.stop();
    const lv = $('.loader-v');
    const o = { v: 0 };
    tl.from('.loader-k, .loader-num, .loader-meta', { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, 0.1)
      .to(o, { v: 15403, duration: 1.7, ease: 'power3.inOut', onUpdate: () => { lv.textContent = fmt(o.v, 'th'); } }, 0.25)
      .to('.loader-bar span', { scaleX: 1, duration: 1.7, ease: 'power3.inOut' }, 0.25)
      .to('.loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '+=0.2')
      .add(() => { html.classList.remove('intro'); if (lenis) lenis.start(); });
  }
  const hbv = $('.hb-v');
  const ho = { v: 0 };
  if (innerWidth > 900) tl.to(ho, { v: 15403, duration: 2.4, ease: 'power3.out', onUpdate: () => { hbv.textContent = fmt(ho.v, 'th'); } }, intro ? '-=0.8' : 0);
  tl.from('.hero-bignum', { yPercent: 12, opacity: 0, duration: 2 }, innerWidth > 900 ? '<' : 0)
    .from('.hero-figure', { yPercent: 6, duration: 2 }, '<')
    .from('.hero-glow', { opacity: 0, duration: 2.4, ease: 'power2.out' }, '<')
    .from('.hero-title .ln > span', { yPercent: 110, duration: 1.3, stagger: 0.08 }, '<0.25')
    .from('.hero-k, .hero-sub, .hero-ctas', { y: 22, opacity: 0, duration: 1.1, stagger: 0.08 }, '<0.2')
    .from('.hero-data', { x: 40, opacity: 0, duration: 1.3 }, '<')
    .from('.hd-list > div', { y: 12, opacity: 0, duration: 0.9, stagger: 0.07 }, '<0.3')
    .from('.nav-in > *', { y: -16, opacity: 0, duration: 1, stagger: 0.05 }, '<');

  /* ----- nav: some ao descer, muda de cor sobre seções escuras ----- */
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      if (!menuOpen) nav.classList.toggle('is-hidden', self.direction === 1 && y > innerHeight * 0.8);
      navOnDark();
    }
  });
  navOnDark();
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  const tasks = [];
  const later = (fn) => tasks.push(fn);

  /* ----- hero: a cena recua e o número cresce ----- */
  later(() => {
    mm.add(DESK, () => {
      gsap.timeline({ scrollTrigger: { trigger: '.hero-stage', start: 'top top', end: '+=90%', pin: true, scrub: 1, anticipatePin: 1 } })
        .to('.hero-bignum', { scale: 1.25, yPercent: -18, opacity: 0.35, ease: 'none' }, 0)
        .to('.hero-figure', { scale: 0.88, transformOrigin: '50% 100%', ease: 'none' }, 0)
        .to('.hero-copy', { y: -80, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0)
        .to('.hero-data', { y: -80, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0.05)
        .to('.hero-glow', { opacity: 0.3, ease: 'none' }, 0);
    });
    // faixa de indicadores só anima quando visível
    const track = $('.ticker-track');
    ScrollTrigger.create({ trigger: '.ticker', start: 'top bottom', end: 'bottom top', onToggle: (s) => { track.style.animationPlayState = s.isActive ? 'running' : 'paused'; } });
  });

  /* ----- mercado: barras crescem e números contam ----- */
  later(() => {
    gsap.from('.bar-fill', { scaleX: 0, duration: 1.6, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.bars', start: 'top 80%' } });
    gsap.from('.bar-name, .bar-val', { opacity: 0, x: -10, duration: 1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.bars', start: 'top 80%' } });
    $$('.kpis .count').forEach((el) => {
      const to = Number(el.dataset.to);
      const kind = el.dataset.fmt;
      const o = { v: 0 };
      el.textContent = fmt(0, kind);
      gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v, kind); }, scrollTrigger: { trigger: '.kpis', start: 'top 88%', once: true } });
    });
    gsap.from('.kpis li', { y: 40, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.kpis', start: 'top 88%' } });
    gsap.from('.chart', { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.chart', start: 'top 88%' } });
  });

  /* ----- resultado: contador preso à rolagem ----- */
  later(() => {
    const bigCount = $('.count-big');
    const meter = $('.big-meter span');
    const setBig = (p) => { bigCount.textContent = String(Math.round(130 * p)); meter.style.transform = 'scaleX(' + p.toFixed(3) + ')'; };
    mm.add(DESK, () => {
      setBig(0);
      const row = $$('.big-row > *');
      gsap.set(row, { y: 40, opacity: 0 });
      const st = { p: 0 };
      gsap.timeline({ scrollTrigger: { trigger: '.big-stage', start: 'top top', end: '+=110%', pin: true, scrub: 0.8, anticipatePin: 1 } })
        .from('.big-cur, .big-unit', { y: 40, opacity: 0, duration: 0.2 }, 0)
        .to(st, { p: 1, duration: 0.7, ease: 'power1.inOut', onUpdate: () => setBig(st.p) }, 0)
        .to(row, { y: 0, opacity: 1, stagger: 0.08, duration: 0.25 }, 0.62);
      return () => setBig(1);
    });
    mm.add(MOB, () => {
      setBig(0);
      const st = { p: 0 };
      gsap.to(st, { p: 1, duration: 2.2, ease: 'power3.out', onUpdate: () => setBig(st.p), scrollTrigger: { trigger: '.big-figure', start: 'top 85%', once: true } });
    });
    gsap.from('.tl', { y: 70, opacity: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.timeline', start: 'top 85%' } });
    $$('.tl-img img').forEach((img) => gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));
  });

  /* ----- tese: pilares ----- */
  later(() => {
    gsap.from('.thesis-head > *', { y: 40, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.thesis-head', start: 'top 85%' } });
    $$('.pillar').forEach((p, i) => {
      gsap.timeline({ scrollTrigger: { trigger: '.pillars', start: 'top 85%' }, delay: i * 0.12 })
        .fromTo(p, { '--pf': 0 }, { '--pf': 1, duration: 1.4, ease: 'expo.inOut' })
        .from(p.children, { y: 30, opacity: 0, duration: 1, stagger: 0.06, ease: 'expo.out' }, 0.2);
    });
  });

  /* ----- régua dos 120 meses: os meses acendem com a rolagem ----- */
  later(() => {
    const cells = $$('.ruler-grid i');
    const mEl = $('.ruler-m');
    const phEl = $('.ruler-phase');
    const phase = (m) => m === 0 ? 'Entrada' : m < 36 ? 'Obra' : m === 36 ? 'Chaves' : m < 120 ? 'Pós-chaves' : 'Quitação';
    let lit = -1;
    const setLit = (n) => {
      n = Math.max(0, Math.min(cells.length, n));
      if (n === lit) return;
      lit = n;
      cells.forEach((c, k) => c.classList.toggle('is-off', k >= n));
      const m = Math.max(0, n - 1);
      mEl.textContent = String(m).padStart(3, '0');
      phEl.textContent = n ? phase(m) : 'Assinatura';
    };
    setLit(0);
    mm.add(DESK, () => {
      ScrollTrigger.create({ trigger: '.ruler-pin', start: 'top top', end: '+=150%', pin: true, scrub: true, anticipatePin: 1, onUpdate: (s) => setLit(Math.round(s.progress * 1.08 * cells.length)) });
    });
    mm.add(MOB, () => {
      ScrollTrigger.create({ trigger: '.ruler-grid', start: 'top 80%', end: 'bottom 35%', scrub: true, onUpdate: (s) => setLit(Math.round(s.progress * 1.05 * cells.length)) });
    });
    gsap.from('.ruler-legend li', { y: 20, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.ruler-legend', start: 'top 92%' } });
  });

  /* ----- simulador e estratégias ----- */
  later(() => {
    gsap.from('.isim-inputs > *', { y: 30, opacity: 0, duration: 1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.isim-box', start: 'top 82%' } });
    gsap.from('.isim-out', { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.isim-box', start: 'top 82%' } });
    gsap.from('.ichart-svg', { clipPath: 'inset(0% 100% 0% 0%)', duration: 2, ease: 'power2.inOut', scrollTrigger: { trigger: '.ichart', start: 'top 80%' } });
    gsap.from('.panel:not([hidden]) > *', { y: 40, opacity: 0, duration: 1.1, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.panels', start: 'top 82%' } });
  });

  /* ----- dossiê: folhas empilham e recebem o carimbo ----- */
  later(() => {
    const sheets = $$('.sheet');
    sheets.forEach((sheet, i) => {
      const stamp = $('.stamp', sheet);
      gsap.fromTo(stamp, { scale: 2.4, opacity: 0, rotation: -30 }, { scale: 1, opacity: 0.85, rotation: -12, duration: 0.5, ease: 'back.out(2.2)', scrollTrigger: { trigger: sheet, start: 'top 45%', toggleActions: 'play none none reverse' } });
      gsap.from($$('.checks li', sheet), { x: -16, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: sheet, start: 'top 75%' } });
      const next = sheets[i + 1];
      if (next) gsap.fromTo(sheet, { scale: 1, filter: 'brightness(1)' }, { scale: 0.94, filter: 'brightness(.9)', ease: 'none', scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 25%', scrub: true } });
    });
  });

  /* ----- guia: o livro gira com a rolagem ----- */
  later(() => {
    gsap.fromTo('.book-3d', { rotationY: -42, rotationX: 8, y: 60 }, { rotationY: -14, rotationX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: '.guide', start: 'top bottom', end: 'center center', scrub: true } });
    gsap.from('.toc li', { y: 24, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.toc', start: 'top 85%' } });
  });

  /* ----- reconhecimentos: a foto cresce até ocupar a tela ----- */
  later(() => {
    mm.add(DESK, () => {
      gsap.timeline({ scrollTrigger: { trigger: '.zoom-stage', start: 'top top', end: '+=150%', pin: true, scrub: 1, anticipatePin: 1 } })
        .fromTo('.zoom-fig', { clipPath: 'inset(20% 35% 20% 35% round 4px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
        .fromTo('.zoom-fig img', { scale: 1.35 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
        .to('.zoom-l', { xPercent: -70, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0.1)
        .to('.zoom-r', { xPercent: 70, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0.1)
        .from('.zoom-cap > *', { y: 50, opacity: 0, stagger: 0.08, duration: 0.3 }, 0.75)
        .to({}, { duration: 0.25 });
    });
  });

  /* ----- região ----- */
  later(() => {
    const coast = $$('.map-coast');
    coast.forEach((el) => { const len = pathLen(el); el.style.strokeDasharray = len; el.style.strokeDashoffset = len; });
    gsap.timeline({ scrollTrigger: { trigger: '.map', start: 'top 75%' } })
      .from('.map-sea', { opacity: 0, duration: 1.2, ease: 'power2.out' })
      .to(coast, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 0)
      .from('.map-pin', { opacity: 0, y: 10, duration: 0.8, stagger: 0.12, ease: 'expo.out' }, 0.8);
    gsap.from('.city, .region-note', { y: 50, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.cities', start: 'top 82%' } });
  });

  /* ----- sobre ----- */
  later(() => {
    gsap.fromTo('.about-block', { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.about-in', start: 'top 85%', end: 'top 35%', scrub: true } });
    gsap.fromTo('.about-fig img', { yPercent: 12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.about-in', start: 'top bottom', end: 'center center', scrub: true } });
    gsap.from('.pledges li', { y: 20, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.pledges', start: 'top 88%' } });
    gsap.fromTo('.sig-wrap .signature', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, ease: 'power2.inOut', scrollTrigger: { trigger: '.sig-wrap', start: 'top 88%' } });
  });

  /* ----- títulos por máscara e revelações ----- */
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
    $$('.market-copy h2, .thesis-head h2, .ruler-head h2, .isim-head h2, .strat-head h2, .dossier-head h2, .guide-copy h2, .region h2, .about-copy h2, .faq-head h2').forEach((h) => {
      maskWords(h);
      gsap.from($$('.wi', h), { yPercent: 115, duration: 1.2, stagger: 0.04, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    $$('.sh').forEach((sh) => {
      gsap.timeline({ scrollTrigger: { trigger: sh, start: 'top 92%' } })
        .from(sh, { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
        .from(sh.children, { y: 12, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' }, 0.3);
    });
    const reveals = $$('.market-copy p, .dossier-head .muted-l, .dossier-head .btn, .isim-head .muted-l, .guide-copy .muted-l, .guide-ctas, .letter > p, .faq-head .muted, .faq-head .btn, .faq-list details');
    gsap.set(reveals, { y: 30, opacity: 0 });
    ScrollTrigger.batch(reveals, { start: 'top 92%', once: true, onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: 'expo.out' }) });
  });

  /* ----- contato + rodapé ----- */
  later(() => {
    gsap.timeline({ scrollTrigger: { trigger: '.cta-in', start: 'top 75%' }, defaults: { ease: 'expo.out' } })
      .from('.cta-title .ln > span', { yPercent: 110, duration: 1.4, stagger: 0.12 })
      .from('.cta-info li', { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, '<0.4')
      .from('.planner', { y: 60, opacity: 0, duration: 1.3 }, '<');
    gsap.fromTo('.footer-word', { yPercent: 45 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });

  /* ----- botão flutuante e links ativos ----- */
  later(() => {
    ScrollTrigger.create({ trigger: '.hero', start: 'bottom 70%', endTrigger: '#contato', end: 'top 85%', onToggle: (st) => waFloat.classList.toggle('is-on', st.isActive) });
    $$('.nav-links a').forEach((a) => {
      const sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
    });
  });

  /* ----- cursor e botões magnéticos ----- */
  if (finePointer) later(() => {
    const cur = $('.cursor');
    html.classList.add('has-cursor');
    gsap.set(cur, { x: -100, y: -100 });
    const cx = gsap.quickTo(cur, 'x', { duration: 0.2, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.2, ease: 'power3' });
    addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => cur.classList.toggle('is-link', !!e.target.closest('a, button, summary, label, input')));
    document.addEventListener('pointerleave', () => gsap.to(cur, { opacity: 0, duration: 0.2 }));
    document.addEventListener('pointerenter', () => gsap.to(cur, { opacity: 1, duration: 0.2 }));
    $$('.btn:not(.btn-sm):not(.btn-block), .float-cta').forEach((btn) => {
      let r = null;
      btn.addEventListener('pointerenter', () => { r = btn.getBoundingClientRect(); });
      btn.addEventListener('pointermove', (e) => {
        if (!r) return;
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.6, ease: 'power3.out' });
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
