/**
 * Formatação pt-BR. Um lugar só, para a tela não inventar variações.
 *
 * Toda função de data exige o fuso da clínica. Não há valor padrão de
 * propósito: `timestamptz` guarda o instante, e o instante só vira "14:00"
 * depois de escolher um fuso. O do servidor é o único que com certeza está
 * errado — em produção ele é UTC, e a consulta das 14:00 aparecia às 17:00.
 */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** `Intl.DateTimeFormat` é caro de construir; um por fuso basta. */
const cacheData = new Map<string, Intl.DateTimeFormat>();
const cacheHora = new Map<string, Intl.DateTimeFormat>();
const cachePartes = new Map<string, Intl.DateTimeFormat>();

function fmtData(timeZone: string): Intl.DateTimeFormat {
  let f = cacheData.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone,
    });
    cacheData.set(timeZone, f);
  }
  return f;
}

function fmtHora(timeZone: string): Intl.DateTimeFormat {
  let f = cacheHora.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    });
    cacheHora.set(timeZone, f);
  }
  return f;
}

/** `YYYY-MM-DD` do instante no fuso pedido. `sv-SE` já é ISO. */
export function diaLocal(date: Date, timeZone: string): string {
  let f = cachePartes.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    });
    cachePartes.set(timeZone, f);
  }
  return f.format(date);
}

export const formatBRL = (cents: number): string => BRL.format(cents / 100);

export const formatDateTime = (date: Date, timeZone: string): string =>
  `${fmtData(timeZone).format(date)} ${fmtHora(timeZone).format(date)}`;

export const formatTime = (date: Date, timeZone: string): string =>
  fmtHora(timeZone).format(date);

/** Data vinda do banco como 'YYYY-MM-DD'. Não vira Date: veja gen-db-types. */
export function formatDateOnly(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
}

export function formatCPF(value: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  return digits.length === 11
    ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : value;
}

export function ageFrom(
  birthDate: string | null,
  timeZone: string,
  agora = new Date(),
): number | null {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  // "Hoje" é o da clínica: perto da virada do dia, o servidor já está no dia
  // seguinte e o paciente faria aniversário cedo demais.
  const [hojeAno, hojeMes, hojeDia] = diaLocal(agora, timeZone).split("-").map(Number);
  if (!hojeAno || !hojeMes || !hojeDia) return null;

  let age = hojeAno - year;
  if (hojeMes < month || (hojeMes === month && hojeDia < day)) age -= 1;
  return age;
}

/** "hoje", "há 3 dias", "em 2 dias" — a recepção lê isso mais rápido que data. */
export function relativeDays(date: Date, timeZone: string, agora = new Date()): string {
  const a = Date.parse(`${diaLocal(date, timeZone)}T00:00:00Z`);
  const b = Date.parse(`${diaLocal(agora, timeZone)}T00:00:00Z`);
  const days = Math.round((a - b) / 86_400_000);

  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  return days > 0 ? `em ${days} dias` : `há ${Math.abs(days)} dias`;
}

export function firstName(fullName: string): string {
  const honorifics = new Set(["dr", "dra", "sr", "sra", "srta", "prof", "profa"]);
  for (const part of fullName.trim().split(/\s+/)) {
    const normalized = part
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\./g, "")
      .toLowerCase();
    if (!honorifics.has(normalized)) return part;
  }
  return fullName;
}
