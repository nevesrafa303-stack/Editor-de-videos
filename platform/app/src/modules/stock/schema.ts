import { z } from "zod";

export const MOVEMENT_KINDS = [
  "purchase",
  "consumption",
  "loss",
  "transfer_in",
  "transfer_out",
  "adjustment",
  "return",
  "sale",
] as const;
export type MovementKind = (typeof MOVEMENT_KINDS)[number];

export const PRODUCT_KINDS = [
  "consumable",
  "injectable",
  "medication",
  "instrument",
  "equipment",
  "retail",
] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

/**
 * Quantidade em unidade de ESTOQUE, que pode ser fracionaria.
 *
 * "0,33 frasco" nao e arredondamento: e o frasco comecado que esta na
 * geladeira. Por isso quantidade nao e inteiro — e por isso tambem nao e
 * dinheiro: aqui a fracao e o fato, e nao um centavo perdido.
 *
 * Aceita virgula porque o teclado brasileiro digita virgula.
 */
export const quantidade = z
  .union([z.number(), z.string()])
  .transform((v) => (typeof v === "number" ? v : Number(v.replace(",", "."))))
  .refine((v) => Number.isFinite(v), "Quantidade inválida.");

const quantidadePositiva = quantidade.refine((v) => v > 0, "A quantidade precisa ser maior que zero.");

/**
 * Entrada de material.
 *
 * O lote nasce JUNTO com a entrada, num formulario so. Separar em "cadastre o
 * lote" e depois "lance a entrada" e pedir para a pessoa fazer duas coisas
 * quando ela tem uma caixa na mao e a nota fiscal do lado.
 */
export const purchaseSchema = z
  .object({
    productId: z.uuid("Escolha o produto."),
    quantity: quantidadePositiva,
    unitCostCents: z.coerce.number().int().min(0).default(0),
    /** Obrigatorios quando o produto exige rastreio — checado no comando. */
    lotNumber: z.string().trim().max(60).nullish(),
    expiresOn: z
      .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")])
      .nullish(),
    invoiceNumber: z.string().trim().max(60).nullish(),
    notes: z.string().trim().max(300).nullish(),
  })
  .transform((v) => ({
    ...v,
    lotNumber: v.lotNumber?.length ? v.lotNumber : null,
    expiresOn: v.expiresOn?.length ? v.expiresOn : null,
    invoiceNumber: v.invoiceNumber?.length ? v.invoiceNumber : null,
    notes: v.notes?.length ? v.notes : null,
  }));

export type PurchaseInput = z.input<typeof purchaseSchema>;

/** Perda: quebrou, venceu, caiu no chao. Motivo obrigatorio — o banco exige. */
export const lossSchema = z.object({
  productId: z.uuid(),
  lotId: z.uuid().nullish(),
  quantity: quantidadePositiva,
  reason: z.string().trim().min(3, "Diga o que aconteceu com o material.").max(300),
});

export type LossInput = z.input<typeof lossSchema>;

/**
 * Acerto de inventario: a pessoa contou e deu outro numero.
 *
 * Recebe o saldo CONTADO, nao a diferenca. Quem conta o armario escreve o que
 * viu; calcular a diferenca de cabeca e onde entra o erro de sinal.
 */
export const adjustSchema = z.object({
  productId: z.uuid(),
  lotId: z.uuid().nullish(),
  countedQuantity: quantidade.refine((v) => v >= 0, "Saldo contado não pode ser negativo."),
  reason: z.string().trim().min(3, "Diga por que o saldo estava diferente.").max(300),
});

export type AdjustInput = z.input<typeof adjustSchema>;

export const executeItemSchema = z.object({
  itemId: z.uuid(),
  appointmentId: z.uuid().nullish(),
});

export type ExecuteItemInput = z.input<typeof executeItemSchema>;

export const revertItemSchema = z.object({
  itemId: z.uuid(),
  reason: z.string().trim().min(3, "Diga por que a execução está sendo estornada.").max(300),
});

export type RevertItemInput = z.input<typeof revertItemSchema>;

export const listProductsSchema = z.object({
  search: z.string().trim().max(80).nullish(),
  recorte: z.enum(["todos", "abaixo", "vencendo"]).default("todos"),
  /** Um produto so, para a ficha reaproveitar o mesmo calculo de saldo. */
  productId: z.uuid().nullish(),
});

export type ListProductsInput = z.input<typeof listProductsSchema>;

const KIND_LABEL: Record<ProductKind, string> = {
  consumable: "Consumível",
  injectable: "Injetável",
  medication: "Medicamento",
  instrument: "Instrumental",
  equipment: "Equipamento",
  retail: "Revenda",
};

export const rotuloTipo = (kind: string): string =>
  KIND_LABEL[kind as ProductKind] ?? "Produto";

const MOVEMENT_LABEL: Record<MovementKind, string> = {
  purchase: "Entrada",
  consumption: "Consumo",
  loss: "Perda",
  transfer_in: "Transferência recebida",
  transfer_out: "Transferência enviada",
  adjustment: "Acerto",
  return: "Devolução",
  sale: "Venda",
};

export const rotuloMovimento = (kind: string): string =>
  MOVEMENT_LABEL[kind as MovementKind] ?? kind;

/**
 * Quantidade como a clinica escreve.
 *
 * Sem casas decimais quando e inteiro ("5 frascos", nao "5,0000 frascos") e
 * com ate QUATRO quando nao e — exatamente o que a coluna guarda.
 *
 * Quatro e nao tres, e isso ja foi bug duas vezes na mesma fatia: com tres, a
 * previa dizia "0,144 tubo" e o estoque baixava 0,1438. Numero de tela que
 * arredonda diferente do numero gravado e um numero que ninguem consegue
 * conferir — a pessoa soma o que leu e nao fecha com o saldo.
 */
export function formatQuantidade(valor: number, unidade?: string | null): string {
  const texto = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(valor);

  return unidade ? `${texto} ${plural(unidade, valor)}` : texto;
}

/**
 * "5 frascos", nao "5 frasco" — e "5 ml", nao "5 mls".
 *
 * A regra e curta de proposito: acrescenta "s" so quando a unidade e uma
 * PALAVRA — quatro letras ou mais, tudo minusculo, terminando em vogal sem
 * acento. Isso cobre o que uma clinica escreve por extenso (frasco, seringa,
 * tubo, caixa, unidade, ampola, dose) e deixa em paz o que e abreviacao, que e
 * o caso em que pluralizar erraria feio.
 *
 * As tres condicoes sao necessarias, e cada uma saiu de um contraexemplo:
 * "U" termina em vogal e viraria "Us" (por isso o tamanho e a caixa);
 * "ml" e curto (por isso o tamanho); "sessao" com til nao casa a vogal.
 *
 * `stock_unit` e texto livre no catalogo, entao nao existe tabela de plurais
 * que cubra tudo. Uma unidade irregular ("par", "mes") fica no singular — um
 * preco menor do que escrever "5 frasco" na tela o dia inteiro.
 */
function plural(unidade: string, valor: number): string {
  if (Math.abs(valor) === 1) return unidade;
  const palavra = unidade.length >= 4 && /^[a-z]+$/.test(unidade);
  return palavra && /[aeiou]$/.test(unidade) ? `${unidade}s` : unidade;
}
