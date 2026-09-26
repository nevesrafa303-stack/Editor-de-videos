/**
 * Camada unica de analytics.
 *
 * Nenhum componente chama gtag/fbq/dataLayer direto: todos passam por `track`.
 * Isso mantem o nome dos eventos consistente (o funil so e' legivel se o nome
 * for estavel) e permite trocar de ferramenta sem varrer o codebase.
 *
 * Quando nenhum ID esta configurado, `track` vira no-op silencioso.
 */

export type AnalyticsEvent =
  | 'page_view'
  | 'view_service'
  | 'click_whatsapp'
  | 'start_booking'
  | 'select_service'
  | 'select_date'
  | 'select_time'
  | 'booking_submitted'
  | 'booking_confirmed'
  | 'booking_failed';

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type WindowWithAnalytics = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

/** Eventos do funil que tambem interessam ao Meta Pixel. */
const META_PIXEL_MAP: Partial<Record<AnalyticsEvent, string>> = {
  start_booking: 'InitiateCheckout',
  booking_submitted: 'Lead',
  booking_confirmed: 'Schedule',
  click_whatsapp: 'Contact',
};

export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  if (typeof window === 'undefined') return;

  const win = window as WindowWithAnalytics;
  const params = { ...payload, event_category: 'arena_colossal' };

  // GTM (e qualquer consumidor do dataLayer).
  win.dataLayer?.push({ event, ...params });

  // GA4 direto, para quem nao usa GTM.
  win.gtag?.('event', event, params);

  const metaEvent = META_PIXEL_MAP[event];
  if (metaEvent) {
    win.fbq?.('track', metaEvent, payload);
  }
}
