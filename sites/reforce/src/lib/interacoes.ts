// Interações da página em JavaScript puro (usadas pelo componente Interacoes e pela prévia em arquivo
// único). Cada função devolve a limpeza. Nada aqui é necessário para ler o conteúdo: sem JavaScript,
// o site mostra tudo (carrosséis com rolagem lateral, cronograma no estado "Nossa abordagem").
import { marca } from "@/content/site";

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

type Limpeza = () => void;

/** Rola a página até y. Com a rolagem suave ligada (lib/motion.ts), ela atende o pedido; senão, rola direto. */
export function rolarPagina(y: number) {
  const detalhe = { y, tratado: false };
  window.dispatchEvent(new CustomEvent("reforce:rolar", { detail: detalhe }));
  if (!detalhe.tratado) window.scrollTo({ top: y, behavior: "smooth" });
}

/** Troca o estado do cronograma (tradicional / reforce / resultado) e marca o passo correspondente. */
export function definirEstadoGantt(estado: string) {
  const gantt = document.querySelector<HTMLElement>("[data-gantt]");
  if (!gantt || gantt.dataset.estado === estado) return;
  gantt.dataset.estado = estado;
  $$("[data-estado-botao]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.estadoBotao === estado)));
}

export function iniciarGantt(): Limpeza {
  const botoes = $$("[data-estado-botao]");
  const clique = (e: Event) => definirEstadoGantt((e.currentTarget as HTMLElement).dataset.estadoBotao ?? "reforce");
  botoes.forEach((b) => b.addEventListener("click", clique));
  return () => botoes.forEach((b) => b.removeEventListener("click", clique));
}

// ---------- Carrosséis (setores e atuações) ----------
// No desktop com animação, lib/motion.ts fixa a seção e move o trilho com a rolagem da página; nesse modo
// ele grava data-pin-inicio, data-pin-fim e data-pin-progressos na seção, e as setas rolam a página.
// Sem isso, o trilho tem rolagem lateral própria (dedo, arrastar com o mouse, setas).

/** Marca o cartão ativo: botões de navegação, contador, barra e a classe is-ativo nos cartões. */
export function marcarSlide(carrossel: HTMLElement, indice: number) {
  const slides = $$("[data-slide]", carrossel);
  const i = Math.max(0, Math.min(slides.length - 1, indice));
  if (carrossel.dataset.indice === String(i)) return;
  carrossel.dataset.indice = String(i);
  slides.forEach((s, j) => s.classList.toggle("is-ativo", j === i));
  $$("[data-carrossel-ir]", carrossel).forEach((b) => {
    const ativo = Number(b.dataset.carrosselIr) === i;
    b.setAttribute("aria-current", String(ativo));
    // No celular os botões ficam numa fileira com rolagem lateral: traz o ativo para a vista.
    const fileira = b.parentElement;
    if (ativo && fileira && fileira.scrollWidth > fileira.clientWidth + 2)
      fileira.scrollTo({ left: b.offsetLeft - fileira.offsetLeft - 20, behavior: "smooth" });
  });
  $$("[data-carrossel-atual]", carrossel).forEach((el) => (el.textContent = String(i + 1).padStart(2, "0")));
  $$("[data-carrossel-barra]", carrossel).forEach((el) => (el.style.transform = `scaleX(${(i + 1) / slides.length})`));
  $$("[data-carrossel-passo]", carrossel).forEach((b) => {
    const passo = Number(b.dataset.carrosselPasso);
    (b as HTMLButtonElement).disabled = (passo < 0 && i === 0) || (passo > 0 && i === slides.length - 1);
  });
}

function irPara(carrossel: HTMLElement, indice: number) {
  const slides = $$("[data-slide]", carrossel);
  const i = Math.max(0, Math.min(slides.length - 1, indice));
  const inicio = Number(carrossel.dataset.pinInicio);
  const fim = Number(carrossel.dataset.pinFim);
  const progressos = (carrossel.dataset.pinProgressos ?? "").split(",").map(Number);
  if (carrossel.dataset.pinInicio && progressos.length === slides.length) {
    rolarPagina(inicio + (fim - inicio) * progressos[i] + 2);
    return;
  }
  const trilho = carrossel.querySelector<HTMLElement>("[data-carrossel-trilho]");
  if (!trilho) return;
  trilho.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: "smooth" });
  marcarSlide(carrossel, i);
}

