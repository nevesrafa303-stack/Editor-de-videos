// Interações da página em JavaScript puro (usadas pelo componente Interacoes e pela prévia em arquivo
// único). Cada função devolve a limpeza. Nada aqui é necessário para ler o conteúdo: sem JavaScript,
// o site mostra tudo (abas abertas, cronograma no estado "Nossa abordagem", equipe completa).
import { marca } from "@/content/site";

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

type Limpeza = () => void;

/** Abas acessíveis: clique, setas do teclado, Home e End. Vale para todo [data-abas]. */
export function iniciarAbas(): Limpeza {
  const limpezas: Limpeza[] = [];
  $$("[data-abas]").forEach((grupo) => {
    const abas = $$<HTMLButtonElement>('[role="tab"]', grupo);
    const selecionar = (alvo: HTMLButtonElement, focar = false) => {
      abas.forEach((aba) => {
        const ativa = aba === alvo;
        aba.setAttribute("aria-selected", String(ativa));
        aba.tabIndex = ativa ? 0 : -1;
        const painel = document.getElementById(aba.getAttribute("aria-controls") ?? "");
        if (painel) painel.hidden = !ativa;
      });
      if (focar) alvo.focus();
    };
    const clique = (e: Event) => {
      const aba = (e.target as Element).closest<HTMLButtonElement>('[role="tab"]');
      if (aba && abas.includes(aba)) selecionar(aba);
    };
    const tecla = (e: KeyboardEvent) => {
      const atual = abas.indexOf(document.activeElement as HTMLButtonElement);
      if (atual < 0) return;
      const mapa: Record<string, number> = {
        ArrowDown: atual + 1,
        ArrowRight: atual + 1,
        ArrowUp: atual - 1,
        ArrowLeft: atual - 1,
        Home: 0,
        End: abas.length - 1,
      };
      if (!(e.key in mapa)) return;
      e.preventDefault();
      selecionar(abas[(mapa[e.key] + abas.length) % abas.length], true);
    };
    grupo.addEventListener("click", clique);
    grupo.addEventListener("keydown", tecla);
    limpezas.push(() => {
      grupo.removeEventListener("click", clique);
      grupo.removeEventListener("keydown", tecla);
    });
  });
  return () => limpezas.forEach((f) => f());
}

/** Troca o estado do cronograma (tradicional / reforce / resultado) e marca o botão correspondente. */
export function definirEstadoGantt(estado: string) {
  const gantt = document.querySelector<HTMLElement>("[data-gantt]");
  if (!gantt || gantt.dataset.estado === estado) return;
  gantt.dataset.estado = estado;
  $$("[data-estado-botao]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.estadoBotao === estado)));
}

export function iniciarGantt(): Limpeza {
  const botoes = $$("[data-estado-botao]");
  const clique = (e: Event) => {
    const b = e.currentTarget as HTMLElement;
    definirEstadoGantt(b.dataset.estadoBotao ?? "reforce");
    // No desktop a rolagem também troca o estado: o clique "trava" a escolha até a próxima seção.
    document.querySelector<HTMLElement>("[data-abordagem]")?.setAttribute("data-manual", "true");
  };
  botoes.forEach((b) => b.addEventListener("click", clique));
  return () => botoes.forEach((b) => b.removeEventListener("click", clique));
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

  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const limpezasInclina: Limpeza[] = [];
  if (!reduzir) {
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
  const entra = (e: Event) => marcar((e.currentTarget as HTMLElement | SVGElement).dataset.estadoMapa ?? (e.currentTarget as SVGElement).dataset.uf ?? null);
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
      const primeiro = form.querySelector<HTMLInputElement>(":invalid");
      primeiro?.focus();
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
  // Sem JavaScript o cronograma mostra "Nossa abordagem"; com ele, começa no modelo tradicional
  // para a comparação acontecer na frente da pessoa.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) definirEstadoGantt("tradicional");
  const limpezas = [
    iniciarAbas(),
    iniciarGantt(),
    iniciarFiltroEquipe(),
    iniciarVisores(),
    iniciarEfeitosMouse(),
    iniciarMapa(),
    iniciarDiagnostico(),
  ];
  return () => limpezas.forEach((f) => f());
}

