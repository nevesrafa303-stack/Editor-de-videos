/** Validacao e normalizacao de dados brasileiros. */

export const onlyDigits = (value: string): string => value.replace(/\D/g, "");

export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  for (const [length, weight] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(cpf[i]) * (weight - i);
    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== Number(cpf[length])) return false;
  }

  return true;
}

export function isValidPhone(value: string): boolean {
  const phone = onlyDigits(value);
  return phone.length === 10 || phone.length === 11;
}