export function iniciarCarrosseis(): Limpeza {
  const limpezas: Limpeza[] = [];
  $$("[data-carrossel]").forEach((carrossel) => {
    const trilho = carrossel.querySelector<HTMLElement>("[data-carrossel-trilho]");
    const slides = $$("[data-slide]", carrossel);
    if (!trilho || !slides.length) return;
    marcarSlide(carrossel, 0);

    const clique = (e: Event) => {
      const alvo = (e.target as Element).closest<HTMLElement>("[data-carrossel-ir], [data-carrossel-passo]");
      if (!alvo) return;
      const atual = Number(carrossel.dataset.indice ?? 0);
      if (alvo.dataset.carrosselIr !== undefined) irPara(carrossel, Number(alvo.dataset.carrosselIr));
      else irPara(carrossel, atual + Number(alvo.dataset.carrosselPasso));
    };
    // Setas do teclado nos botões de navegação.
    const tecla = (e: KeyboardEvent) => {
      if (!(e.target as Element).closest("[data-carrossel-ir]")) return;
      const atual = Number(carrossel.dataset.indice ?? 0);
      const mapa: Record<string, number> = { ArrowRight: atual + 1, ArrowDown: atual + 1, ArrowLeft: atual - 1, ArrowUp: atual - 1, Home: 0, End: slides.length - 1 };
      if (!(e.key in mapa)) return;
      e.preventDefault();
      const destino = Math.max(0, Math.min(slides.length - 1, mapa[e.key]));
      irPara(carrossel, destino);
      // Sem rolar até o botão: quem move a página é o carrossel.
      carrossel.querySelector<HTMLElement>(`[data-carrossel-ir="${destino}"]`)?.focus({ preventScroll: true });
    };
    // Rolagem lateral própria: o cartão mais perto da borda esquerda é o ativo.
    let agendado = false;
    const rolou = () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => {
        agendado = false;
        const x = trilho.scrollLeft;
        let melhor = 0;
        slides.forEach((s, j) => {
          if (Math.abs(s.offsetLeft - slides[0].offsetLeft - x) < Math.abs(slides[melhor].offsetLeft - slides[0].offsetLeft - x)) melhor = j;
        });
        if (x + trilho.clientWidth >= trilho.scrollWidth - 4) melhor = slides.length - 1;
        marcarSlide(carrossel, melhor);
      });
    };
    carrossel.addEventListener("click", clique);
    carrossel.addEventListener("keydown", tecla);
    trilho.addEventListener("scroll", rolou, { passive: true });
    limpezas.push(() => {
      carrossel.removeEventListener("click", clique);
      carrossel.removeEventListener("keydown", tecla);
      trilho.removeEventListener("scroll", rolou);
    });
  });
  return () => limpezas.forEach((f) => f());
}

/** Arrastar com o mouse os trilhos com rolagem lateral ([data-arrastar]). O toque já rola sozinho. */
export function iniciarArrastar(): Limpeza {
  const limpezas: Limpeza[] = [];
  $$("[data-arrastar]").forEach((trilho) => {
    let x0 = 0;
    let s0 = 0;
    let ativo = false;
    let moveu = false;
    const desce = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (getComputedStyle(trilho).overflowX === "visible") return; // trilho movido pela rolagem da página
      ativo = true;
      moveu = false;
      x0 = e.clientX;
      s0 = trilho.scrollLeft;
      trilho.style.scrollSnapType = "none";
      trilho.style.scrollBehavior = "auto";
    };
    const move = (e: PointerEvent) => {
      if (!ativo) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 6) moveu = true;
      if (moveu) {
        e.preventDefault();
        trilho.scrollLeft = s0 - dx;
        trilho.dataset.arrastando = "true";
      }
    };
    const sobe = () => {
      if (!ativo) return;
      ativo = false;
      trilho.style.scrollSnapType = "";
      trilho.style.scrollBehavior = "";
      delete trilho.dataset.arrastando;
    };
    // Depois de arrastar, o clique que vem junto não abre foto nem troca de cartão.
    const clique = (e: MouseEvent) => {
      if (!moveu) return;
      e.preventDefault();
      e.stopPropagation();
      moveu = false;
    };
    trilho.addEventListener("pointerdown", desce);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", sobe);
    trilho.addEventListener("click", clique, true);
    trilho.addEventListener("dragstart", (e) => e.preventDefault());
    limpezas.push(() => {
      trilho.removeEventListener("pointerdown", desce);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", sobe);
      trilho.removeEventListener("click", clique, true);
    });
  });
  return () => limpezas.forEach((f) => f());
}

