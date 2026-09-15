"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formAction } from "@/server/next/action";
import { comAviso } from "@/shared/flash";
import type { ActionState } from "@/shared/action-state";
import { analyzeImport, applyImport, cancelImport } from "@/modules/import/commands";

/**
 * O arquivo chega como `File` no FormData e e lido em MEMORIA.
 *
 * Nada e guardado em disco nem em bucket: o sistema ainda nao tem
 * armazenamento de arquivo, e inventar um aqui seria decidir por fora uma
 * escolha de infraestrutura que ainda nao foi feita. O que fica guardado e o
 * CONTEUDO relevante, linha a linha, na tabela `import_row` — que e o que
 * responde as perguntas depois.
 */
const analisar = formAction(async (ctx, formData) => {
  const arquivo = formData.get("arquivo");
  const colado = String(formData.get("csv") ?? "").trim();

  let csv = colado;
  let filename: string | null = null;

  if (arquivo instanceof File && arquivo.size > 0) {
    csv = await arquivo.text();
    filename = arquivo.name;
  }

  const { jobId } = await analyzeImport(ctx, { csv, filename });

  revalidatePath("/importar");
  redirect(`/importar/${jobId}`);
}, "import.write");

export async function analisarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return analisar(previous, formData);
}

const aplicar = formAction(async (ctx, formData) => {
  const jobId = String(formData.get("jobId") ?? "");
  const { importados } = await applyImport(ctx, jobId);

  revalidatePath("/importar");
  revalidatePath("/pacientes");

  redirect(
    comAviso(
      `/importar/${jobId}`,
      `${importados} ${importados === 1 ? "paciente importado" : "pacientes importados"}.`,
    ),
  );
}, "import.write");

export async function aplicarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return aplicar(previous, formData);
}

const descartar = formAction(async (ctx, formData) => {
  await cancelImport(ctx, String(formData.get("jobId") ?? ""));

  revalidatePath("/importar");
  redirect(comAviso("/importar", "Importação descartada. Nada foi criado."));
}, "import.write");

export async function descartarAction(
  previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return descartar(previous, formData);
}
