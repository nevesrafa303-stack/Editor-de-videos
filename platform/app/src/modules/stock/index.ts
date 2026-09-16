/** Porta publica do estoque. */
export {
  listProducts,
  listProductOptions,
  listExpiringLots,
  getProduct,
  getStockSummary,
  previewConsumption,
  listRecentExecutions,
  type ProdutoLinha,
  type ProdutoDetalhe,
  type ProdutoOpcao,
  type LoteLinha,
  type LoteVencendo,
  type MovimentoLinha,
  type ResumoEstoque,
  type ConsumoPrevisto,
  type ExecucaoRecente,
} from "@/modules/stock/queries";

export {
  registerPurchase,
  registerLoss,
  adjustBalance,
  executePlanItem,
  revertPlanItem,
  blockLot,
  unblockLot,
} from "@/modules/stock/commands";

export {
  formatQuantidade,
  rotuloMovimento,
  rotuloTipo,
  MOVEMENT_KINDS,
  PRODUCT_KINDS,
  type MovementKind,
  type ProductKind,
} from "@/modules/stock/schema";
