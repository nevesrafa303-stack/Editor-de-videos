/**
 * Porta publica do modulo de pacientes.
 *
 * Fora daqui, importa-se `@/modules/patient` — nunca um arquivo interno. E o
 * que permite trocar o interior sem cacar importacoes pela base, e o que torna
 * visivel quando dois dominios estao grudados demais.
 */
export {
  listPatients,
  getPatientSummary,
  getPatientChart,
  type PatientListItem,
} from "@/modules/patient/queries";

export {
  createPatient,
  updatePatient,
  deactivatePatient,
  type CreatedPatient,
} from "@/modules/patient/commands";

export {
  createPatientSchema,
  listPatientsSchema,
  type CreatePatientInput,
  type ListPatientsInput,
} from "@/modules/patient/schema";
