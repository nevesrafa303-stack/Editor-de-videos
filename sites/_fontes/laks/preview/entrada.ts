// Script da prévia em arquivo único (sem servidor, sem React). As animações e as regras do formulário
// são as mesmas do site (src/lib/motion.ts e src/lib/lead.ts); aqui só ficam as interações que no site
// o React faz: cabeçalho, menu, vídeos e formulário (que na prévia não envia nada).
import { formatarWhatsapp, leadQualificado, type LeadErros, validarLead } from "../../../laks/src/lib/lead";
import { iniciarAnimacoes, iniciarRolagemSuave } from "../../../laks/src/lib/motion";

declare global {
  interface Window {
    __LAKS_VIDEOS__?: Record<string, string>;
  }
}

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

function cabecalho() {
  const header = $("header");
  if (!header) return;
  const fixo = ["border-white/[0.07]", "bg-ink/75", "backdrop-blur-xl"];
  const menuBtn = $<HTMLButtonElement>('[aria-controls="menu-mobile"]');
  const menu = $<HTMLElement>("#menu-mobile");
  let aberto = false;
  const pintar = () => {
    const ativo = window.scrollY > 24 || aberto;
    header.classList.toggle("border-transparent", !ativo);
    fixo.forEach((c) => header.classList.toggle(c, ativo));
  };
  const linhas = menuBtn ? $$("span span", menuBtn) : [];
  const alternar = (v: boolean) => {
    aberto = v;
    if (menu) menu.hidden = !v;
    menuBtn?.setAttribute("aria-expanded", String(v));
    menuBtn?.setAttribute("aria-label", v ? "Fechar menu" : "Abrir menu");
    linhas[0]?.classList.toggle("translate-y-[5px]", v);
    linhas[0]?.classList.toggle("rotate-45", v);
    linhas[1]?.classList.toggle("-translate-y-[5px]", v);
    linhas[1]?.classList.toggle("-rotate-45", v);
    pintar();
  };
  menuBtn?.addEventListener("click", () => alternar(!aberto));
  menu?.addEventListener("click", (e) => (e.target as Element).closest("a") && alternar(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && alternar(false));
  window.addEventListener("scroll", pintar, { passive: true });
  pintar();
}

function videos() {
  const fontes = window.__LAKS_VIDEOS__ ?? {};
  $$<HTMLButtonElement>("figure button").forEach((btn) => {
    const id = btn.dataset.video;
    if (!id || !fontes[id]) return;
    btn.addEventListener("click", () => {
      const v = document.createElement("video");
      v.src = fontes[id];
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.className = "size-full object-cover";
      v.addEventListener("play", () => $$<HTMLVideoElement>("figure video").forEach((o) => o !== v && o.pause()));
      btn.replaceWith(v);
    });
  });
}

function formulario() {
  const form = $<HTMLFormElement>("#forms form");
  if (!form) return;
  const whats = $<HTMLInputElement>("#f-whatsapp", form);
  whats?.addEventListener("input", () => (whats.value = formatarWhatsapp(whats.value)));
  const status = $<HTMLElement>('[role="status"]', form);

  const mostrarErros = (erros: LeadErros) => {
    $$("[data-erro]", form).forEach((p) => p.remove());
    $$<HTMLInputElement | HTMLSelectElement>("input[name], select[name]", form).forEach((campo) => {
      const erro = erros[campo.name as keyof LeadErros];
      campo.toggleAttribute("aria-invalid", Boolean(erro));
      campo.classList.toggle("border-laranja", Boolean(erro));
      campo.classList.toggle("border-white/10", !erro);
      if (!erro) return campo.removeAttribute("aria-describedby");
      const p = document.createElement("p");
      p.id = `f-${campo.name}-erro`;
      p.dataset.erro = "";
      p.className = "text-sm text-laranja-claro";
      p.textContent = erro;
      campo.setAttribute("aria-describedby", p.id);
      campo.closest(".flex.flex-col")?.append(p);
    });
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const { lead, erros } = validarLead(dados);
    mostrarErros(erros);
    if (!lead) {
      $<HTMLElement>(`#f-${Object.keys(erros)[0]}`, form)?.focus();
      return;
    }
    if (status) {
      status.className = "rounded-xl border border-laranja/40 bg-laranja/10 p-4 text-sm text-fog";
      status.textContent = `Prévia: formulário válido. No site publicado, o lead vai para o CRM e a pessoa segue para ${
        leadQualificado(lead) ? "/obrigado2 (qualificado)" : "/obrigado1 (faturamento abaixo de R$ 10 mil)"
      }.`;
    }
  });
}

function avisoLinks() {
  $$<HTMLAnchorElement>('a[data-previa-link]').forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      window.alert("Na prévia, esta página não está incluída. No site publicado ela abre normalmente.");
    }),
  );
}

cabecalho();
videos();
formulario();
avisoLinks();
iniciarRolagemSuave();
iniciarAnimacoes();
