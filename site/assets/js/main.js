/* =============================================================================
   main.js — comportamento do site (sem dependências, sem build)
   -----------------------------------------------------------------------------
   1  utilidades            6  contadores          11  acordeão
   2  dados do config.js    7  parallax            12  formulário → WhatsApp
   3  SEO estruturado       8  scrollspy           13  mapa
   4  cabeçalho + progresso 9  método (medidor)    14  menu mobile
   5  revelar no scroll    10  comparador/carrossel
   ========================================================================== */
(() => {
  'use strict';

  const CFG = window.SITE || {};
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -- 1. utilidades ------------------------------------------------------ */
  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const caminho = (obj, chave) => chave.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  /** Executa fn no máximo uma vez por frame. */
  const porFrame = (fn) => {
    let agendado = false;
    return (...args) => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => { agendado = false; fn(...args); });
    };
  };

  /* -- 2. dados do config.js ---------------------------------------------- */
  const soDigitos = (v) => String(v || '').replace(/\D/g, '');

  const linkWhatsapp = (texto) => {
    const num = soDigitos(CFG.whatsapp);
    if (!num) return '#contato';
    const msg = encodeURIComponent(texto || CFG.mensagemWhatsapp || '');
    return `https://wa.me/${num}${msg ? `?text=${msg}` : ''}`;
  };

  const aplicarConfig = () => {
    // textos: <span data-bind="endereco.linha1">
    $$('[data-bind]').forEach((el) => {
      const v = caminho(CFG, el.dataset.bind);
      if (v != null && v !== '') el.textContent = v;
    });

    // links
    $$('[data-wa]').forEach((a) => {
      a.href = linkWhatsapp();
      a.target = '_blank';
      a.rel = 'noopener';
    });
    $$('[data-email]').forEach((a) => { if (CFG.email) a.href = `mailto:${CFG.email}`; });
    $$('[data-mapa]').forEach((a) => {
      const url = caminho(CFG, 'endereco.mapaLink');
      if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    });

    // horários
    const listas = $$('[data-horarios]');
    if (listas.length && Array.isArray(CFG.horarios)) {
      const html = CFG.horarios
        .map((h) => `<li><b>${h.dias}</b><span>${h.hora}</span></li>`)
        .join('');
      listas.forEach((ul) => { ul.innerHTML = html; });
    }

    // redes sociais
    // ícones em traço (stroke), desenhados para 24x24
    const ICONES = {
      instagram: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/>'
               + '<circle cx="12" cy="12" r="4.1"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
      facebook:  '<path d="M14.6 8.4V6.9c0-.8.3-1.3 1.3-1.3h1.5V2.9h-2.4c-2.6 0-3.8 1.5-3.8 3.7v1.8H9.1v2.9h2.1V21h3.4v-9.7h2.4l.4-2.9h-2.8Z"/>',
      youtube:   '<rect x="2.6" y="5.6" width="18.8" height="12.8" rx="4"/><path d="m10.2 9.6 5.1 2.4-5.1 2.4V9.6Z"/>',
      tiktok:    '<path d="M15.6 3.2c.4 2 1.9 3.5 3.9 3.7v2.7a6.7 6.7 0 0 1-3.9-1.3v5.9a5.4 5.4 0 1 1-4.7-5.4v2.8a2.6 2.6 0 1 0 1.9 2.5V3.2h2.8Z"/>',
    };
    const NOMES = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', tiktok: 'TikTok' };
    const redes = CFG.redes || {};
    const htmlRedes = Object.keys(ICONES)
      .filter((k) => redes[k])
      .map((k) => `<a href="${redes[k]}" target="_blank" rel="noopener" aria-label="${NOMES[k]}">
          <svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[k]}</svg></a>`)
      .join('');
    $$('[data-redes]').forEach((el) => { el.innerHTML = htmlRedes; });

    // título da aba + ano
    if (CFG.nome && CFG.especialidade) {
      document.title = `${CFG.nome} — ${CFG.especialidade}`;
    }
    $$('[data-ano]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  };

  /* -- 3. SEO estruturado (JSON-LD) --------------------------------------- */
  const injetarSchema = () => {
    const end = CFG.endereco || {};
    const dados = {
      '@context': 'https://schema.org',
      '@type': 'Dentist',
      name: CFG.nome,
      description: document.querySelector('meta[name="description"]')?.content,
      url: CFG.site,
      image: `${CFG.site || ''}/assets/img/og-capa.svg`,
      telephone: CFG.telefoneExibicao,
      email: CFG.email,
      priceRange: '$$',
      medicalSpecialty: CFG.especialidade,
      address: {
        '@type': 'PostalAddress',
        streetAddress: end.linha1,
        addressLocality: CFG.cidade,
        addressRegion: CFG.uf,
        postalCode: end.cep,
        addressCountry: 'BR',
      },
      sameAs: Object.values(CFG.redes || {}).filter(Boolean),
    };
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(dados);
    document.head.appendChild(tag);
  };

  /* -- 4. cabeçalho + barra de progresso ---------------------------------- */
  const cabecalho = () => {
    const topo = $('[data-topo]');
    const barra = $('[data-progresso]');
    const btnTopo = $('[data-topo-btn]');
    let ultimo = 0;

    const aoRolar = porFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;

      if (barra) barra.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
      if (topo) {
        topo.classList.toggle('is-fixo', y > 40);
        // esconde ao descer, revela ao subir — só depois do hero
        topo.classList.toggle('is-oculto', y > 620 && y > ultimo && !document.body.classList.contains('menu-aberto'));
      }
      if (btnTopo) btnTopo.classList.toggle('is-visivel', y > 900);
      ultimo = y;
    });

    addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();

    btnTopo?.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: semMovimento ? 'auto' : 'smooth' });
    });
  };

  /* -- 5. revelar no scroll ----------------------------------------------- */
  const fatiarPalavras = () => {
    $$('[data-revelar-palavras]').forEach((el) => {
      const frag = document.createDocumentFragment();
      let i = 0;
      // preserva <em> e demais tags simples de um nível
      Array.from(el.childNodes).forEach((no) => {
        const texto = no.textContent || '';
        texto.split(/(\s+)/).forEach((pedaco) => {
          if (!pedaco.trim()) { frag.appendChild(document.createTextNode(pedaco)); return; }
          const fora = document.createElement('span');
          fora.className = 'palavra';
          const dentro = document.createElement('span');
          dentro.style.setProperty('--w', `${i * 55}ms`);
          if (no.nodeType === 1) {
            const clone = no.cloneNode(false);
            clone.textContent = pedaco;
            dentro.appendChild(clone);
          } else {
            dentro.textContent = pedaco;
          }
          fora.appendChild(dentro);
          frag.appendChild(fora);
          i += 1;
        });
      });
      el.textContent = '';
      el.appendChild(frag);
    });
  };

  const revelar = () => {
    const alvos = $$('[data-revelar]');
    alvos.forEach((el) => {
      if (el.dataset.atraso) el.style.setProperty('--atraso', `${el.dataset.atraso}ms`);
    });

    if (semMovimento || !('IntersectionObserver' in window)) {
      alvos.forEach((el) => el.classList.add('is-visivel'));
      return;
    }

    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visivel');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    alvos.forEach((el) => obs.observe(el));
  };

  /* -- 6. contadores ------------------------------------------------------ */
  const contadores = () => {
    const alvos = $$('[data-contador]');
    if (!alvos.length) return;

    const anima = (el) => {
      const fim = Number(el.dataset.contador) || 0;
      const sufixo = el.dataset.sufixo || '';
      if (semMovimento) { el.textContent = fim.toLocaleString('pt-BR') + sufixo; return; }

      const dur = 1500;
      const t0 = performance.now();
      const passo = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const suave = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(fim * suave).toLocaleString('pt-BR') + sufixo;
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };

    if (!('IntersectionObserver' in window)) { alvos.forEach(anima); return; }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        anima(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    alvos.forEach((el) => obs.observe(el));
  };

  /* -- 7. parallax -------------------------------------------------------- */
  const parallax = () => {
    const alvos = $$('[data-parallax]');
    if (!alvos.length || semMovimento) return;

    const mover = porFrame(() => {
      const meio = innerHeight / 2;
      alvos.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const centro = r.top + r.height / 2;
        const fator = Number(el.dataset.parallax) || 0.05;
        el.style.transform = `translate3d(0, ${((centro - meio) * fator).toFixed(2)}px, 0)`;
      });
    });

    addEventListener('scroll', mover, { passive: true });
    addEventListener('resize', mover);
    mover();
  };

  /* -- 8. scrollspy ------------------------------------------------------- */
  const scrollspy = () => {
    const links = $$('.nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const mapa = new Map();
    links.forEach((a) => {
      const alvo = document.getElementById(a.hash.slice(1));
      if (alvo) mapa.set(alvo, a);
    });

    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        const a = mapa.get(e.target);
        if (!a) return;
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.remove('is-ativo'));
          a.classList.add('is-ativo');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    mapa.forEach((_, alvo) => obs.observe(alvo));
  };

  /* -- 9. medidor do método ----------------------------------------------- */
  const medidorMetodo = () => {
    const barra = $('[data-metodo-medidor]');
    const lista = $('[data-etapas]');
    if (!barra || !lista) return;

    const atualiza = porFrame(() => {
      const r = lista.getBoundingClientRect();
      const total = r.height - innerHeight * 0.4;
      const andado = innerHeight * 0.6 - r.top;
      const p = Math.max(0, Math.min(1, total > 0 ? andado / total : 0));
      barra.style.width = `${(p * 100).toFixed(1)}%`;
    });

    addEventListener('scroll', atualiza, { passive: true });
    addEventListener('resize', atualiza);
    atualiza();
  };

  /* -- 10a. comparador antes/depois --------------------------------------- */
  const comparador = () => {
    const raiz = $('[data-comparador]');
    if (!raiz) return;
    const caixa = $('.comparador__caixa', raiz);
    const depois = $('[data-comparador-depois]', raiz);
    const alca = $('[data-comparador-alca]', raiz);
    const range = $('[data-comparador-range]', raiz);
    if (!caixa || !depois || !range) return;

    const medir = () => caixa.style.setProperty('--largura-caixa', `${caixa.clientWidth}px`);

    const aplicar = (v) => {
      const p = Math.max(0, Math.min(100, v));
      depois.style.width = `${p}%`;
      if (alca) alca.style.left = `${p}%`;
      range.setAttribute('aria-valuetext', `${Math.round(p)}% do resultado final visível`);
    };

    range.addEventListener('input', () => aplicar(Number(range.value)));

    // arrastar com mouse/toque sobre a imagem
    const arrastar = (e) => {
      const r = caixa.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const p = (x / r.width) * 100;
      range.value = String(p);
      aplicar(p);
    };
    let ativo = false;
    caixa.addEventListener('pointerdown', (e) => { ativo = true; caixa.setPointerCapture?.(e.pointerId); arrastar(e); });
    caixa.addEventListener('pointermove', (e) => { if (ativo) arrastar(e); });
    addEventListener('pointerup', () => { ativo = false; });

    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(caixa);
    addEventListener('resize', medir);
    medir();
    aplicar(Number(range.value));
  };

  /* -- 10b. carrossel de depoimentos -------------------------------------- */
  const carrossel = () => {
    const raiz = $('[data-carrossel]');
    if (!raiz) return;
    const trilho = $('[data-carrossel-trilho]', raiz);
    const itens = $$('.depo__item', raiz);
    const pontos = $('[data-carrossel-pontos]', raiz);
    if (!trilho || itens.length < 2) return;

    let atual = 0;
    let timer = null;

    itens.forEach((el, i) => {
      el.setAttribute('role', 'tabpanel');
      el.id = `depo-${i}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', `depo-${i}`);
      b.setAttribute('aria-label', `Depoimento ${i + 1} de ${itens.length}`);
      b.addEventListener('click', () => { ir(i); reiniciar(); });
      pontos?.appendChild(b);
    });

    const ir = (i) => {
      atual = (i + itens.length) % itens.length;
      trilho.style.transform = `translate3d(-${atual * 100}%,0,0)`;
      itens.forEach((el, n) => el.setAttribute('aria-hidden', String(n !== atual)));
      $$('button', pontos).forEach((b, n) => b.setAttribute('aria-selected', String(n === atual)));
    };

    const reiniciar = () => {
      if (timer) clearInterval(timer);
      if (semMovimento) return;
      timer = setInterval(() => ir(atual + 1), 7000);
    };

    $('[data-carrossel-ant]', raiz)?.addEventListener('click', () => { ir(atual - 1); reiniciar(); });
    $('[data-carrossel-prox]', raiz)?.addEventListener('click', () => { ir(atual + 1); reiniciar(); });

    raiz.addEventListener('mouseenter', () => timer && clearInterval(timer));
    raiz.addEventListener('mouseleave', reiniciar);
    raiz.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { ir(atual - 1); reiniciar(); }
      if (e.key === 'ArrowRight') { ir(atual + 1); reiniciar(); }
    });

    // arrastar / swipe
    let x0 = null;
    raiz.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    raiz.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const d = e.clientX - x0;
      if (Math.abs(d) > 45) { ir(atual + (d < 0 ? 1 : -1)); reiniciar(); }
      x0 = null;
    });

    ir(0);
    reiniciar();
  };

  /* -- 11. acordeão (um aberto por vez) ----------------------------------- */
  const acordeao = () => {
    const raiz = $('[data-acordeao]');
    if (!raiz) return;
    const itens = $$('details', raiz);
    itens.forEach((d) => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        itens.forEach((o) => { if (o !== d) o.open = false; });
      });
    });
  };

  /* -- 12. formulário → WhatsApp ------------------------------------------ */
  const formulario = () => {
    const form = $('[data-form]');
    if (!form) return;
    const status = $('[data-form-status]', form);

    const erro = (nome, msg) => {
      const alvo = $(`[data-erro-de="${nome}"]`, form);
      if (alvo) alvo.textContent = msg || '';
      const campo = form.elements[nome]?.closest('.campo');
      campo?.classList.toggle('is-erro', Boolean(msg));
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const nome = String(d.get('nome') || '').trim();
      const tel = soDigitos(d.get('telefone'));
      const assunto = String(d.get('assunto') || '');
      const msg = String(d.get('mensagem') || '').trim();
      const ok = d.get('consentimento');

      let valido = true;
      erro('nome', ''); erro('telefone', ''); erro('assunto', ''); erro('consentimento', '');

      if (nome.length < 2) { erro('nome', 'Escreva seu nome.'); valido = false; }
      if (tel.length < 10 || tel.length > 13) {
        erro('telefone', 'Informe DDD + número (ex.: 85999998888).'); valido = false;
      }
      if (!assunto) { erro('assunto', 'Escolha um assunto.'); valido = false; }
      if (!ok) { erro('consentimento', 'É preciso autorizar o contato.'); valido = false; }

      if (!valido) {
        if (status) { status.textContent = 'Confira os campos destacados.'; status.classList.remove('is-ok'); }
        $('.is-erro input, .is-erro select', form)?.focus();
        return;
      }

      const texto = [
        `Olá! Sou ${nome}.`,
        `Quero falar sobre: ${assunto}.`,
        msg ? `Observação: ${msg}` : null,
        `Meu WhatsApp: ${tel}.`,
        'Vim pelo site.',
      ].filter(Boolean).join('\n');

      if (status) {
        status.textContent = 'Abrindo o WhatsApp…';
        status.classList.add('is-ok');
      }
      window.open(linkWhatsapp(texto), '_blank', 'noopener');
    });
  };

  /* -- 13. mapa ----------------------------------------------------------- */
  const mapa = () => {
    const slot = $('[data-mapa-slot]');
    if (!slot) return;
    const src = caminho(CFG, 'endereco.mapaEmbed');
    const end = CFG.endereco || {};

    if (src) {
      const f = document.createElement('iframe');
      f.src = src;
      f.loading = 'lazy';
      f.title = `Localização do consultório — ${CFG.nome || ''}`;
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      slot.appendChild(f);
      return;
    }

    slot.innerHTML = `
      <div class="mapa__vazio">
        <strong>${end.linha1 || ''}</strong>
        <p>${end.linha2 || ''}${end.cep ? ` · CEP ${end.cep}` : ''}</p>
        <p>Para exibir o mapa aqui, cole o código “Incorporar um mapa” do Google Maps
        em <code>endereco.mapaEmbed</code> no arquivo <code>assets/js/config.js</code>.</p>
        <a class="btn btn--fantasma" href="${end.mapaLink || '#'}" target="_blank" rel="noopener">Abrir no Google Maps</a>
      </div>`;
  };

  /* -- 14. menu mobile + marquee ------------------------------------------ */
  const menu = () => {
    const btn = $('[data-menu-btn]');
    const nav = $('#menu');
    if (!btn || !nav) return;

    const fechar = () => {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menu de navegação');
      nav.classList.remove('is-aberto');
      document.body.classList.remove('menu-aberto');
    };

    btn.addEventListener('click', () => {
      const aberto = btn.getAttribute('aria-expanded') === 'true';
      if (aberto) { fechar(); return; }
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Fechar menu de navegação');
      nav.classList.add('is-aberto');
      document.body.classList.add('menu-aberto');
    });

    $$('a', nav).forEach((a) => a.addEventListener('click', fechar));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
    matchMedia('(min-width: 901px)').addEventListener('change', fechar);
  };

  const marquee = () => {
    const trilho = $('[data-marquee]');
    if (!trilho) return;
    const lista = $('.faixa__lista', trilho);
    if (!lista) return;
    // duplica para o loop não deixar buraco
    const copia = lista.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    trilho.appendChild(copia);
  };

  /* -- arranque ----------------------------------------------------------- */
  const iniciar = () => {
    aplicarConfig();
    injetarSchema();
    fatiarPalavras();
    revelar();
    cabecalho();
    contadores();
    parallax();
    scrollspy();
    medidorMetodo();
    comparador();
    carrossel();
    acordeao();
    formulario();
    mapa();
    menu();
    marquee();
    document.documentElement.classList.add('js-pronto');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
