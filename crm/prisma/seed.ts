/**
 * Popula o banco com duas clínicas. Duas, e não uma, de propósito: assim da
 * para conferir na prática que nada de uma vaza para a outra.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { LeadSource, LeadStage } from "../src/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não definida.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const day = (offset: number, hour = 9, minute = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const dateOnly = (offset: number): Date => {
  const date = day(offset, 0, 0);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

async function main() {
  console.log("Limpando dados anteriores...");
  // Ordem importa: filhos antes dos pais.
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.treatmentPlanItem.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.toothChart.deleteMany();
  await prisma.anamnesis.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.room.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();

  const senha = await bcrypt.hash("odonto123", 12);

  // ---------------------------------------------------- clínica principal --
  const sorriso = await prisma.clinic.create({
    data: {
      name: "Clínica Sorriso & Estética",
      slug: "sorriso-estetica",
      document: "11222333000181",
      phone: "1133334444",
      email: "contato@sorrisoestetica.com.br",
      defaultCommissionPct: 30,
    },
  });

  const [ana, bruno, carla, recepcao, financeiro] = await Promise.all([
    prisma.user.create({
      data: {
        clinicId: sorriso.id,
        name: "Dra. Ana Souza",
        email: "ana@sorrisoestetica.com.br",
        passwordHash: senha,
        role: "OWNER",
        isProfessional: true,
        specialty: "Implantodontia",
        councilNumber: "CRO-SP 45123",
        color: "#0f766e",
        commissionPct: 40,
      },
    }),
    prisma.user.create({
      data: {
        clinicId: sorriso.id,
        name: "Dr. Bruno Lima",
        email: "bruno@sorrisoestetica.com.br",
        passwordHash: senha,
        role: "PROFESSIONAL",
        isProfessional: true,
        specialty: "Ortodontia",
        councilNumber: "CRO-SP 51877",
        color: "#7c3aed",
      },
    }),
    prisma.user.create({
      data: {
        clinicId: sorriso.id,
        name: "Carla Mendes",
        email: "carla@sorrisoestetica.com.br",
        passwordHash: senha,
        role: "PROFESSIONAL",
        isProfessional: true,
        specialty: "Harmonização facial",
        councilNumber: "CRBM 9921",
        color: "#db2777",
        commissionPct: 35,
      },
    }),
    prisma.user.create({
      data: {
        clinicId: sorriso.id,
        name: "Juliana Rocha",
        email: "recepcao@sorrisoestetica.com.br",
        passwordHash: senha,
        role: "RECEPTION",
      },
    }),
    prisma.user.create({
      data: {
        clinicId: sorriso.id,
        name: "Marcos Dias",
        email: "financeiro@sorrisoestetica.com.br",
        passwordHash: senha,
        role: "FINANCE",
      },
    }),
  ]);

  const rooms = await Promise.all(
    ["Consultório 1", "Consultório 2", "Sala de estética"].map((name) =>
      prisma.room.create({ data: { clinicId: sorriso.id, name } }),
    ),
  );

  const catalogo = [
    ["Consulta de avaliação", "ODONTOLOGIA", 0, 0, 30],
    ["Limpeza / profilaxia", "ODONTOLOGIA", 18_000, 2_500, 40],
    ["Restauração em resina", "ODONTOLOGIA", 28_000, 4_000, 60],
    ["Tratamento de canal", "ODONTOLOGIA", 90_000, 12_000, 90],
    ["Extração simples", "ODONTOLOGIA", 35_000, 5_000, 45],
    ["Implante unitário", "ODONTOLOGIA", 320_000, 90_000, 120],
    ["Clareamento a laser", "ODONTOLOGIA", 120_000, 18_000, 90],
    ["Lente de contato dental (por dente)", "ODONTOLOGIA", 180_000, 45_000, 60],
    ["Aparelho ortodôntico (instalação)", "ODONTOLOGIA", 150_000, 40_000, 60],
    ["Toxina botulínica (3 regiões)", "ESTETICA", 150_000, 45_000, 60],
    ["Preenchimento labial", "ESTETICA", 180_000, 60_000, 60],
    ["Bioestimulador de colágeno", "ESTETICA", 250_000, 80_000, 60],
    ["Limpeza de pele profunda", "ESTETICA", 25_000, 4_000, 60],
    ["Microagulhamento", "ESTETICA", 60_000, 12_000, 60],
  ] as const;

  const procedures = await Promise.all(
    catalogo.map(([name, category, priceCents, costCents, durationMin]) =>
      prisma.procedure.create({
        data: {
          clinicId: sorriso.id,
          name,
          category,
          priceCents,
          costCents,
          durationMin,
        },
      }),
    ),
  );

  const proc = (name: string) => {
    const found = procedures.find((procedure) => procedure.name === name);
    if (!found) throw new Error(`Procedimento não encontrado no seed: ${name}`);
    return found;
  };

  // ------------------------------------------------------------ pacientes --
  const pacientes = await Promise.all(
    [
      ["Mariana Alves", "11987650001", "52998224725", -9800, "INSTAGRAM"],
      ["Roberto Carvalho", "11987650002", "15350946056", -16000, "INDICACAO"],
      ["Patricia Nunes", "11987650003", null, -13500, "TRAFEGO_PAGO"],
      ["Felipe Moreira", "11987650004", null, -11200, "GOOGLE"],
      ["Sandra Ribeiro", "11987650005", null, -18300, "INDICACAO"],
      ["Thiago Barbosa", "11987650006", null, -10400, "INSTAGRAM"],
      ["Camila Duarte", "11987650007", null, -12600, "SITE"],
      ["Eduardo Pires", "11987650008", null, -21000, "PASSANTE"],
    ].map(([name, phone, document, birthOffset, source]) =>
      prisma.patient.create({
        data: {
          clinicId: sorriso.id,
          name: name as string,
          phone: phone as string,
          document: document as string | null,
          birthDate: dateOnly(birthOffset as number),
          source: source as LeadSource,
          email: `${(name as string).split(" ")[0]?.toLowerCase()}@exemplo.com.br`,
          city: "São Paulo",
          state: "SP",
          consentDataAt: new Date(),
          consentImageAt: Math.random() > 0.4 ? new Date() : null,
        },
      }),
    ),
  );

  const [mariana, roberto, patricia, felipe, sandra, thiago] = pacientes;
  if (!mariana || !roberto || !patricia || !felipe || !sandra || !thiago || !ana || !bruno || !carla) {
    throw new Error("Seed incompleto.");
  }

  // ------------------------------------------------------------ agenda ----
  const agenda: {
    patientId: string;
    professionalId: string;
    procedureName: string;
    roomIndex: number;
    at: Date;
    status: "AGENDADO" | "CONFIRMADO" | "ATENDIDO" | "FALTOU" | "CANCELADO";
  }[] = [
    { patientId: mariana.id, professionalId: ana.id, procedureName: "Limpeza / profilaxia", roomIndex: 0, at: day(0, 9), status: "CONFIRMADO" },
    { patientId: roberto.id, professionalId: ana.id, procedureName: "Implante unitário", roomIndex: 0, at: day(0, 10, 30), status: "AGENDADO" },
    { patientId: patricia.id, professionalId: carla.id, procedureName: "Preenchimento labial", roomIndex: 2, at: day(0, 14), status: "AGENDADO" },
    { patientId: felipe.id, professionalId: bruno.id, procedureName: "Aparelho ortodôntico (instalação)", roomIndex: 1, at: day(0, 16), status: "AGENDADO" },
    { patientId: sandra.id, professionalId: carla.id, procedureName: "Toxina botulínica (3 regiões)", roomIndex: 2, at: day(1, 9), status: "AGENDADO" },
    { patientId: thiago.id, professionalId: ana.id, procedureName: "Restauração em resina", roomIndex: 0, at: day(1, 11), status: "AGENDADO" },
    { patientId: mariana.id, professionalId: ana.id, procedureName: "Consulta de avaliação", roomIndex: 0, at: day(-7, 9), status: "ATENDIDO" },
    { patientId: roberto.id, professionalId: ana.id, procedureName: "Consulta de avaliação", roomIndex: 0, at: day(-14, 15), status: "ATENDIDO" },
    { patientId: patricia.id, professionalId: carla.id, procedureName: "Limpeza de pele profunda", roomIndex: 2, at: day(-10, 10), status: "ATENDIDO" },
    { patientId: felipe.id, professionalId: bruno.id, procedureName: "Consulta de avaliação", roomIndex: 1, at: day(-5, 14), status: "FALTOU" },
    { patientId: sandra.id, professionalId: carla.id, procedureName: "Microagulhamento", roomIndex: 2, at: day(-3, 16), status: "ATENDIDO" },
  ];

  for (const item of agenda) {
    const procedure = proc(item.procedureName);
    await prisma.appointment.create({
      data: {
        clinicId: sorriso.id,
        patientId: item.patientId,
        professionalId: item.professionalId,
        roomId: rooms[item.roomIndex]?.id ?? null,
        procedureId: procedure.id,
        startsAt: item.at,
        endsAt: new Date(item.at.getTime() + procedure.durationMin * 60_000),
        status: item.status,
      },
    });
  }

  // -------------------------------------------------------------- funil ---
  const leads: [string, string, LeadSource, string, LeadStage, number, number | null][] = [
    ["Beatriz Santana", "11991110001", "INSTAGRAM", "Lentes de contato dental", "NOVO", 900_000, 0],
    ["Gustavo Pinto", "11991110002", "TRAFEGO_PAGO", "Implante", "CONTATO", 320_000, 1],
    ["Luciana Freitas", "11991110003", "INDICACAO", "Harmonização facial", "AGENDADO", 400_000, 2],
    ["Rodrigo Teixeira", "11991110004", "GOOGLE", "Clareamento", "AVALIACAO", 120_000, -1],
    ["Aline Cardoso", "11991110005", "INSTAGRAM", "Preenchimento labial", "PROPOSTA", 180_000, -2],
    ["Vinicius Rocha", "11991110006", "WHATSAPP", "Aparelho", "PROPOSTA", 150_000, 3],
    ["Juliana Prado", "11991110007", "INDICACAO", "Bioestimulador", "GANHO", 250_000, null],
    ["Marcelo Antunes", "11991110008", "FACEBOOK", "Implante", "GANHO", 320_000, null],
    ["Renata Lopes", "11991110009", "TRAFEGO_PAGO", "Lentes", "PERDIDO", 900_000, null],
    ["Paulo Cesar", "11991110010", "PASSANTE", "Limpeza", "PERDIDO", 18_000, null],
  ];

  for (const [name, phone, source, interest, stage, valueCents, followUp] of leads) {
    const lead = await prisma.lead.create({
      data: {
        clinicId: sorriso.id,
        name,
        phone,
        source,
        interest,
        stage,
        valueCents,
        ownerId: stage === "GANHO" ? ana.id : recepcao?.id,
        nextFollowUpAt: followUp === null ? null : dateOnly(followUp),
        lostReason:
          stage === "PERDIDO"
            ? name === "Renata Lopes"
              ? "Preço acima do esperado"
              : "Sem resposta após varias tentativas"
            : null,
      },
    });

    await prisma.leadActivity.create({
      data: {
        clinicId: sorriso.id,
        leadId: lead.id,
        userId: recepcao?.id,
        type: "WHATSAPP",
        content: `Primeiro contato feito. Interesse em ${interest.toLowerCase()}.`,
      },
    });

    if (stage === "PROPOSTA" || stage === "GANHO") {
      await prisma.leadActivity.create({
        data: {
          clinicId: sorriso.id,
          leadId: lead.id,
          userId: ana.id,
          type: "MUDANCA_ETAPA",
          content: "Avaliação feita -> Proposta enviada",
        },
      });
    }
  }

  // ---------------------------------------------------------- orçamentos --
  const implante = proc("Implante unitário");
  const canal = proc("Tratamento de canal");
  const lente = proc("Lente de contato dental (por dente)");
  const botox = proc("Toxina botulínica (3 regiões)");

  const planoRoberto = await prisma.treatmentPlan.create({
    data: {
      clinicId: sorriso.id,
      patientId: roberto.id,
      professionalId: ana.id,
      number: 1,
      status: "APROVADO",
      approvedAt: day(-12),
      discountCents: 50_000,
      notes: "Paciente optou por comecar pelo lado direito.",
      items: {
        create: [
          {
            clinicId: sorriso.id,
            procedureId: implante.id,
            description: implante.name,
            teeth: ["46"],
            quantity: 1,
            unitPriceCents: implante.priceCents,
            done: true,
            doneAt: day(-5),
          },
          {
            clinicId: sorriso.id,
            procedureId: canal.id,
            description: canal.name,
            teeth: ["36"],
            quantity: 1,
            unitPriceCents: canal.priceCents,
          },
        ],
      },
    },
  });

  const totalRoberto = implante.priceCents + canal.priceCents - 50_000;
  const parcelaRoberto = Math.floor(totalRoberto / 6);
  const sobraRoberto = totalRoberto - parcelaRoberto * 6;

  for (let i = 0; i < 6; i += 1) {
    const amountCents = i === 0 ? parcelaRoberto + sobraRoberto : parcelaRoberto;
    const paid = i < 2;

    const installment = await prisma.installment.create({
      data: {
        clinicId: sorriso.id,
        patientId: roberto.id,
        planId: planoRoberto.id,
        number: i + 1,
        totalCount: 6,
        dueDate: dateOnly(-30 + i * 30),
        amountCents,
        paidCents: paid ? amountCents : 0,
        status: paid ? "PAGA" : "ABERTA",
        method: "PIX",
      },
    });

    if (paid) {
      await prisma.payment.create({
        data: {
          clinicId: sorriso.id,
          installmentId: installment.id,
          amountCents,
          method: "PIX",
          paidAt: dateOnly(-30 + i * 30),
          userId: financeiro?.id,
        },
      });
    }
  }

  await prisma.treatmentPlan.create({
    data: {
      clinicId: sorriso.id,
      patientId: mariana.id,
      professionalId: ana.id,
      number: 2,
      status: "ENVIADO",
      notes: "Orçamento de 6 lentes, enviado por WhatsApp.",
      items: {
        create: Array.from({ length: 6 }, (_, index) => ({
          clinicId: sorriso.id,
          procedureId: lente.id,
          description: lente.name,
          teeth: [["13", "12", "11", "21", "22", "23"][index] ?? "11"],
          quantity: 1,
          unitPriceCents: lente.priceCents,
        })),
      },
    },
  });

  await prisma.treatmentPlan.create({
    data: {
      clinicId: sorriso.id,
      patientId: patricia.id,
      professionalId: carla.id,
      number: 3,
      status: "RASCUNHO",
      items: {
        create: [
          {
            clinicId: sorriso.id,
            procedureId: botox.id,
            description: botox.name,
            region: "Terço superior",
            quantity: 1,
            unitPriceCents: botox.priceCents,
          },
        ],
      },
    },
  });

  // -------------------------------------------------------- prontuarios ---
  await prisma.anamnesis.create({
    data: {
      clinicId: sorriso.id,
      patientId: roberto.id,
      answers: {
        tratamento_medico: true,
        medicamento_continuo: true,
        hipertensao: true,
        alergia: true,
        diabetes: false,
        fumante: false,
      },
      allergies: "Alergia a penicilina.",
      medications: "Losartana 50mg, uma vez ao dia.",
      conditions: "Hipertensão controlada.",
    },
  });

  await prisma.toothChart.create({
    data: {
      clinicId: sorriso.id,
      patientId: roberto.id,
      data: {
        "46": { status: "IMPLANTE" },
        "36": { status: "CANAL" },
        "16": { status: "RESTAURADO", faces: ["O"] },
        "26": { status: "CARIE", faces: ["O", "M"] },
        "18": { status: "AUSENTE" },
      },
    },
  });

  await prisma.clinicalNote.createMany({
    data: [
      {
        clinicId: sorriso.id,
        patientId: roberto.id,
        professionalId: ana.id,
        content:
          "Paciente compareceu para instalação do implante no 46. Anestesia infiltrativa, fresagem sequencial, implante 4.0x10mm com torque de 35 Ncm. Sutura com nylon 5-0. Orientado sobre dieta fria nas primeiras 24h.",
        performed: "Implante 46",
        createdAt: day(-5, 10),
      },
      {
        clinicId: sorriso.id,
        patientId: roberto.id,
        professionalId: ana.id,
        content:
          "Retorno para remocao de sutura. Cicatrização dentro do esperado, sem sinais de infecção. Agendado inicio do canal do 36.",
        performed: "Remocao de sutura",
        createdAt: day(-2, 10),
      },
      {
        clinicId: sorriso.id,
        patientId: patricia.id,
        professionalId: carla.id,
        content:
          "Limpeza de pele profunda com extração de comedoes em zona T. Pele reativa, aplicado calmante pos-procedimento. Orientada a evitar exposição solar por 48h.",
        performed: "Limpeza de pele",
        createdAt: day(-10, 11),
      },
    ],
  });

  // ------------------------------------------- segunda clínica (isolamento) --
  const bellavita = await prisma.clinic.create({
    data: {
      name: "Bella Vita Estética",
      slug: "bella-vita",
      defaultCommissionPct: 25,
      users: {
        create: {
          name: "Dra. Helena Martins",
          email: "helena@bellavita.com.br",
          passwordHash: senha,
          role: "OWNER",
          isProfessional: true,
          specialty: "Estética avancada",
          color: "#b45309",
        },
      },
      rooms: { create: [{ name: "Sala 1" }] },
      procedures: {
        create: [
          { name: "Drenagem linfática", category: "ESTETICA", priceCents: 15_000, durationMin: 60 },
          { name: "Peeling químico", category: "ESTETICA", priceCents: 45_000, durationMin: 45 },
        ],
      },
    },
  });

  await prisma.patient.create({
    data: {
      clinicId: bellavita.id,
      name: "Paciente da outra clínica",
      phone: "11999990000",
      source: "SITE",
    },
  });

  console.log(`
Seed concluído.

  Clínica: ${sorriso.name}
    ana@sorrisoestetica.com.br        (Proprietária)   senha: odonto123
    bruno@sorrisoestetica.com.br      (Profissional)   senha: odonto123
    carla@sorrisoestetica.com.br      (Profissional)   senha: odonto123
    recepcao@sorrisoestetica.com.br   (Recepção)       senha: odonto123
    financeiro@sorrisoestetica.com.br (Financeiro)     senha: odonto123

  Clínica: ${bellavita.name}
    helena@bellavita.com.br           (Proprietária)   senha: odonto123
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
