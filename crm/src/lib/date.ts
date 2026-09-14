/** Formatacao de datas em pt-BR. */

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const DATE_SHORT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const TIME = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const WEEKDAY = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const MONTH_YEAR = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

export const formatDate = (date: Date) => DATE.format(date);
export const formatDateShort = (date: Date) => DATE_SHORT.format(date);
export const formatTime = (date: Date) => TIME.format(date);
export const formatDateTime = (date: Date) => `${DATE.format(date)} ${TIME.format(date)}`;
export const formatWeekday = (date: Date) => WEEKDAY.format(date).replace(".", "");
export const formatMonthYear = (date: Date) => MONTH_YEAR.format(date);

/** "2026-09-14" -> Date local (sem pular um dia por causa de UTC). */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0);
}

/** Date -> "2026-09-14", para preencher <input type="date">. */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Date -> "2026-09-14T14:30", para <input type="datetime-local">. */
export function toISODateTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toISODate(date)}T${hours}:${minutes}`;
}

export function age(birthDate: Date, today = new Date()): number {
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  return years;
}

/** "em 3 dias", "há 2 dias", "hoje". */
export function relativeDays(date: Date, today = new Date()): string {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const days = Math.round((a - b) / 86_400_000);

  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  return days > 0 ? `em ${days} dias` : `há ${Math.abs(days)} dias`;
}
