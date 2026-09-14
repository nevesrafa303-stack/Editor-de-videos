/** Validacao e formatacao de dados brasileiros. */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Valida CPF pelos digitos verificadores. */
export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  for (const [length, position] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let sum = 0;
    for (let i = 0; i < length; i += 1) {
      sum += Number(cpf[i]) * (position - i);
    }
    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== Number(cpf[length])) return false;
  }

  return true;
}

export function formatCPF(value: string): string {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return value;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(value: string): string {
  const phone = onlyDigits(value);
  if (phone.length === 11) return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (phone.length === 10) return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
}

/** Link de WhatsApp com DDI do Brasil. */
export function whatsappLink(phone: string, message?: string): string {
  const digits = onlyDigits(phone);
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${withCountry}${text}`;
}

export function isValidCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const check = (length: number): number => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i += 1) {
      sum += Number(cnpj[i]) * weight;
      weight -= 1;
      if (weight < 2) weight = 9;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return check(12) === Number(cnpj[12]) && check(13) === Number(cnpj[13]);
}

/** Pronomes de tratamento comuns em clínica; não servem para cumprimentar. */
const HONORIFICS = new Set(["dr", "dra", "sr", "sra", "srta", "prof", "profa"]);

/**
 * Primeiro nome útil de uma pessoa. "Dra. Ana Souza" -> "Ana", para o sistema
 * não cumprimentar ninguem de "Olá, Dra.".
 */
export function firstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  for (const part of parts) {
    const normalized = part
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\./g, "")
      .toLowerCase();
    if (!HONORIFICS.has(normalized)) return part;
  }
  return parts[0] ?? fullName;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
