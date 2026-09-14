/**
 * Recria o banco antes da suite de navegador, pelo mesmo motivo do vitest:
 * cadastro de paciente e agendamento deixam rastro, e teste que depende do
 * rastro anterior mede sujeira, nao regressao.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

export default function setup(): void {
  execFileSync(path.resolve(import.meta.dirname, "../../db/reset.sh"), [], {
    stdio: "inherit",
    env: { ...process.env, QUIET: "1" },
  });
}