/** Filtro da equipe por área. */
export function iniciarFiltroEquipe(): Limpeza {
  const raiz = document.querySelector("[data-equipe]");
  if (!raiz) return () => {};
  const botoes = $$<HTMLButtonElement>("[data-filtro]", raiz);
  const pessoas = $$<HTMLElement>("[data-area]", raiz);
  const clique = (e: Event) => {
    const area = (e.currentTarget as HTMLElement).dataset.filtro;
    botoes.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filtro === area)));
    pessoas.forEach((p) => (p.hidden = area !== "todos" && p.dataset.area !== area));
    window.dispatchEvent(new Event("reforce:layout"));
  };
  botoes.forEach((b) => b.addEventListener("click", clique));
  return () => botoes.forEach((b) => b.removeEventListener("click", clique));
}

/** Botões que abrem um <dialog> (fotos e painéis ampliados). Clique fora fecha. */
export function iniciarVisores(): Limpeza {
  const abrir = (e: Event) => {
    const id = (e.currentTarget as HTMLElement).dataset.abreVisor;
    const d = id ? document.getElementById(id) : null;
    if (d instanceof HTMLDialogElement) d.showModal();
  };
  const fora = (e: MouseEvent) => {
    const d = e.currentTarget as HTMLDialogElement;
    if (e.target === d) d.close();
  };
  const botoes = $$("[data-abre-visor]");
  const visores = $$<HTMLDialogElement>("dialog.visor");
  botoes.forEach((b) => b.addEventListener("click", abrir));
  visores.forEach((d) => d.addEventListener("click", fora));
  return () => {
    botoes.forEach((b) => b.removeEventListener("click", abrir));
    visores.forEach((d) => d.removeEventListener("click", fora));
  };
}

