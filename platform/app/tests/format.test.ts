/**
 * Formatacao de data. Teste puro, sem banco.
 *
 * Existe por causa de um defeito que so apareceu na captura de tela: consulta
 * marcada as 14:00 aparecia as 17:00 porque o servidor roda em UTC e o
 * formatador usava o fuso do processo.
 */
import { describe, expect, it } from "vitest";
import { ageFrom, formatDateTime, formatTime, relativeDays } from "@/shared/format";

const SP = "America/Sao_Paulo";
const MANAUS = "America/Manaus";

describe("hora na tela", () => {
  it("mostra o horario da clinica, nao o do servidor", () => {
    // 14:00 em Sao Paulo (UTC-3) e 17:00 em UTC.
    const instante = new Date("2026-09-15T17:00:00Z");

    expect(formatTime(instante, SP)).toBe("14:00");
    expect(formatDateTime(instante, SP)).toBe("15/09/2026 14:00");
  });

  it("a mesma consulta e outra hora em outra unidade da rede", () => {
    const instante = new Date("2026-09-15T17:00:00Z");

    expect(formatTime(instante, SP)).toBe("14:00");
    expect(formatTime(instante, MANAUS)).toBe("13:00");
  });

  it("perto da meia-noite, o dia e o da clinica", () => {
    // 23:30 de 15/09 em Sao Paulo ja e 02:30 de 16/09 em UTC.
    const instante = new Date("2026-09-16T02:30:00Z");

    expect(formatDateTime(instante, SP)).toBe("15/09/2026 23:30");
  });
});

describe("dias relativos", () => {
  const agora = new Date("2026-09-16T02:30:00Z"); // 23:30 de 15/09 em SP

  it("conta a partir do dia da clinica", () => {
    expect(relativeDays(new Date("2026-09-15T14:00:00Z"), SP, agora)).toBe("hoje");
    expect(relativeDays(new Date("2026-09-16T14:00:00Z"), SP, agora)).toBe("amanhã");
    expect(relativeDays(new Date("2026-09-14T14:00:00Z"), SP, agora)).toBe("ontem");
    expect(relativeDays(new Date("2026-09-18T14:00:00Z"), SP, agora)).toBe("em 3 dias");
  });
});

describe("idade", () => {
  it("nao antecipa o aniversario por causa do fuso do servidor", () => {
    // 23:30 de 14/09 em SP; em UTC ja e 15/09, o dia do aniversario.
    const vespera = new Date("2026-09-15T02:30:00Z");

    expect(ageFrom("1990-09-15", SP, vespera)).toBe(35);
    expect(ageFrom("1990-09-15", "UTC", vespera)).toBe(36);
  });

  it("devolve null sem data de nascimento", () => {
    expect(ageFrom(null, SP)).toBeNull();
  });
});
