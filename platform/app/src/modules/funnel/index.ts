/** Porta publica do modulo de funil. */
export {
  getBoard,
  getOpportunity,
  listStages,
  listOpenTasks,
  listLossReasons,
  listSources,
  type FunnelBoard,
  type StageColumn,
  type CardRow,
  type OpportunityDetail,
  type ActivityRow,
  type TaskRow,
} from "@/modules/funnel/queries";

export {
  createLead,
  moveStage,
  loseOpportunity,
  reopenOpportunity,
  logActivity,
  createTask,
  completeTask,
  convertLead,
} from "@/modules/funnel/commands";

export {
  OPPORTUNITY_STATUS,
  LEAD_STATUS,
  ACTIVITY_KINDS,
  TASK_PRIORITIES,
  type OpportunityStatus,
  type LeadStatus,
  type ActivityKind,
  type TaskPriority,
} from "@/modules/funnel/schema";
