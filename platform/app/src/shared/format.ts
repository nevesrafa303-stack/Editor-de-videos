/** Formatação pt-BR. Um lugar só, para a tela não inventar variações. */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const TIME = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const formatBRL = (cents: number): string => BRL.format(cents / 100);
export const formatDateTime = (date: Date): string => `${DATE.format(date)} ${TIME.format(date)}`;
export const formatTime = (date: Date): string => TIME.format(date);

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

export function ageFrom(birthDate: string | null, today = new Date()): number | null {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;

  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

/** "hoje", "há 3 dias", "em 2 dias" — a recepção lê isso mais rápido que data. */
export function relativeDays(date: Date, today = new Date()): string {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
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