/** Luz que segue o mouse nos cartões .lanterna e moldura que inclina em [data-inclina]. */
export function iniciarEfeitosMouse(): Limpeza {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {};
  const mover = (e: PointerEvent) => {
    const el = (e.target as Element).closest<HTMLElement>(".lanterna");
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  document.addEventListener("pointermove", mover, { passive: true });

  const limpezasInclina: Limpeza[] = [];
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$("[data-inclina]").forEach((caixa) => {
      const alvo = caixa.querySelector<HTMLElement>("[data-inclina-alvo]");
      if (!alvo) return;
      const mov = (e: PointerEvent) => {
        const r = caixa.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        alvo.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 6}deg)`;
      };
      const sai = () => (alvo.style.transform = "");
      caixa.addEventListener("pointermove", mov);
      caixa.addEventListener("pointerleave", sai);
      limpezasInclina.push(() => {
        caixa.removeEventListener("pointermove", mov);
        caixa.removeEventListener("pointerleave", sai);
      });
    });
  }
  return () => {
    document.removeEventListener("pointermove", mover);
    limpezasInclina.forEach((f) => f());
  };
}

/** Mapa: passar o mouse (ou focar) num estado da lista acende o estado no mapa, e vice-versa. */
export function iniciarMapa(): Limpeza {
  const botoes = $$("[data-estado-mapa]");
  const caminhos = $$<SVGPathElement>("path[data-uf][data-ativo]");
  const marcar = (uf: string | null) => {
    caminhos.forEach((p) => (p.dataset.foco = String(p.dataset.uf === uf)));
    botoes.forEach((b) => b.classList.toggle("!border-laranja", b.dataset.estadoMapa === uf));
  };
  const entra = (e: Event) => {
    const el = e.currentTarget as HTMLElement | SVGElement;
    marcar(el.dataset.estadoMapa ?? el.dataset.uf ?? null);
  };
  const sai = () => marcar(null);
  const alvos: (HTMLElement | SVGElement)[] = [...botoes, ...caminhos];
  alvos.forEach((a) => {
    a.addEventListener("pointerenter", entra);
    a.addEventListener("pointerleave", sai);
    a.addEventListener("focus", entra);
    a.addEventListener("blur", sai);
  });
  return () =>
    alvos.forEach((a) => {
      a.removeEventListener("pointerenter", entra);
      a.removeEventListener("pointerleave", sai);
      a.removeEventListener("focus", entra);
      a.removeEventListener("blur", sai);
    });
}

/** Formulário de diagnóstico: mede o progresso, mostra a mensagem e envia por WhatsApp ou e-mail. */
export function iniciarDiagnostico(): Limpeza {
  const form = document.querySelector<HTMLFormElement>("[data-diagnostico]");
  if (!form) return () => {};
  const barra = form.querySelector<HTMLElement>("[data-form-barra]");
  const passos = form.querySelector<HTMLElement>("[data-form-passos]");
  const previa = form.querySelector<HTMLElement>("[data-form-previa]");
  const aviso = form.querySelector<HTMLElement>("[data-form-aviso]");
  const campo = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null)?.value.trim() ?? "";

  const montar = () => {
    const demandas = $$<HTMLInputElement>('input[name="demanda"]:checked', form).map((i) => i.value);
    const linhas = [
      "Olá, Reforce! Vim pelo site e quero conversar sobre um projeto.",
      "",
      `Nome: ${campo("nome") || "—"}`,
      `Empresa: ${campo("empresa") || "—"}`,
      campo("cargo") ? `Cargo: ${campo("cargo")}` : null,
      `E-mail: ${campo("email") || "—"}`,
      "",
      `Preciso de: ${demandas.length ? demandas.join(", ") : "—"}`,
      `Segmento: ${campo("segmento") || "—"}`,
      `Momento do projeto: ${campo("momento") || "—"}`,
      campo("mensagem") ? `\nDesafio: ${campo("mensagem")}` : null,
    ].filter((l) => l !== null);
    return { texto: linhas.join("\n"), demandas };
  };

  const atualizar = () => {
    const { texto, demandas } = montar();
    const respondidas = [demandas.length > 0, Boolean(campo("segmento")), Boolean(campo("momento"))].filter(Boolean).length;
    if (barra) barra.style.transform = `scaleX(${respondidas / 3})`;
    if (passos) passos.textContent = String(respondidas);
    if (previa) previa.textContent = texto;
  };

  // aria-invalid acompanha o :user-invalid (o CSS mostra o erro só depois da interação).
  const campos = $$<HTMLInputElement>("input[data-error]", form);
  const sincronizar = (input: HTMLInputElement) => {
    const invalido = input.matches(":user-invalid");
    input.setAttribute("aria-invalid", String(invalido));
    const desc = input.dataset.error;
    if (desc) {
      if (invalido) input.setAttribute("aria-describedby", desc);
      else input.removeAttribute("aria-describedby");
    }
  };
  campos.forEach((c) => c.setAttribute("aria-invalid", "false"));
  const aoSair = (e: Event) => sincronizar(e.target as HTMLInputElement);
  campos.forEach((c) => {
    c.addEventListener("blur", aoSair);
    c.addEventListener("input", aoSair);
  });

  const enviar = (e: SubmitEvent) => {
    e.preventDefault();
    campos.forEach(sincronizar);
    if (!form.checkValidity()) {
      form.querySelector<HTMLInputElement>(":invalid")?.focus();
      if (aviso) aviso.textContent = "Revise os campos destacados antes de enviar.";
      campos.forEach(sincronizar);
      return;
    }
    const canal = (e.submitter as HTMLElement | null)?.dataset.enviar ?? "whatsapp";
    const { texto } = montar();
    if (canal === "email") {
      const assunto = `Contato pelo site: ${campo("empresa")}`;
      window.location.href = `mailto:${marca.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`;
    } else {
      window.open(`https://wa.me/${marca.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    }
    if (aviso) aviso.textContent = canal === "email" ? "Abrindo o seu e-mail com a mensagem pronta." : "Abrindo o WhatsApp com a mensagem pronta.";
  };

  form.addEventListener("input", atualizar);
  form.addEventListener("change", atualizar);
  form.addEventListener("submit", enviar);
  atualizar();
  return () => {
    form.removeEventListener("input", atualizar);
    form.removeEventListener("change", atualizar);
    form.removeEventListener("submit", enviar);
    campos.forEach((c) => {
      c.removeEventListener("blur", aoSair);
      c.removeEventListener("input", aoSair);
    });
  };
}

/** Liga todas as interações. */
export function iniciarInteracoes(): Limpeza {
  const limpezas = [
    iniciarGantt(),
    iniciarCarrosseis(),
    iniciarArrastar(),
    iniciarFiltroEquipe(),
    iniciarVisores(),
    iniciarEfeitosMouse(),
    iniciarMapa(),
    iniciarDiagnostico(),
  ];
  return () => limpezas.forEach((f) => f());
}
