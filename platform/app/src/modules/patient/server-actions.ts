"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import type { ActionState } from "@/shared/action-state";
import { createPatient } from "@/modules/patient/commands";

/**
 * Ações de formulário do módulo de pacientes.
 *
 * Ficam separadas do módulo puro (`commands.ts`) porque "use server" amarra o
 * arquivo ao Next: o módulo continua testável sem framework nenhum.
 *
 * Exportadas como função async DECLARADA, não como const. Arquivo "use server"
 * só reconhece a primeira forma; a segunda faz o Next tentar empacotar a cadeia
 * inteira (incluindo o driver do Postgres) no bundle do navegador.
 */
const cadastrar = formAction(async (ctx, formData) => {
  const paciente = await createPatient(ctx, {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    taxId: String(formData.get("taxId") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    gender: readGender(formData.get("gender")),
  });

  revalidatePath("/pacientes");
  redirect(`/pacientes/${paciente.id}`);
}, "patient.write");

export async function cadastrarPacienteAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return cadastrar(previous, formData);
}

function readGender(value: FormDataEntryValue | null) {
  const options = ["feminino", "masculino", "outro", "nao_informado"] as const;
  const text = String(value ?? "");
  return options.find((option) => option === text) ?? null;
}
