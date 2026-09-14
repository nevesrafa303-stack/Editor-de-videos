/**
 * Recria o banco antes da suite.
 *
 * Teste de integracao que depende do que sobrou da execucao anterior nao mede
 * regressao: mede sujeira. O reset custa cerca de tres segundos e paga isso na
 * primeira vez que um teste falha e a causa e obvia.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

export default function setup(): void {
  const script = path.resolve(import.meta.dirname, "../../db/reset.sh");
  execFileSync(script, [], {
    stdio: "inherit",
    env: { ...process.env, QUIET: "1" },
  });
}
