// Eventos para o GTM. Nada aqui envia dados por conta própria: o GTM decide o que fazer com eles,
// e as tags de mídia só rodam com consentimento (Consent Mode v2).

type DataLayerEvent = Record<string, unknown> & { event: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params } satisfies DataLayerEvent);
}

export const CONSENT_KEY = "rise-consentimento";
export const CONSENT_OPEN_EVENT = "rise:abrir-consentimento";

export type Consentimento = "aceito" | "recusado";

export function lerConsentimento(): Consentimento | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "aceito" || v === "recusado" ? v : null;
  } catch {
    return null;
  }
}

export function salvarConsentimento(v: Consentimento) {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* navegação privada: vale só para esta visita */
  }
}

const RASTREIO_KEY = "rise-rastreio";

// Guarda UTMs e click IDs da primeira página vista na sessão, para repassar no link da aplicação.
export function guardarRastreio(chaves: readonly string[]) {
  try {
    if (sessionStorage.getItem(RASTREIO_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const dados = Object.fromEntries(chaves.map((k) => [k, params.get(k) ?? ""]).filter(([, v]) => v));
    sessionStorage.setItem(
      RASTREIO_KEY,
      JSON.stringify({ ...dados, _pagina: window.location.href, _referrer: document.referrer }),
    );
  } catch {
    /* sem storage: segue sem rastreio */
  }
}

export function lerRastreio(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(RASTREIO_KEY) || "{}");
  } catch {
    return {};
  }
}
