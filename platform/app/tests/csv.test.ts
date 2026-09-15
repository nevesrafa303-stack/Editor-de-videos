/**
 * Leitor de CSV. Teste puro, sem banco.
 *
 * Existe porque `split(",")` parece funcionar até a primeira planilha de
 * verdade: a que a clínica exporta do sistema antigo tem vírgula dentro de
 * aspas, ponto e vírgula como separador (Excel em português), e BOM no começo.
 * Cada um transforma uma linha boa em cadastro errado, sem avisar.
 */
import { describe, expect, it } from "vitest";
import { coluna, normalizarCabecalho, parseCsv } from "@/shared/csv";

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
