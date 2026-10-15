/**
 * Formatacao de exibicao. Modulo puro — usado no servidor e no cliente.
 *
 * Datas civis (`YYYY-MM-DD`) sao formatadas como UTC de proposito: elas ja sao
 * "a data da Arena", entao nao devem ser reinterpretadas no fuso do navegador
 * do visitante (um cliente acessando de outro fuso veria o dia anterior).
 */

const longDate = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

const weekdayShort = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  timeZone: 'UTC',
});

function civilDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day));
}

/** `2026-03-12` -> `quinta-feira, 12 de março de 2026`. */
export function formatIsoDateLong(isoDate: string): string {
  return longDate.format(civilDate(isoDate));
}

/** `2026-03-12` -> `12 de mar.`. */
export function formatIsoDateShort(isoDate: string): string {
  return shortDate.format(civilDate(isoDate));
}

/** `2026-03-12` -> `qui.`. */
export function formatIsoWeekdayShort(isoDate: string): string {
  return weekdayShort.format(civilDate(isoDate));
}

/** `2026-03-12` -> `12`. */
export function formatIsoDayNumber(isoDate: string): string {
  return isoDate.slice(8, 10);
}

/** Mantem apenas digitos — normalizacao de telefone. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Mascara brasileira progressiva para o campo de WhatsApp.
 * Aceita digitacao parcial sem "brigar" com o usuario.
 */
export function maskPhoneBR(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Converte o telefone digitado para E.164 com DDI do Brasil.
 * Devolve `null` quando o numero nao tem DDD + 8/9 digitos.
 */
export function toE164BR(value: string): string | null {
  let digits = digitsOnly(value);

  if (digits.startsWith('55') && digits.length >= 12) digits = digits.slice(2);
  if (digits.length < 10 || digits.length > 11) return null;

  return `55${digits}`;
}

/** `5547999999999` -> `+55 (47) 99999-9999`. */
export function formatE164BR(value: string): string {
  const digits = digitsOnly(value);
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  return `+55 ${maskPhoneBR(local)}`;
}

/** `90` -> `1h30`; `45` -> `45 min`. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h${String(rest).padStart(2, '0')}`;
}
