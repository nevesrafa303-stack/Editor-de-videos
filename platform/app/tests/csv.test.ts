/**
 * Leitor de CSV. Teste puro, sem banco.
 *
 * Existe porque `split(",")` parece funcionar até a primeira planilha de
 * verdade: a que a clínica exporta do sistema antigo tem vírgula dentro de
 * aspas, ponto e vírgula como separador (Excel em português), e BOM no começo.
 * Cada um transforma uma linha boa em cadastro errado, sem avisar.
 */
import { describe, expect, it } from "vitest";
import {
  centavosCsv,
  coluna,
  normalizarCabecalho,
  numeroCsv,
  parseCsv,
  toCsv,
} from "@/shared/csv";

describe("parseCsv", () => {
  it("lê o básico", () => {
    const t = parseCsv("nome,telefone\nMaria,11988887777\nJoão,11977776666");

    expect(t.header).toEqual(["nome", "telefone"]);
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0]).toEqual({ line: 2, cells: ["Maria", "11988887777"] });
  });

  it("vírgula dentro de aspas não parte o campo", () => {
    const t = parseCsv('nome,obs\n"Silva, Maria","mora no centro, perto da praça"');

    expect(t.rows[0]?.cells).toEqual(["Silva, Maria", "mora no centro, perto da praça"]);
  });

  it("aspas escapadas viram uma aspa só", () => {
    const t = parseCsv('nome,obs\nMaria,"disse ""vou pensar"" e sumiu"');

    expect(t.rows[0]?.cells[1]).toBe('disse "vou pensar" e sumiu');
  });

  it("quebra de linha dentro do campo não cria linha nova", () => {
    const t = parseCsv('nome,obs\nMaria,"primeira\nsegunda"');

    expect(t.rows).toHaveLength(1);
    expect(t.rows[0]?.cells[1]).toBe("primeira\nsegunda");
  });

  it("Excel em português: ponto e vírgula é o separador", () => {
    const t = parseCsv("nome;telefone;saldo\nMaria;11988887777;1.234,56");

    expect(t.header).toEqual(["nome", "telefone", "saldo"]);
    expect(t.rows[0]?.cells).toEqual(["Maria", "11988887777", "1.234,56"]);
  });

  it("e o BOM do Excel não gruda na primeira coluna", () => {
    const t = parseCsv("﻿nome,telefone\nMaria,11988887777");

    expect(t.header[0]).toBe("nome");
  });

  it("linha em branco no meio não vira linha vazia", () => {
    const t = parseCsv("nome\nMaria\n\nJoão\n");

    expect(t.rows).toHaveLength(2);
  });

  it("a numeração é a do arquivo, contando o cabeçalho", () => {
    // É o número que a pessoa vai procurar no Excel para corrigir.
    const t = parseCsv("nome\nA\nB\nC");

    expect(t.rows.map((r) => r.line)).toEqual([2, 3, 4]);
  });

  it("arquivo vazio não explode", () => {
    expect(parseCsv("")).toEqual({ header: [], rows: [] });
    expect(parseCsv("\n\n")).toEqual({ header: [], rows: [] });
  });

  it("CRLF do Windows não deixa \\r no fim do campo", () => {
    const t = parseCsv("nome,telefone\r\nMaria,11988887777\r\n");

    expect(t.rows[0]?.cells[1]).toBe("11988887777");
  });
});

describe("normalizarCabecalho", () => {
  it("acento, maiúscula e espaço viram a mesma coisa", () => {
    expect(normalizarCabecalho("Nome Completo")).toBe("nome_completo");
    expect(normalizarCabecalho("NOME COMPLETO")).toBe("nome_completo");
    expect(normalizarCabecalho(" Data de Nascimento ")).toBe("data_de_nascimento");
    expect(normalizarCabecalho("CPF/CNPJ")).toBe("cpf_cnpj");
  });
});

describe("coluna", () => {
  it("acha pelo primeiro nome aceito que existir", () => {
    const header = ["nome", "celular", "cpf"];

    expect(coluna(header, "telefone", "celular")).toBe(1);
    expect(coluna(header, "nascimento")).toBe(-1);
  });
});

describe("escrever csv", () => {
  it("abre certo no Excel brasileiro: BOM, ponto e vírgula, CRLF", () => {
    // Não é preciosismo de formato — é onde o arquivo vai ser aberto. Com
    // vírgula separando coluna, o Excel em português põe tudo numa coluna só;
    // sem BOM, "Preenchimento" vira "PreÃ¡...".
    const csv = toCsv(["Procedimento", "Valor"], [["Toxina botulínica", "1500,00"]]);

    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("Procedimento;Valor\r\n");
    expect(csv).toContain("Toxina botulínica;1500,00");
  });

  it("só usa aspas quando o campo precisa", () => {
    // Arquivo com tudo entre aspas é ilegível para quem abre no Bloco de Notas
    // para conferir — e alguém sempre abre.
    const csv = toCsv(
      ["a", "b", "c", "d"],
      [["simples", "tem;separador", 'tem "aspas"', "tem\nquebra"]],
    );

    expect(csv).toContain("simples;");
    expect(csv).toContain('"tem;separador"');
    expect(csv).toContain('"tem ""aspas"""');
    expect(csv).toContain('"tem\nquebra"');
  });

  it("célula vazia não vira zero", () => {
    // Zero numa planilha entra na soma e na média como se fosse medição. O
    // vazio é o que diz "isto não foi medido".
    const csv = toCsv(["a", "b"], [[null, 0]]);
    expect(csv).toContain(";0\r\n");
    expect(csv.split("\r\n")[1]).toBe(";0");
  });

  it("número sai com vírgula decimal e sem separador de milhar", () => {
    // Com ponto de milhar no arquivo, algumas versões do Excel leem a coluna
    // como texto — e coluna que não soma é exportação que não serviu.
    expect(numeroCsv(1234.5)).toBe("1234,50");
    expect(numeroCsv(0.1438, 4)).toBe("0,1438");
    expect(centavosCsv(123456)).toBe("1234,56");
    expect(centavosCsv(0)).toBe("0,00");
  });

  it("o que este escritor escreve, o leitor daqui lê de volta", () => {
    // As duas metades vivem no mesmo arquivo e precisam concordar: exportar e
    // reimportar é o caminho mais curto para alguém corrigir uma planilha.
    const csv = toCsv(
      ["Nome", "Valor"],
      [["Silva; Maria", "1234,56"], ['Aspas "aqui"', "0,00"]],
    );

    const lido = parseCsv(csv);
    // O leitor normaliza o cabeçalho de propósito (é ele que casa "Telefone"
    // com "telefone" na planilha de fora). O que precisa voltar intacto são as
    // CÉLULAS — é onde moram o ponto e vírgula e as aspas.
    expect(lido.header).toEqual(["nome", "valor"]);
    expect(lido.rows[0]?.cells).toEqual(["Silva; Maria", "1234,56"]);
    expect(lido.rows[1]?.cells).toEqual(['Aspas "aqui"', "0,00"]);
  });
});
