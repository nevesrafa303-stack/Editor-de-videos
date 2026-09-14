/**
 * Isolamento multi-tenant.
 *
 * Modulo deliberadamente livre de dependencias do Next: e a regra mais critica
 * do sistema e precisa ser testavel direto contra um banco de verdade.
 */
import { prisma } from "@/server/db";

/**
 * Modelos que pertencem a uma clínica. Tudo que estiver nesta lista e filtrado
 * automaticamente por `clinicId` pelo cliente devolvido em `getTenantDb`.
 */
const TENANT_MODELS = new Set([
  "User",
  "Patient",
  "Lead",
  "LeadActivity",
  "Room",
  "Appointment",
  "Procedure",
  "TreatmentPlan",
  "TreatmentPlanItem",
  "Installment",
  "Payment",
  "Anamnesis",
  "ClinicalNote",
  "Attachment",
  "ToothChart",
  "AuditLog",
]);

const READ_MANY = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

const BY_UNIQUE = new Set(["findUnique", "findUniqueOrThrow"]);
const MUTATE_ONE = new Set(["update", "delete", "upsert"]);

export class TenantViolationError extends Error {
  constructor(model: string, detail = "fora da clínica da sessão") {
    super(`Operação em ${model} ${detail}. A operação foi bloqueada.`);
    this.name = "TenantViolationError";
  }
}

/**
 * Um `clinicId` explicito diferente do da sessão e sempre bug de quem chamou.
 * Silenciar isso devolvendo os dados da clínica certa esconde o erro; melhor
 * quebrar alto, em desenvolvimento, do que descobrir em produção.
 */
function assertSameClinic(model: string, value: unknown, clinicId: string): void {
  if (typeof value === "string" && value !== clinicId) {
    throw new TenantViolationError(model, "com clinicId de outra clínica");
  }
}

type AnyArgs = Record<string, unknown>;

/**
 * Devolve um Prisma Client preso a uma clínica.
 *
 * Filtrar por `clinicId` em cada query e o tipo de coisa que se esquece uma vez
 * e vira vazamento de prontuário entre clientes. Aqui o filtro e injetado na
 * camada de baixo: quem escreve uma feature não tem como esquecer, e não tem
 * como sobrescrever.
 *
 * Leitura e escrita em lote sao filtradas sozinhas. Em `create` o tipo do
 * Prisma continua exigindo `clinicId` explicito — de propósito: o compilador
 * cobra o campo e a extensao confere o valor contra a sessão, recusando a
 * escrita se não baterem.
 */
export function scopedDb(clinicId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);

          const typedArgs = (args ?? {}) as AnyArgs;

          if (READ_MANY.has(operation)) {
            const where = (typedArgs.where ?? {}) as AnyArgs;
            assertSameClinic(model, where.clinicId, clinicId);
            typedArgs.where = { ...where, clinicId };
            return query(typedArgs);
          }

          if (operation === "create") {
            const data = (typedArgs.data ?? {}) as AnyArgs;
            assertSameClinic(model, data.clinicId, clinicId);
            typedArgs.data = { ...data, clinicId };
            return query(typedArgs);
          }

          if (operation === "createMany" || operation === "createManyAndReturn") {
            const data = typedArgs.data;
            const rows = Array.isArray(data) ? data : [data];
            for (const row of rows) {
              assertSameClinic(model, (row as AnyArgs).clinicId, clinicId);
            }
            typedArgs.data = Array.isArray(data)
              ? data.map((row) => ({ ...(row as AnyArgs), clinicId }))
              : { ...(data as AnyArgs), clinicId };
            return query(typedArgs);
          }

          if (BY_UNIQUE.has(operation)) {
            const found = (await query(typedArgs)) as { clinicId?: string } | null;
            if (found && found.clinicId !== clinicId) return null;
            return found;
          }

          if (MUTATE_ONE.has(operation)) {
            // `update`/`delete`/`upsert` so aceitam campos unicos no where, e
            // nem todo modelo e identificado por `id` (o odontograma, por
            // exemplo, e único por paciente). Conferimos a posse antes de
            // escrever, usando o próprio seletor que veio.
            const selector = flattenUniqueWhere((typedArgs.where ?? {}) as AnyArgs);
            if (Object.keys(selector).length === 0) {
              throw new TenantViolationError(model, "sem identificador unico no where");
            }

            const delegate = (prisma as unknown as Record<string, {
              findFirst: (a: unknown) => Promise<unknown>;
            }>)[lowerFirst(model)];

            const owned = await delegate.findFirst({
              where: { ...selector, clinicId },
              select: { id: true },
            });

            if (!owned) {
              if (operation === "upsert") {
                // Não basta não ser nosso: se existir um registro de outra
                // clínica com o mesmo seletor único, o upsert do Prisma cairia
                // no ramo de update e sobrescreveria o dado alheio.
                const foreign = await delegate.findFirst({
                  where: selector,
                  select: { id: true },
                });
                if (foreign) throw new TenantViolationError(model);

                const create = (typedArgs.create ?? {}) as AnyArgs;
                assertSameClinic(model, create.clinicId, clinicId);
                typedArgs.create = { ...create, clinicId };
                return query(typedArgs);
              }
              throw new TenantViolationError(model);
            }

            return query(typedArgs);
          }

          return query(typedArgs);
        },
      },
    },
  });
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

/**
 * Achata seletor único composto do Prisma. `{ clinicId_email: { clinicId, email } }`
 * vira `{ clinicId, email }`, que e o formato que `findFirst` entende.
 */
function flattenUniqueWhere(where: AnyArgs): AnyArgs {
  const flat: AnyArgs = {};

  for (const [key, value] of Object.entries(where)) {
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(flat, value as AnyArgs);
    } else {
      flat[key] = value;
    }
  }

  return flat;
}

