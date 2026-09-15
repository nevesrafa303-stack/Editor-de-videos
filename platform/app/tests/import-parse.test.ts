/**
 * Leitura da planilha. Teste puro, sem banco.
 *
 * Cada caso aqui é uma planilha de verdade: data em três formatos, CPF com
 * ponto, dinheiro com vírgula, cabeçalho com acento. Num importador, cada um
 * desses vira cadastro errado em massa — e cadastro errado em massa é o que a
 * clínica descobre meses depois, sem saber de onde veio.
 */
import { describe, expect, it } from "vitest";
import { lerData, lerPlanilha } from "@/modules/import/parse";

const CABECALHO = "nome,telefone,cpf,nascimento,email,saldo";

function ler(...linhas: string[]) {
  return lerPlanilha([CABECALHO, ...linhas].join("\n"));
}

describe("reconhecer as colunas", () => {
  it("aceita os nomes que cada sistema usa", () => {
    const r = lerPlanilha("Nome Completo;Celular;CPF\nMaria Silva;11988887777;");

    expect(r.fatal).toBeNull();
    expect(r.linhas[0]?.fullName).toBe("Maria Silva");
    expect(r.linhas[0]?.phone).toBe("11988887777");
  });

  it("diz o que falta, e quais nomes servem", () => {
    const r = lerPlanilha("apelido,idade\nMá,30");

    // "Arquivo inválido" obrigaria a pessoa a adivinhar.
    expect(r.fatal).toMatch(/precisa de uma coluna de nome e uma de telefone/);
    expect(r.fatal).toMatch(/nome_completo/);
    expect(r.fatal).toMatch(/celular/);
  });

  it("avisa quais colunas vai ignorar", () => {
    const r = lerPlanilha("nome,telefone,convenio,observacao\nMaria,11988887777,X,Y");

    expect(r.reconhecidas).toEqual(["nome", "telefone"]);
    expect(r.ignoradas).toEqual(["convenio", "observacao"]);
  });

  it("arquivo vazio não explode", () => {
    expect(lerPlanilha("").fatal).toBe("O arquivo está vazio.");
  });
});

describe("validar a linha", () => {
  it("nome e telefone bons passam", () => {
    const r = ler("Maria Silva,(11) 98888-7777,,,,");

    expect(r.linhas[0]?.erros).toEqual([]);
    expect(r.linhas[0]?.phone).toBe("11988887777");
  });

  it("sem nome ou sem telefone, a linha reprova", () => {
    const r = ler(",11988887777,,,,", "Maria Silva,,,,,");

    expect(r.linhas[0]?.erros[0]).toMatch(/Nome vazio/);
    expect(r.linhas[1]?.erros[0]).toMatch(/Telefone vazio/);
  });

  it("telefone sem DDD reprova, e a frase mostra o que veio", () => {
    const r = ler("Maria Silva,98887777,,,,");

    expect(r.linhas[0]?.erros[0]).toMatch(/Telefone inválido: 98887777/);
  });

  it("CPF inválido NÃO reprova a linha: entra sem CPF, com aviso", () => {
    // Barrar a paciente inteira por um dígito seria trocar um dado faltando
    // por uma paciente faltando.
    const r = ler("Maria Silva,11988887777,111.111.111-11,,,");

    expect(r.linhas[0]?.erros).toEqual([]);
    expect(r.linhas[0]?.avisos[0]).toMatch(/CPF inválido, entra sem/);
    expect(r.linhas[0]?.taxId).toBeNull();
  });

  it("CPF bom entra só com os dígitos", () => {
    const r = ler("Maria Silva,11988887777,390.533.447-05,,,");

    expect(r.linhas[0]?.taxId).toBe("39053344705");
  });

  it("e-mail inválido também não reprova", () => {
    const r = ler("Maria Silva,11988887777,,,maria arroba,");

    expect(r.linhas[0]?.erros).toEqual([]);
    expect(r.linhas[0]?.avisos[0]).toMatch(/E-mail inválido, entra sem/);
    expect(r.linhas[0]?.email).toBeNull();
  });

  it("guarda a linha crua, para saber de quem foi o erro", () => {
    const r = ler("Maria Silva,11988887777,,15/03/1990,,");

    expect(r.linhas[0]?.raw).toEqual({
      nome: "Maria Silva",
      telefone: "11988887777",
      nascimento: "15/03/1990",
    });
  });
});

describe("dinheiro e vencimento", () => {
  it("saldo em português vira centavos", () => {
    // Ponto e vírgula como separador é justamente o que o Excel em português
    // usa — e é o que faz "1.234,56" caber num campo sem aspas.
    const r = lerPlanilha(
      "nome;telefone;saldo\nMaria Silva;11988887777;1.234,56",
    );

    expect(r.linhas[0]?.balanceCents).toBe(123456);
  });

  it("e entre aspas funciona mesmo com vírgula de separador", () => {
    const r = ler('Maria Silva,11988887777,,,,"1.234,56"');

    expect(r.linhas[0]?.balanceCents).toBe(123456);
  });

  it("saldo vazio ou negativo vale zero", () => {
    expect(ler("Maria Silva,11988887777,,,,").linhas[0]?.balanceCents).toBe(0);
    expect(ler("Maria Silva,11988887777,,,,-50").linhas[0]?.balanceCents).toBe(0);
  });
});

describe("lerData", () => {
  it("aceita os três formatos que aparecem", () => {
    expect(lerData("15/03/1990")).toBe("1990-03-15");
    expect(lerData("1990-03-15")).toBe("1990-03-15");
    expect(lerData("15-03-1990")).toBe("1990-03-15");
    expect(lerData("5/3/1990")).toBe("1990-03-05");
  });

  it("recusa ano de dois dígitos", () => {
    // "01/02/30" tanto pode ser 1930 quanto 2030, e chutar a data de
    // nascimento de alguém por setenta anos é pior do que deixar em branco.
    expect(lerData("01/02/30")).toBeNull();
  });

  it("recusa data que não existe", () => {
    expect(lerData("31/02/1990")).toBeNull();
    expect(lerData("32/01/1990")).toBeNull();
    expect(lerData("15/13/1990")).toBeNull();
  });

  it("vazio é null, não erro", () => {
    expect(lerData("")).toBeNull();
    expect(lerData("sem data")).toBeNull();
  });

  it("nascimento não reconhecido avisa, mas não reprova a linha", () => {
    const r = ler("Maria Silva,11988887777,,amanhã,,");

    expect(r.linhas[0]?.birthDate).toBeNull();
    expect(r.linhas[0]?.erros).toEqual([]);
    expect(r.linhas[0]?.avisos[0]).toMatch(/Nascimento não reconhecido/);
  });
});
