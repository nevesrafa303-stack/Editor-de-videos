/**
 * Erro de validacao a partir do zod.
 *
 * Ficava copiado em cada modulo. Alem da duplicacao, cada copia usava a
 * mensagem generica no topo — e quando o formulario tem UM problema, repetir
 * "confira os campos" esconde a unica frase que resolveria: "escolha ao menos
 * uma face".
 */
import { ValidationError } from "@/shared/errors";

type ZodLike = { issues: { path: PropertyKey[]; message: string }[] };

export function toValidationError(error: ZodLike, fallback: string): ValidationError {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "_");
    (fieldErrors[campo] ??= []).push(issue.message);
  }

  // Um problema so, e sem campo onde encostar: a frase vai para o topo, senao
  // ela nao aparece em lugar nenhum. Tendo campo, o topo fica com o resumo e o
  // campo com a frase — sem repetir.
  const unica = error.issues[0];
  const semCampo = error.issues.length === 1 && (unica?.path.length ?? 0) === 0;

  return new ValidationError(fieldErrors, semCampo ? (unica?.message ?? fallback) : fallback);
}
