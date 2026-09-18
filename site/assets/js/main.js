/* =============================================================================
   main.js — comportamento do site (sem dependências, sem build)
   -----------------------------------------------------------------------------
   1  utilidades            5  revelar no scroll    9  método (medidor)
   2  dados do config.js    6  contadores          10  acordeão
   3  SEO estruturado       7  parallax            11  formulário → WhatsApp
   4  cabeçalho + progresso 8  scrollspy           12  mapa · 13 menu · 14 marquee
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

  /* Abrir o WhatsApp sem depender de window.open.
     O Safari do iPhone barra window.open disparado de dentro de um `submit`:
     o clique é um gesto, mas o submit que vem depois já não conta como tal, e
     a janela simplesmente não abre — era por isso que o botão não fazia nada.
     Um <a> clicado no mesmo instante não sofre esse bloqueio.

     A rede de segurança não é um temporizador adivinhando se algo abriu — isso
     chegou a navegar a aba original além de abrir a nova. É um link de verdade
     que aparece no lugar do aviso, para a pessoa tocar se nada acontecer. */
  const abrirWhatsapp = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();

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
    $$('[data-telefone]').forEach((a) => {
      const num = soDigitos(CFG.whatsapp);
      if (num) a.href = `tel:+${num}`;
    });
    $$('[data-mapa]').forEach((a) => {
      const url = caminho(CFG, 'endereco.mapaLink');
      if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    });
    $$('[data-rota]').forEach((a) => {
      const url = caminho(CFG, 'endereco.rotaLink') || caminho(CFG, 'endereco.mapaLink');
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
      pinterest: '<circle cx="12" cy="12" r="9.2"/><path d="M9.9 21c-.5-1.6-.2-3.4.1-4.7l1.2-4.9a3.3 3.3 0 0 1-.3-1.4c0-1.3.8-2.3 1.8-2.3.8 0 1.2.6 1.2 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.1-3.8-3 0-4.9 2.2-4.9 4.7 0 .9.3 1.5.7 2 .2.2.2.3.2.6l-.2.8c-.1.3-.3.4-.5.2-1.2-.5-1.8-1.9-1.8-3.6 0-2.7 2.3-5.9 6.8-5.9 3.6 0 6 2.6 6 5.4 0 3.7-2.1 6.5-5.1 6.5-1 0-2-.6-2.4-1.2l-.6 2.5c-.2.8-.7 1.8-1.1 2.5Z"/>',
    };
    const NOMES = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube',
                    tiktok: 'TikTok', pinterest: 'Pinterest' };
    const redes = CFG.redes || {};
    const ativas = Object.keys(ICONES).filter((k) => redes[k]);
    const htmlRedes = ativas
      .map((k) => `<a href="${redes[k]}" target="_blank" rel="noopener" aria-label="${NOMES[k]}">
          <svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[k]}</svg><b>${NOMES[k]}</b></a>`)
      .join('');
    $$('[data-redes]').forEach((el) => {
      el.innerHTML = htmlRedes;
      // Um ícone redondo sozinho parece coisa faltando. Com uma ou duas redes
      // o nome aparece ao lado e o link passa a parecer intencional.
      el.classList.toggle('redes--nomeadas', ativas.length > 0 && ativas.length < 3);
    });
    // sem nenhuma rede, o rótulo "Me acompanhe nas redes" ficaria órfão
    if (!ativas.length) {
      $$('[data-redes]').forEach((el) => {
        el.previousElementSibling?.classList.contains('rotulo--redes')
          && el.previousElementSibling.remove();
        el.remove();
      });
    }

    // e-mail é opcional: sem ele, o item some em vez de virar link quebrado
    if (!CFG.email) {
      $$('[data-email]').forEach((a) => a.closest('li')?.setAttribute('hidden', ''));
    } else {
      $$('[data-email-item]').forEach((li) => li.removeAttribute('hidden'));
    }

    // avaliações do Google — a seção só aparece se houver dados reais
    const g = CFG.google || {};
    const secaoG = $('[data-google-secao]');
    if (g.nota && g.link) {
      $$('[data-google-nota]').forEach((el) => { el.textContent = g.nota; });
      $$('[data-google-link]').forEach((a) => { a.href = g.link; });
      $$('[data-google-qtd]').forEach((el) => {
        el.textContent = g.quantidade
          ? `${g.quantidade} ${g.quantidade === 1 ? 'avaliação' : 'avaliações'}`
          : '';
      });
      $$('[data-google-selo] strong').forEach((el) => { el.textContent = `${g.nota} ★`; });
    } else {
      secaoG?.remove();
      $$('[data-google-selo]').forEach((li) => li.remove());
      // o menu e o rodapé não podem apontar para uma seção que não existe
      $$('a[href="#avaliacoes"]').forEach((a) => a.closest('li')?.remove() || a.remove());
    }

    // título da aba + ano
    if (CFG.nome && CFG.especialidade) {
      document.title = `${CFG.nome} — ${CFG.especialidade}`;
    }
    $$('[data-ano]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  };

  /* -- 3. SEO estruturado (JSON-LD) --------------------------------------- */

  // Traduz os horários escritos em português (o mesmo texto que aparece na
  // página) para o formato que o Google entende. Assim config.js continua
  // sendo o único lugar a editar: mudou lá, muda na página e no Google.
  const DIAS_EN = {
    domingo: 'Sunday', segunda: 'Monday', terca: 'Tuesday', quarta: 'Wednesday',
    quinta: 'Thursday', sexta: 'Friday', sabado: 'Saturday',
  };
  const ORDEM = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];

  const semAcento = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const diasDoTexto = (texto) => {
    // "segunda-feira" viraria uma falsa faixa por causa do hífen
    const limpo = semAcento(texto).replace(/[- ]feiras?/g, '');

    if (/\btodos? os dias\b|\btodo dia\b|\bdiariamente\b/.test(limpo)) return ORDEM.slice();

    // na ordem em que aparecem NO TEXTO, não na ordem da semana:
    // "sexta a segunda" precisa começar na sexta
    const achados = ORDEM
      .map((dia) => ({ dia, em: limpo.indexOf(dia) }))
      .filter((d) => d.em >= 0)
      .sort((a, b) => a.em - b.em);

    if (achados.length !== 2) return achados.map((d) => d.dia);

    // só conta como faixa se o que liga os dois dias for "a", "à", "até" ou traço
    const entre = limpo.slice(achados[0].em + achados[0].dia.length, achados[1].em);
    if (!/^\s*(a|ate|—|–|-)\s*$/.test(entre)) return achados.map((d) => d.dia);

    const i = ORDEM.indexOf(achados[0].dia);
    const f = ORDEM.indexOf(achados[1].dia);
    return i <= f ? ORDEM.slice(i, f + 1) : ORDEM.slice(i).concat(ORDEM.slice(0, f + 1));
  };

  const horasDoTexto = (texto) => {
    const achados = String(texto).match(/\d{1,2}\s*[h:]\s*\d{2}/g) || [];
    return achados.map((h) => {
      const [hh, mm] = h.split(/[h:]/).map((n) => n.trim());
      return `${hh.padStart(2, '0')}:${mm}`;
    });
  };

  const horariosParaSchema = (lista) =>
    (lista || []).map((faixa) => {
      const dias = diasDoTexto(faixa.dias || '');
      const horas = horasDoTexto(faixa.hora || '');
      if (!dias.length || horas.length !== 2) return null; // "Fechado" cai aqui
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dias.map((d) => DIAS_EN[d]),
        opens: horas[0],
        closes: horas[1],
      };
    }).filter(Boolean);

  // Campos vazios são removidos: um null no JSON-LD é ruído para o Google.
  const semVazios = (obj) => {
    const limpo = {};
    Object.entries(obj).forEach(([chave, valor]) => {
      const vazio = valor == null || valor === ''
        || (Array.isArray(valor) && !valor.length);
      if (!vazio) limpo[chave] = valor;
    });
    return limpo;
  };

  const injetarSchema = () => {
    const end = CFG.endereco || {};
    const dados = {
      '@context': 'https://schema.org',
      '@type': 'Dentist',
      name: CFG.nome,
      description: document.querySelector('meta[name="description"]')?.content,
      url: CFG.site,
      image: `${CFG.site || ''}/assets/img/og-capa.jpg`,
      // O Google pede o telefone em formato internacional, não o formatado
      // que aparece na tela.
      telephone: CFG.whatsapp ? `+${CFG.whatsapp}` : null,
      email: CFG.email,
      priceRange: '$$',
      medicalSpecialty: CFG.especialidade,
      openingHoursSpecification: horariosParaSchema(CFG.horarios),
      hasMap: caminho(CFG, 'endereco.mapaCanonico') || caminho(CFG, 'endereco.mapaLink'),
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
    tag.textContent = JSON.stringify(semVazios(dados));
    document.head.appendChild(tag);
  };

  /* -- 4. cabeçalho + barra de progresso ---------------------------------- */
  const cabecalho = () => {
    const topo = $('[data-topo]');
    const barra = $('[data-progresso]');
    const btnTopo = $('[data-topo-btn]');
    const barraAcoes = $('.barra-acoes');
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
      if (barraAcoes) barraAcoes.classList.toggle('is-visivel', y > 420);
      if (y < 320) $('[data-secao-atual]')?.classList.remove('is-visivel');
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
    // Só fatia o título se alguém for revelá-lo — ele próprio ou um bloco em
    // volta. Fatiar um título que nunca recebe .is-visivel o esconde de vez,
    // porque as palavras ficam fora do overflow:hidden de .palavra.
    $$('.secao .titulo').forEach((t) => {
      if (t.closest('[data-revelar]')) t.setAttribute('data-revelar-palavras', '');
    });
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
    // a rede de segurança do <head> já pode ter mostrado tudo; nesse caso as
    // animações ficam de fora e o conteúdo permanece visível
    clearTimeout(window.__redeDeSeguranca);
    if (!document.documentElement.classList.contains('js')) return;

    // o hero entra por CSS na carga (sem esperar o observer) — isso tirou ~1s do LCP
    $$('[data-entrada]').forEach((el) => {
      if (el.dataset.atraso) el.style.setProperty('--atraso', `${el.dataset.atraso}ms`);
    });

    // cascata: cada filho de um grupo entra um pouco depois do anterior
    $$('[data-cascata]').forEach((grupo) => {
      const passo = Number(grupo.dataset.cascata) || 70;
      $$(':scope > [data-revelar]', grupo).forEach((filho, i) => {
        if (!filho.dataset.atraso) filho.dataset.atraso = String(i * passo);
      });
    });

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

  /* -- 7. motor de efeitos de scroll --------------------------------------
     Um único laço de rAF cuida de todos os efeitos que dependem da posição da
     rolagem. Antes cada efeito tinha seu próprio listener; agora há uma leitura
     de layout por quadro, o que evita o vaivém entre ler e escrever no DOM. */
  const efeitosDeScroll = () => {
    if (semMovimento) return;

    const camadas   = $$('[data-parallax]');
    const desliza   = $$('[data-desliza]');
    const heroTexto = $('.hero__texto');
    const heroFoto  = $('.hero__foto');
    const hero      = $('.hero');
    const zooms     = $$('[data-zoom]');
    if (!camadas.length && !desliza.length && !hero && !zooms.length) return;

    let pendente = false;

    const desenhar = () => {
      pendente = false;
      const meio = innerHeight / 2;
      const y = window.scrollY;

      // profundidade na primeira dobra: o texto sobe mais que a foto e some
      // antes dela, o que dá a sensação de dois planos distintos
      if (hero) {
        const alturaHero = hero.offsetHeight || innerHeight;
        const p = Math.min(1, y / alturaHero);
        if (p < 1.02) {
          if (heroTexto) {
            heroTexto.style.transform = `translate3d(0, ${(y * 0.16).toFixed(1)}px, 0)`;
            heroTexto.style.opacity = String(Math.max(0, 1 - p * 1.35));
          }
          if (heroFoto) {
            heroFoto.style.transform = `translate3d(0, ${(y * 0.05).toFixed(1)}px, 0)`;
            heroFoto.style.opacity = String(Math.max(0, 1 - p * 1.1));
          }
        }
      }

      camadas.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -220 || r.top > innerHeight + 220) return;
        const centro = r.top + r.height / 2;
        const fator = Number(el.dataset.parallax) || 0.05;
        el.style.transform = `translate3d(0, ${((centro - meio) * fator).toFixed(2)}px, 0)`;
      });

      /* Deslize longo: a foto entra por baixo, encoberta pelo texto, e sobe
         junto com a rolagem até ficar acima dele. O texto anda um pouco no
         sentido contrário, o que separa os dois planos e é o que dá a leitura
         de "a imagem saiu de baixo do texto".

         `avanco` vai de 0 (a peça está entrando por baixo da tela) a 1 (está
         saindo por cima), então o deslocamento vai de +amplitude a -amplitude.
         Em tela estreita a amplitude cai, senão foto e texto se encavalam. */
      const escala = innerWidth < 760 ? 0.45 : 1;
      desliza.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const amplitude = (Number(el.dataset.desliza) || 0) * escala;
        const avanco = 1 - (r.top + r.height / 2) / (innerHeight + r.height / 2);
        const p = Math.max(0, Math.min(1, avanco));
        el.style.transform = `translate3d(0, ${((0.5 - p) * 2 * amplitude).toFixed(1)}px, 0)`;
      });

      // as fotos de ambiente crescem de leve enquanto atravessam a tela
      zooms.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const avanco = 1 - (r.top + r.height / 2) / (innerHeight + r.height / 2);
        const escala = 1.06 - Math.max(0, Math.min(1, avanco)) * 0.06;
        el.style.transform = `scale(${escala.toFixed(4)})`;
      });
    };

    const agendar = () => {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(desenhar);
    };

    addEventListener('scroll', agendar, { passive: true });
    addEventListener('resize', agendar);
    desenhar();
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

    const rotulo = $('[data-secao-atual]');

    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        const a = mapa.get(e.target);
        if (!a || !e.isIntersecting) return;
        links.forEach((l) => { l.classList.remove('is-ativo'); l.removeAttribute('aria-current'); });
        a.classList.add('is-ativo');
        a.setAttribute('aria-current', 'true');
        if (rotulo) {
          rotulo.textContent = a.textContent.trim();
          rotulo.classList.add('is-visivel');
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

  /* -- 10. comparador antes/depois ----------------------------------------
     Serve os dois casos da página. O eixo vem do HTML: sem `data-eixo` a linha
     é vertical e o dedo anda na horizontal; com `data-eixo="vertical"` a linha
     é horizontal e o dedo anda na vertical. Toda a lógica é a mesma; o que
     muda é qual coordenada vira porcentagem e qual gesto é nosso. */
  const montarComparador = (raiz) => {
    const controle = $('[data-comparador-controle]', raiz);
    if (!controle) return;
    const dica = raiz.closest('.caso')?.querySelector('[data-comparador-dica]');
    const vertical = raiz.dataset.eixo === 'vertical';

    let jaMexeu = false;

    const posicionar = (pct) => {
      const p = Math.max(0, Math.min(100, pct));
      raiz.style.setProperty('--pos', `${p}%`);
      controle.value = String(p);
      controle.setAttribute('aria-valuetext',
        p < 8  ? 'mostrando só o depois'
      : p > 92 ? 'mostrando só o antes'
      : vertical
        ? `${Math.round(p)}% do antes no alto, o resto é o depois`
        : `${Math.round(p)}% do antes à esquerda, o resto é o depois`);
    };

    const usou = () => {
      if (jaMexeu) return;
      jaMexeu = true;
      raiz.classList.remove('is-convidando');
      dica?.classList.add('is-oculta');
    };

    controle.addEventListener('input', () => { posicionar(Number(controle.value)); usou(); });

    /* O passo do range é 0,1 para o arraste ficar suave, mas isso deixava cada
       seta valendo 0,1% — mil toques para atravessar a imagem. As setas andam
       2%, com Home/End nos extremos e PageUp/PageDown de 10 em 10. */
    const PASSOS = {
      ArrowLeft: -2, ArrowDown: -2, ArrowRight: 2, ArrowUp: 2,
      PageDown: -10, PageUp: 10,
    };
    controle.addEventListener('keydown', (e) => {
      let destino = null;
      if (e.key in PASSOS) destino = Number(controle.value) + PASSOS[e.key];
      else if (e.key === 'Home') destino = 0;
      else if (e.key === 'End') destino = 100;
      if (destino === null) return;
      e.preventDefault();
      posicionar(destino);
      usou();
    });

    const daPosicao = (x, y) => {
      const r = raiz.getBoundingClientRect();
      return vertical ? ((y - r.top) / r.height) * 100
                      : ((x - r.left) / r.width) * 100;
    };

    /* Mouse e caneta: Pointer Events dão conta.
       O dedo NÃO passa por aqui — ver o bloco de toque abaixo, e o porquê. */
    let arrastandoPonteiro = false;
    raiz.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      e.preventDefault();
      arrastandoPonteiro = true;
      raiz.classList.add('is-arrastando');
      // setPointerCapture lança se o ponteiro já não estiver ativo; o `?.`
      // protege contra o método não existir, não contra ele estourar.
      try { raiz.setPointerCapture(e.pointerId); } catch (_) {}
      posicionar(daPosicao(e.clientX, e.clientY));
      usou();
    });
    raiz.addEventListener('pointermove', (e) => {
      if (!arrastandoPonteiro) return;
      posicionar(daPosicao(e.clientX, e.clientY));
      e.preventDefault();
    });
    const soltarPonteiro = () => {
      if (!arrastandoPonteiro) return;
      arrastandoPonteiro = false;
      raiz.classList.remove('is-arrastando');
    };
    raiz.addEventListener('pointerup', soltarPonteiro);
    raiz.addEventListener('pointercancel', soltarPonteiro);
    addEventListener('pointerup', soltarPonteiro);
    addEventListener('pointercancel', soltarPonteiro);

    /* Dedo: Touch Events, não Pointer Events.
       No Safari do iPhone o caminho por ponteiro não é confiável para um
       arraste: o navegador dispara `pointercancel` assim que decide que o
       gesto é rolagem, e aí o arraste morre no primeiro quadro. Touch Events
       não têm esse comportamento e estão em todo lugar.

       A direção é decidida no primeiro movimento: se o gesto for no nosso
       eixo, ele é nosso e a página não rola; se for no outro, a pessoa está só
       passando pela seção e a rolagem segue normal — por isso o toque não
       reposiciona nada antes de saber para onde vai.

       No comparador vertical isso é mais delicado: o nosso eixo é o mesmo da
       rolagem. Lá o gesto só é nosso se tiver começado na linha ou na alça —
       no resto da foto a pessoa rola a página como em qualquer outro lugar. */
    let toqueId = null, x0 = 0, y0 = 0, decidido = false, meu = false, naAlca = false;

    raiz.addEventListener('touchstart', (e) => {
      if (toqueId !== null) return;
      const t = e.changedTouches[0];
      toqueId = t.identifier;
      x0 = t.clientX; y0 = t.clientY;
      decidido = false; meu = false;
      // no vertical, só o gesto que começa na linha/alça é nosso
      naAlca = !!(t.target instanceof Element && t.target.closest('.comparador__linha'));
    }, { passive: true });

    const doToque = (e) => {
      for (const t of e.changedTouches) if (t.identifier === toqueId) return t;
      return null;
    };

    raiz.addEventListener('touchmove', (e) => {
      const t = doToque(e);
      if (!t) return;
      if (!decidido) {
        const dx = Math.abs(t.clientX - x0);
        const dy = Math.abs(t.clientY - y0);
        if (dx < 6 && dy < 6) return;     // ainda não dá para saber
        decidido = true;
        meu = vertical ? (naAlca && dy > dx) : dx > dy;
        if (meu) { raiz.classList.add('is-arrastando'); usou(); }
      }
      if (!meu) return;
      posicionar(daPosicao(t.clientX, t.clientY));
      if (e.cancelable) e.preventDefault();   // segura a rolagem durante o gesto
    }, { passive: false });

    const fimDoToque = (e) => {
      const t = doToque(e);
      if (!t) return;
      // toque curto e parado = tocar para posicionar
      if (!decidido && Math.abs(t.clientX - x0) < 6 && Math.abs(t.clientY - y0) < 6) {
        posicionar(daPosicao(t.clientX, t.clientY));
        usou();
      }
      toqueId = null; meu = false; decidido = false; naAlca = false;
      raiz.classList.remove('is-arrastando');
    };
    raiz.addEventListener('touchend', fimDoToque);
    raiz.addEventListener('touchcancel', fimDoToque);

    // ao entrar em cena, a alça oscila uma vez — quem chega entende que arrasta
    if (!semMovimento && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting || jaMexeu) return;
          raiz.classList.add('is-convidando');
          obs.unobserve(e.target);
        });
      }, { threshold: 0.45 });
      obs.observe(raiz);
    }

    posicionar(50);
  };

  const comparador = () => $$('[data-comparador]').forEach(montarComparador);

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
  /** (11) 91234-5678 — formata conforme a pessoa digita, sem atrapalhar o apagar. */
  const formatarTelefone = (bruto) => {
    const d = soDigitos(bruto).slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const mascaraTelefone = (campo) => {
    if (!campo) return;
    campo.addEventListener('input', () => {
      const antes = campo.value;
      const fimDoCursor = campo.selectionStart === antes.length;
      const formatado = formatarTelefone(antes);
      if (formatado === antes) return;
      campo.value = formatado;
      // digitando no fim (o caso comum) o cursor acompanha; no meio, não o movemos
      if (fimDoCursor) campo.setSelectionRange(formatado.length, formatado.length);
    });
  };

  const formulario = () => {
    const form = $('[data-form]');
    if (!form) return;
    const status = $('[data-form-status]', form);
    mascaraTelefone(form.elements.telefone);

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
        erro('telefone', 'Informe DDD + número (ex.: 47988887777).'); valido = false;
      }
      if (!assunto) { erro('assunto', 'Escolha um assunto.'); valido = false; }
      if (!ok) { erro('consentimento', 'É preciso autorizar o contato.'); valido = false; }

      if (!valido) {
        if (status) { status.textContent = 'Confira os campos destacados.'; status.classList.remove('is-ok'); }
        $('.is-erro input, .is-erro select', form)?.focus();
        return;
      }

      // Cada assunto manda a sua frase; um assunto sem frase cai na genérica.
      const porAssunto = CFG.mensagensPorAssunto || {};
      const rotulo = $(`#f-assunto option[value="${assunto}"]`)?.textContent.trim() || assunto;
      const frase = porAssunto[assunto] || `Quero falar sobre: ${rotulo}.`;

      // O número não entra na mensagem: ela chega pelo próprio WhatsApp, então
      // repetir o telefone ali não diz nada a quem recebe.
      const texto = [
        `Olá, Dra. Consuelo! Sou ${nome}.`,
        frase,
        msg ? `Observação: ${msg}` : null,
        'Vim pelo site.',
      ].filter(Boolean).join('\n');

      const url = linkWhatsapp(texto);
      if (status) {
        status.innerHTML = 'Abrindo o WhatsApp… '
          + `<a href="${url}" target="_blank" rel="noopener">Não abriu? Toque aqui.</a>`;
        status.classList.add('is-ok');
      }
      abrirWhatsapp(url);
    });
  };

  /* -- 13. mapa -----------------------------------------------------------
     O endereço é o conteúdo garantido: ele é montado primeiro e fica visível
     mesmo que o mapa não carregue. O iframe entra acima, escondido, e só ocupa
     espaço quando confirma o carregamento — assim uma falha de rede, um
     bloqueio de terceiros ou um navegador restrito não deixam um buraco
     cinza no lugar da seção. */
  const mapa = () => {
    const slot = $('[data-mapa-slot]');
    if (!slot) return;
    const end = CFG.endereco || {};
    const src = end.mapaEmbed;

    /* O cartão não repete endereço nem horários: eles estão logo acima, nesta
       mesma seção. Repetir os dois era o que fazia a seção dizer tudo duas
       vezes. Ficam só as duas ações, que não existem em outro lugar. */
    slot.innerHTML = `
      <div class="mapa__tela" data-mapa-tela></div>
      <div class="mapa__acoes">
        ${end.rotaLink ? `<a class="btn btn--ouro" href="${end.rotaLink}" target="_blank" rel="noopener">Traçar rota</a>` : ''}
        ${end.mapaLink ? `<a class="btn btn--escuro" href="${end.mapaLink}" target="_blank" rel="noopener">Ver no Google Maps</a>` : ''}
      </div>`;

    if (!src) return;

    const tela = $('[data-mapa-tela]', slot);

    /* Antes de inserir o iframe eu carregava uma imagem de maps.gstatic.com
       como sonda de conectividade, e só entrava com o mapa se ela respondesse.
       Isso derrubava o mapa em três situações comuns: o caminho daquela imagem
       é de uma versão antiga da API do Maps e pode não existir mais; qualquer
       bloqueador de rastreadores barra o gstatic sem barrar o maps.google.com;
       e a sonda ainda forçava uma ida à rede a cada visita.

       A sonda existia porque o iframe dispara `load` mesmo em branco — mas
       aquilo vinha do endereço inválido (`ftid=…&output=embed`), já corrigido.
       Com um `q=…&output=embed` válido o `load` é confiável, então o mapa entra
       direto e aparece quando carrega. O endereço não depende disso: está
       escrito logo acima, nesta mesma seção. */
    const f = document.createElement('iframe');
    f.src = src;
    f.loading = 'lazy';
    f.title = `Mapa do consultório — ${end.linha1 || CFG.nome || ''}`;
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.setAttribute('allowfullscreen', '');

    let pronto = false;
    f.addEventListener('load', () => { pronto = true; tela.classList.add('is-pronta'); });
    tela.appendChild(f);

    // Nada carregou em 8s: tira a moldura vazia em vez de deixá-la na página.
    setTimeout(() => { if (!pronto) tela.remove(); }, 8000);
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
      $('a', nav)?.focus();
    });

    $$('a', nav).forEach((a) => a.addEventListener('click', fechar));

    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { fechar(); btn.focus(); return; }
      // menu aberto é um diálogo: o Tab circula dentro dele, não volta para a página
      if (e.key !== 'Tab' || !nav.classList.contains('is-aberto')) return;
      const foco = [btn, ...$$('a', nav)];
      const i = foco.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      const proximo = e.shiftKey
        ? foco[(i - 1 + foco.length) % foco.length]
        : foco[(i + 1) % foco.length];
      proximo.focus();
    });
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
    efeitosDeScroll();
    scrollspy();
    medidorMetodo();
    comparador();
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
