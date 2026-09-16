/**
 * Leitor de CSV.
 *
 * Nao e `split(",")`. A planilha que a clinica exporta do sistema antigo tem
 * campo entre aspas com virgula dentro ("Silva, Maria"), aspas escapadas ("a
 * ""b"""), quebra de linha dentro do campo, e BOM no comeco porque o Excel
 * insiste. Cada um desses transforma uma linha boa em lixo silencioso — e num
 * importador, lixo silencioso vira cadastro errado em massa.
 *
 * Tambem detecta o separador: o Excel em portugues salva com ponto e virgula,
 * porque a virgula ja e o separador decimal. Exigir virgula seria exigir que a
 * clinica soubesse reconfigurar o Excel antes de trocar de sistema.
 */

export type CsvTable = {
  header: string[];
  rows: { line: number; cells: string[] }[];
};

/** Descobre o separador olhando a primeira linha fora de aspas. */
function detectarSeparador(texto: string): string {
  let entreAspas = false;
  const contagem: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };

  for (let i = 0; i < texto.length; i += 1) {
    const ch = texto[i];

    if (ch === '"') {
      if (entreAspas && texto[i + 1] === '"') i += 1;
      else entreAspas = !entreAspas;
    } else if (!entreAspas && (ch === "\n" || ch === "\r")) {
      break;
    } else if (!entreAspas && ch !== undefined && ch in contagem) {
      contagem[ch] = (contagem[ch] ?? 0) + 1;
    }
  }

  const [melhor] = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  return melhor && melhor[1] > 0 ? melhor[0] : ",";
}

export function parseCsv(texto: string): CsvTable {
  // O Excel escreve BOM no UTF-8. Sem remover, a primeira coluna do cabecalho
  // vira "﻿nome" e nao casa com nada.
  const limpo = texto.replace(/^﻿/, "");
  const sep = detectarSeparador(limpo);

  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let entreAspas = false;

  const fecharCampo = () => {
    linha.push(campo);
    campo = "";
  };

  const fecharLinha = () => {
    fecharCampo();
    linhas.push(linha);
    linha = [];
  };

  for (let i = 0; i < limpo.length; i += 1) {
    const ch = limpo[i];

    if (entreAspas) {
      if (ch === '"') {
        // Aspas duplas dentro de aspas sao uma aspa literal.
        if (limpo[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          entreAspas = false;
        }
      } else {
        campo += ch;
      }
      continue;
    }

    if (ch === '"' && campo === "") entreAspas = true;
    else if (ch === sep) fecharCampo();
    else if (ch === "\r") continue;
    else if (ch === "\n") fecharLinha();
    else campo += ch;
  }

  // Ultima linha sem quebra no fim.
  if (campo !== "" || linha.length > 0) fecharLinha();

  const uteis = linhas.filter((l) => l.some((c) => c.trim() !== ""));
  const [cabecalho, ...resto] = uteis;

  if (!cabecalho) return { header: [], rows: [] };

  return {
    header: cabecalho.map((c) => normalizarCabecalho(c)),
    // `line` e a linha NO ARQUIVO, contando o cabecalho: e o numero que a
    // pessoa vai procurar no Excel para corrigir.
    rows: resto.map((cells, i) => ({ line: i + 2, cells })),
  };
}

/**
 * "Nome Completo" e "nome_completo" e "NOME COMPLETO" viram a mesma coisa.
 *
 * Exigir cabecalho exato seria exigir que a clinica editasse a planilha antes
 * de importar — e quem esta trocando de sistema ja tem problema demais.
 */
export function normalizarCabecalho(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Acha a coluna por qualquer um dos nomes aceitos. */
export function coluna(header: string[], ...aceitos: string[]): number {
  for (const nome of aceitos) {
    const i = header.indexOf(nome);
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Escritor de CSV, para a planilha que sai daqui.
 *
 * Tres decisoes, todas para o arquivo ABRIR CERTO com dois cliques no Excel em
 * portugues — que e onde ele vai ser aberto, e nao num editor de texto:
 *
 * 1. SEPARADOR PONTO E VIRGULA. O Excel brasileiro usa virgula como separador
 *    decimal, entao a virgula nao pode separar coluna. Arquivo com virgula
 *    abre com tudo numa coluna so, e a pessoa conclui que o sistema exporta
 *    errado (e, do ponto de vista dela, exporta).
 * 2. BOM NO COMECO. Sem ele o Excel le como Latin-1 e "Preenchimento" vira
 *    "PreÃ¡...". O BOM e feio e e a unica coisa que o Excel entende.
 * 3. CRLF entre linhas, pelo mesmo motivo de compatibilidade.
 *
 * Aspas so quando precisa — campo com separador, aspas, ou quebra de linha —
 * porque arquivo com tudo entre aspas e ilegivel quando alguem abre no Bloco
 * de Notas para conferir.
 */
export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  const escapar = (valor: string | number | null): string => {
    const texto = valor === null || valor === undefined ? "" : String(valor);
    return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  const linhas = [header, ...rows].map((linha) => linha.map(escapar).join(";"));
  return `﻿${linhas.join("\r\n")}\r\n`;
}

/**
 * Numero como a planilha brasileira espera: virgula decimal, sem separador de
 * milhar.
 *
 * O milhar fica de fora de proposito: "1.234,56" com ponto e o que o Excel
 * mostra DEPOIS de entender o numero, nao o que ele aceita na entrada — com
 * ponto no arquivo, algumas versoes leem como texto e a soma da coluna nao
 * funciona. E uma coluna que nao soma e uma exportacao que nao serviu.
 */
export function numeroCsv(valor: number, casas = 2): string {
  return valor.toFixed(casas).replace(".", ",");
}

/** Centavos como numero de planilha: 123456 -> "1234,56". */
export const centavosCsv = (cents: number): string => numeroCsv(cents / 100);
