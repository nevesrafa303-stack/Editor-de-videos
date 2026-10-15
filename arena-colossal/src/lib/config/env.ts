import 'server-only';

/**
 * Leitura centralizada das variaveis de ambiente do SERVIDOR.
 *
 * Nenhum valor daqui pode vazar para o bundle do cliente — o import de
 * `server-only` garante erro de build caso algum componente de cliente tente
 * importar este modulo.
 *
 * O projeto foi desenhado para subir com integracoes desligadas: em vez de
 * lancar erro quando falta credencial, expomos flags `isConfigured` e cada
 * servico decide o que fazer (normalmente: registrar a notificacao como
 * `skipped` sem derrubar o agendamento).
 */

function str(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function int(name: string, fallback: number): number {
  const raw = str(name);
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function list(name: string): string[] {
  const raw = str(name);
  if (raw === null) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/** Janela de atendimento de um dia da semana, em minutos desde a meia-noite. */
export type BusinessHoursWindow = {
  /** 0 = domingo ... 6 = sabado */
  weekday: number;
  openMinutes: number;
  closeMinutes: number;
};

/**
 * Converte `1:08:00-18:00,6:08:00-12:00` na lista de janelas.
 * Entradas malformadas sao ignoradas em vez de derrubar o processo: um erro de
 * digitacao no painel da hospedagem nao pode tirar o site do ar.
 */
function parseBusinessHours(raw: string[]): BusinessHoursWindow[] {
  const windows: BusinessHoursWindow[] = [];

  for (const entry of raw) {
    const match = /^([0-6]):(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(entry);
    if (!match) continue;

    const [, weekday, openHour, openMinute, closeHour, closeMinute] = match as unknown as string[];
    const openMinutes = Number(openHour) * 60 + Number(openMinute);
    const closeMinutes = Number(closeHour) * 60 + Number(closeMinute);
    if (closeMinutes <= openMinutes) continue;

    windows.push({ weekday: Number(weekday), openMinutes, closeMinutes });
  }

  return windows;
}

const googleCalendar = {
  calendarId: str('GOOGLE_CALENDAR_ID'),
  clientId: str('GOOGLE_CLIENT_ID'),
  clientSecret: str('GOOGLE_CLIENT_SECRET'),
  refreshToken: str('GOOGLE_REFRESH_TOKEN'),
};

const email = {
  apiKey: str('RESEND_API_KEY'),
  from: str('EMAIL_FROM'),
  internalTo: str('EMAIL_TO_INTERNAL'),
};

const whatsapp = {
  accessToken: str('WHATSAPP_ACCESS_TOKEN'),
  phoneNumberId: str('WHATSAPP_PHONE_NUMBER_ID'),
  notifyTo: str('WHATSAPP_NOTIFY_TO'),
  templateName: str('WHATSAPP_TEMPLATE_NAME'),
  templateLang: str('WHATSAPP_TEMPLATE_LANG') ?? 'pt_BR',
};

const businessHours = parseBusinessHours(list('BOOKING_HOURS'));

export const serverEnv = {
  databaseUrl: str('DATABASE_URL'),

  booking: {
    timezone: str('BOOKING_TIMEZONE') ?? 'America/Sao_Paulo',
    slotMinutes: Math.max(5, int('BOOKING_SLOT_MINUTES', 30)),
    minNoticeHours: Math.max(0, int('BOOKING_MIN_NOTICE_HOURS', 12)),
    maxAdvanceDays: Math.max(1, int('BOOKING_MAX_ADVANCE_DAYS', 60)),
    concurrency: Math.max(1, int('BOOKING_CONCURRENCY', 1)),
    blackoutDates: list('BOOKING_BLACKOUT_DATES'),
    businessHours,
  },

  googleCalendar,
  email,
  whatsapp,

  turnstile: {
    secretKey: str('TURNSTILE_SECRET_KEY'),
  },

  rateLimit: {
    bookingsPerHour: Math.max(1, int('RATE_LIMIT_BOOKINGS_PER_HOUR', 5)),
  },
} as const;

/** Quais integracoes estao realmente utilizaveis neste ambiente. */
export const features = {
  /** Sem DATABASE_URL o repositorio em memoria assume (dev apenas). */
  database: serverEnv.databaseUrl !== null,
  calendar:
    googleCalendar.calendarId !== null &&
    googleCalendar.clientId !== null &&
    googleCalendar.clientSecret !== null &&
    googleCalendar.refreshToken !== null,
  email: email.apiKey !== null && email.from !== null,
  whatsapp:
    whatsapp.accessToken !== null &&
    whatsapp.phoneNumberId !== null &&
    whatsapp.notifyTo !== null,
  turnstile: serverEnv.turnstile.secretKey !== null,
  /** Sem horario configurado nao existe grade: o agendamento avisa o cliente. */
  businessHours: businessHours.length > 0,
} as const;

export type FeatureName = keyof typeof features;
