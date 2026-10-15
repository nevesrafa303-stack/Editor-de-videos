/**
 * Conversoes entre "horario de parede" da Arena e instantes UTC.
 *
 * O agendamento inteiro raciocina em horario local da operacao
 * (`BOOKING_TIMEZONE`), mas tudo que e' persistido, comparado ou enviado para o
 * Google Calendar precisa ser UTC. Estas funcoes sao a unica fronteira entre os
 * dois mundos.
 *
 * Implementado sobre `Intl` em vez de uma lib de datas: e' exato (le o banco de
 * fusos do proprio runtime, incluindo mudancas de horario de verao) e nao
 * adiciona dependencia ao bundle do servidor.
 */

const partsFormatter = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatter.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsFormatter.set(timeZone, formatter);
  }
  return formatter;
}

function readParts(date: Date, timeZone: string) {
  const parts = getFormatter(timeZone).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    // Meia-noite e' formatada como "24" por alguns runtimes.
    hour: read('hour') % 24,
    minute: read('minute'),
    second: read('second'),
  };
}

/** Offset do fuso, em ms, valido para o instante informado. */
function offsetMs(date: Date, timeZone: string): number {
  const { year, month, day, hour, minute, second } = readParts(date, timeZone);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  // `date` pode carregar milissegundos; o offset ignora essa fracao.
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Converte data civil + minutos desde a meia-noite (no fuso informado) no
 * instante UTC correspondente.
 *
 * A dupla passagem resolve viradas de horario de verao: o primeiro palpite usa
 * o offset "errado", o segundo ja usa o offset valido no instante correto.
 */
export function zonedToUtc(
  isoDate: string,
  minutesFromMidnight: number,
  timeZone: string,
): Date {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const naive = Date.UTC(year, month - 1, day) + minutesFromMidnight * 60_000;

  const firstGuess = naive - offsetMs(new Date(naive), timeZone);
  const corrected = naive - offsetMs(new Date(firstGuess), timeZone);

  return new Date(corrected);
}

/** Data civil (`YYYY-MM-DD`) do instante, no fuso informado. */
export function utcToIsoDate(date: Date, timeZone: string): string {
  const { year, month, day } = readParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Minutos desde a meia-noite local. */
export function utcToMinutes(date: Date, timeZone: string): number {
  const { hour, minute } = readParts(date, timeZone);
  return hour * 60 + minute;
}

/** Dia da semana da data civil (0 = domingo). Independe de fuso. */
export function isoDateWeekday(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** `YYYY-MM-DD` + N dias. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

/** `480` -> `"08:00"`. */
export function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** `"08:00"` -> `480`, ou `null` se o formato nao bater. */
export function labelToMinutes(label: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(label);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Data civil de hoje no fuso da operacao. */
export function todayIsoDate(timeZone: string): string {
  return utcToIsoDate(new Date(), timeZone);
}
