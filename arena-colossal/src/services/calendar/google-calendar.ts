import 'server-only';

import { serverEnv } from '@/lib/config/env';

/**
 * Cliente minimo da Google Calendar API v3.
 *
 * Por que REST puro em vez da `googleapis`: precisamos de exatamente tres
 * chamadas (token, freeBusy, events.insert). A lib oficial traria dezenas de
 * megabytes de superficie para isso.
 *
 * SEGURANCA: este arquivo so roda no servidor (`server-only`). O
 * `GOOGLE_CLIENT_SECRET` e o refresh token nunca cruzam a fronteira do cliente
 * — o navegador conversa apenas com `/api/availability` e `/api/bookings`.
 */

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/** Token de acesso vive ~1h; guardamos com folga de 60s. */
let cachedToken: { value: string; expiresAt: number } | null = null;

export class CalendarError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = serverEnv.googleCalendar;

  if (clientId === null || clientSecret === null || refreshToken === null) {
    throw new CalendarError('Credenciais do Google Calendar ausentes.');
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new CalendarError(
      `Falha ao renovar o token do Google (${response.status}). Verifique GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN.`,
    );
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (typeof data.access_token !== 'string') {
    throw new CalendarError('Resposta de token do Google sem access_token.');
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return cachedToken.value;
}

async function calendarFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await getAccessToken();

  return fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
}

/** Intervalos ocupados no calendario da Arena, dentro da janela consultada. */
export async function fetchBusyIntervals(
  from: Date,
  to: Date,
): Promise<{ start: Date; end: Date }[]> {
  const calendarId = serverEnv.googleCalendar.calendarId;
  if (calendarId === null) throw new CalendarError('GOOGLE_CALENDAR_ID ausente.');

  const response = await calendarFetch('/freeBusy', {
    method: 'POST',
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      timeZone: 'UTC',
      items: [{ id: calendarId }],
    }),
  });

  if (!response.ok) {
    throw new CalendarError(`freeBusy respondeu ${response.status}.`);
  }

  const data = (await response.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }>;
  };

  const calendar = data.calendars?.[calendarId];
  if (calendar?.errors && calendar.errors.length > 0) {
    throw new CalendarError('O Google recusou a consulta a este calendário. Confira o GOOGLE_CALENDAR_ID e o compartilhamento.');
  }

  return (calendar?.busy ?? []).map((slot) => ({
    start: new Date(slot.start),
    end: new Date(slot.end),
  }));
}

export type CalendarEventInput = {
  summary: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
  /** Chave de idempotencia: reenvio do mesmo agendamento nao duplica evento. */
  requestId: string;
};

/** Cria o evento e devolve o ID do Google. */
export async function createCalendarEvent(input: CalendarEventInput): Promise<string> {
  const calendarId = serverEnv.googleCalendar.calendarId;
  if (calendarId === null) throw new CalendarError('GOOGLE_CALENDAR_ID ausente.');

  const response = await calendarFetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startsAt.toISOString(), timeZone: input.timeZone },
      end: { dateTime: input.endsAt.toISOString(), timeZone: input.timeZone },
      // A Arena e' notificada por WhatsApp/e-mail; o lembrete padrao basta aqui.
      reminders: { useDefault: true },
      extendedProperties: { private: { arenaBookingId: input.requestId } },
    }),
  });

  if (!response.ok) {
    throw new CalendarError(`Falha ao criar evento no Google Calendar (${response.status}).`);
  }

  const data = (await response.json()) as { id?: string };
  if (typeof data.id !== 'string') {
    throw new CalendarError('Evento criado sem ID retornado.');
  }

  return data.id;
}
