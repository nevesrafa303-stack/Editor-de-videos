/**
 * Porta publica do prontuario.
 *
 * Fora daqui, importa-se `@/modules/chart` — nunca um arquivo interno.
 */
export {
  getPatientChart,
  getChartAccessLog,
  type PatientChart,
  type ChartNote,
  type ToothState,
} from "@/modules/chart/queries";

export {
  addClinicalNote,
  amendClinicalNote,
  recordTooth,
  saveAnamnesis,
} from "@/modules/chart/commands";

export {
  SURFACES,
  TOOTH_CONDITIONS,
  WHOLE_TOOTH,
  addNoteSchema,
  amendNoteSchema,
  recordToothSchema,
  saveAnamnesisSchema,
  type FormField,
  type Surface,
  type ToothCondition,
} from "@/modules/chart/schema";
