import { describe, expect, it } from "vitest";
import { bySource, funnelMetrics } from "@/domain/funnel";
import { isValidCPF, isValidCNPJ, formatPhone, whatsappLink, slugify, firstName } from "@/lib/br";
import { parseChart, chartSummary } from "@/domain/odontogram";

describe("funnelMetrics", () => {
  const leads = [
    { stage: "NOVO", valueCents: 100_000 },
    { stage: "PROPOSTA", valueCents: 300_000 },
    { stage: "GANHO", valueCents: 500_000 },
    { stage: "GANHO", valueCents: 300_000 },
    { stage: "PERDIDO", valueCents: 200_000 },
  ];

  it("separa abertos, ganhos e perdidos", () => {
    const metrics = funnelMetrics(leads);
    expect(metrics.open).toBe(2);
    expect(metrics.won).toBe(2);
    expect(metrics.lost).toBe(1);
  });

  it("converte sobre os leads fechados, não sobre o total", () => {
    expect(funnelMetrics(leads).conversionRate).toBe(67);
  });

  it("soma o pipeline aberto e o ticket medio ganho", () => {
    const metrics = funnelMetrics(leads);
    expect(metrics.pipelineCents).toBe(400_000);
    expect(metrics.wonCents).toBe(800_000);
    expect(metrics.averageTicketCents).toBe(400_000);
  });

  it("funil vazio não divide por zero", () => {
    const metrics = funnelMetrics([]);
    expect(metrics.conversionRate).toBe(0);
    expect(metrics.averageTicketCents).toBe(0);
  });
});

describe("bySource", () => {
  it("ordena origens por volume e calcula conversao", () => {
    const rows = bySource([
      { source: "INSTAGRAM", stage: "GANHO", valueCents: 100_000 },
      { source: "INSTAGRAM", stage: "PERDIDO", valueCents: 0 },
      { source: "INSTAGRAM", stage: "NOVO", valueCents: 50_000 },
      { source: "INDICACAO", stage: "GANHO", valueCents: 200_000 },
    ]);

    expect(rows[0].source).toBe("INSTAGRAM");
    expect(rows[0].total).toBe(3);
    expect(rows[0].conversionRate).toBe(50);
    expect(rows[1].conversionRate).toBe(100);
  });
});

describe("documentos brasileiros", () => {
  it("valida CPF pelos digitos verificadores", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("529.982.247-24")).toBe(false);
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("123")).toBe(false);
  });

  it("valida CNPJ", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11.222.333/0001-80")).toBe(false);
  });

  it("formata telefone com 10 e 11 digitos", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("1132654321")).toBe("(11) 3265-4321");
  });

  it("monta link de WhatsApp com DDI", () => {
    expect(whatsappLink("(11) 98765-4321")).toBe("https://wa.me/5511987654321");
    expect(whatsappLink("5511987654321", "Oi")).toBe("https://wa.me/5511987654321?text=Oi");
  });

  it("gera slug sem acento", () => {
    expect(slugify("Clínica Sorriso & Estética")).toBe("clinica-sorriso-estetica");
  });
});

describe("odontograma", () => {
  it("descarta dentes e estados inválidos", () => {
    const chart = parseChart({
      "16": { status: "CARIE", faces: ["O"] },
      "99": { status: "CARIE" },
      "21": { status: "INVENTADO" },
      "22": "não e objeto",
    });

    expect(Object.keys(chart)).toEqual(["16"]);
    expect(chart["16"].faces).toEqual(["O"]);
  });

  it("aceita dente deciduo", () => {
    expect(Object.keys(parseChart({ "55": { status: "AUSENTE" } }))).toEqual(["55"]);
  });

  it("resume ignorando dentes higidos", () => {
    const summary = chartSummary(
      parseChart({
        "11": { status: "HIGIDO" },
        "16": { status: "CARIE" },
        "26": { status: "CARIE" },
        "36": { status: "IMPLANTE" },
      }),
    );

    expect(summary[0]).toEqual({ status: "CARIE", count: 2 });
    expect(summary).toHaveLength(2);
  });

  it("json vazio ou nulo vira mapa vazio", () => {
    expect(parseChart(null)).toEqual({});
    expect(parseChart("texto")).toEqual({});
  });
});

describe("firstName", () => {
  it("ignora pronome de tratamento", () => {
    expect(firstName("Dra. Ana Souza")).toBe("Ana");
    expect(firstName("Dr Bruno Lima")).toBe("Bruno");
    expect(firstName("Sra. Maria")).toBe("Maria");
  });

  it("mantem o primeiro nome quando não ha pronome", () => {
    expect(firstName("Roberto Carvalho")).toBe("Roberto");
    expect(firstName("Mariana")).toBe("Mariana");
  });
});
