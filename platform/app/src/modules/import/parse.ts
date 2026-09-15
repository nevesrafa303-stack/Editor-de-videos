/**
 * Da planilha para a linha validada.
 *
 * Puro de proposito: nao toca no banco, nao sabe o que e tenant. Assim a parte
 * mais cheia de casos estranhos do importador — data em tres formatos, CPF com
 * ponto, dinheiro com virgula — pode ser testada sem subir nada.
 */
import { coluna, parseCsv } from "@/shared/csv";
import { centavosDeTexto } from "@/shared/money";
import { isValidCPF, isValidPhone, onlyDigits } from "@/shared/br";
import { COLUNAS } from "@/modules/import/schema";

export type LinhaLida = {
  line: number;
  /** O que veio no arquivo, como veio. */
  raw: Record<string, string>;
  fullName: string;
  phone: string;
  taxId: string | null;
  birthDate: string | null;
  email: string | null;
  balanceCents: number;
  dueDate: string | null;
  /** O que IMPEDE de criar a pessoa. Vazio quando a linha esta boa. */
  erros: string[];
  /**
   * O que entra incompleto, mas entra.
   *
   * A separacao e por LISTA, nao por texto da mensagem: distinguir bloqueio de
   * aviso testando o que a frase diz e o tipo de coisa que quebra quando
   * alguem reescreve a frase.
   */
  avisos: string[];
};

export type Leitura = {
  header: string[];
  /** Colunas que o arquivo tem e o importador entende. */
  reconhecidas: string[];
  /** Colunas do arquivo que serao ignoradas. */
  ignoradas: string[];
  linhas: LinhaLida[];
  /** Erro que impede a leitura inteira, e nao linha por linha. */
  fatal: string | null;
};

export function lerPlanilha(texto: string): Leitura {
  const tabela = parseCsv(texto);

  if (tabela.header.length === 0) {
    return {
      header: [],
      reconhecidas: [],
      ignoradas: [],
      linhas: [],
      fatal: "O arquivo está vazio.",
    };
  }

  const indices = Object.fromEntries(
    Object.entries(COLUNAS).map(([campo, nomes]) => [
      campo,
      coluna(tabela.header, ...nomes),
    ]),
  ) as Record<keyof typeof COLUNAS, number>;

  if (indices.fullName < 0 || indices.phone < 0) {
    return {
      header: tabela.header,
      reconhecidas: [],
      ignoradas: tabela.header,
      linhas: [],
      // Dizer O QUE FALTA e quais nomes servem: "arquivo inválido" obrigaria a
      // pessoa a adivinhar.
      fatal:
        "A planilha precisa de uma coluna de nome e uma de telefone. " +
        `Nome pode se chamar: ${COLUNAS.fullName.join(", ")}. ` +
        `Telefone: ${COLUNAS.phone.join(", ")}.`,
    };
  }

  const usados = new Set(Object.values(indices).filter((i) => i >= 0));

  const linhas = tabela.rows.map((row) => lerLinha(row, tabela.header, indices));

  return {
    header: tabela.header,
    reconhecidas: [...usados].sort((a, b) => a - b).map((i) => tabela.header[i] ?? ""),
    ignoradas: tabela.header.filter((_, i) => !usados.has(i)),
    linhas,
    fatal: null,
  };
}

function lerLinha(
  row: { line: number; cells: string[] },
  header: string[],
  indices: Record<keyof typeof COLUNAS, number>,
): LinhaLida {
  const pegar = (i: number): string => (i >= 0 ? (row.cells[i] ?? "").trim() : "");

  const raw: Record<string, string> = {};
  header.forEach((nome, i) => {
    const valor = (row.cells[i] ?? "").trim();
    if (valor !== "") raw[nome] = valor;
  });

  const erros: string[] = [];
  const avisos: string[] = [];

  const fullName = pegar(indices.fullName);
  if (fullName.length < 3) erros.push("Nome vazio ou curto demais");

  const phone = onlyDigits(pegar(indices.phone));
  if (!phone) erros.push("Telefone vazio");
  else if (!isValidPhone(phone)) erros.push(`Telefone inválido: ${pegar(indices.phone)}`);

  const cpfBruto = pegar(indices.taxId);
  let taxId: string | null = null;
  if (cpfBruto) {
    const digitos = onlyDigits(cpfBruto);
    if (isValidCPF(digitos)) taxId = digitos;
    // CPF errado NAO invalida a linha: o cadastro nasce sem CPF e a clinica
    // corrige depois. Barrar a paciente inteira por causa de um digito seria
    // trocar um dado faltando por uma paciente faltando.
    else avisos.push(`CPF inválido, entra sem: ${cpfBruto}`);
  }

  const birthDate = lerData(pegar(indices.birthDate));
  if (pegar(indices.birthDate) && !birthDate) {
    avisos.push(`Nascimento não reconhecido, entra sem: ${pegar(indices.birthDate)}`);
  }

  const emailBruto = pegar(indices.email);
  const email = emailBruto && /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(emailBruto) ? emailBruto : null;
  if (emailBruto && !email) avisos.push(`E-mail inválido, entra sem: ${emailBruto}`);

  const balanceCents = centavosDeTexto(pegar(indices.balance));
  const dueDate = lerData(pegar(indices.dueDate));

  return {
    line: row.line,
    raw,
    fullName,
    phone,
    taxId,
    birthDate,
    email,
    balanceCents: balanceCents > 0 ? balanceCents : 0,
    dueDate,
    erros,
    avisos,
  };
}

/**
 * Data em tres formatos, porque e o que aparece.
 *
 * `dd/mm/aaaa` (o que a clinica digita), `aaaa-mm-dd` (o que um export decente
 * produz) e `dd-mm-aaaa`. Ano de dois digitos NAO e aceito: "01/02/30" tanto
 * pode ser 1930 quanto 2030, e chutar a data de nascimento de alguem por
 * setenta anos e pior do que deixar em branco.
 */
export function lerData(valor: string): string | null {
  if (!valor) return null;

  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return valida(iso[1]!, iso[2]!, iso[3]!);

  const br = valor.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (br) return valida(br[3]!, br[2]!.padStart(2, "0"), br[1]!.padStart(2, "0"));

  return null;
}

function valida(ano: string, mes: string, dia: string): string | null {
  const a = Number(ano);
  const m = Number(mes);
  const d = Number(dia);

  if (a < 1900 || a > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;

  // 31/02 nao existe: o Date rola para marco, e a comparacao pega isso.
  const data = new Date(Date.UTC(a, m - 1, d));
  if (data.getUTCMonth() !== m - 1 || data.getUTCDate() !== d) return null;

  return `${ano}-${mes}-${dia}`;
}
