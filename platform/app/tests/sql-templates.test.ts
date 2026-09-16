/**
 * Crase dentro de SQL não existe.
 *
 * Este teste nasceu de errar a mesma coisa três vezes. As consultas cruas
 * moram em template literal — `` sql`select ...` `` — e uma crase escrita num
 * comentário SQL (`-- veja `unit``) FECHA o template. O erro que sai é de
 * sintaxe de TypeScript, apontando para o meio de uma frase em português, e
 * não diz nada sobre a causa.
 *
 * Uma regra que eu quebro toda vez que escrevo um comentário é uma regra que
 * precisa de máquina. Esta é a máquina.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = join(import.meta.dirname, "..", "src");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return caminho.endsWith(".ts") || caminho.endsWith(".tsx") ? [caminho] : [];
  });
}

/**
 * Linhas de comentário SQL (`--`) que carregam crase.
 *
 * Procura só dentro de comentário porque é lá que a prosa mora — e porque
 * crase em `sql.raw` ou em identificador citado seria outro problema, não
 * este. Basta uma crase para quebrar: a segunda só decide onde.
 */
function crasesEmComentarioSql(conteudo: string): string[] {
  const ruins: string[] = [];
  let dentro = false;

  for (const linha of conteudo.split("\n")) {
    if (/(?:await sql|= sql|return sql)\s*</.test(linha) || /\bsql`/.test(linha)) dentro = true;
    if (dentro && /`\.execute|`\s*;?\s*$/.test(linha) && !/sql`/.test(linha)) {
      // Fim provável do template. Não é exato, e não precisa ser: falso
      // positivo aqui vira um comentário reescrito, que não custa nada.
    }
    if (dentro && linha.trimStart().startsWith("--") && linha.includes("`")) {
      ruins.push(linha.trim());
    }
    if (/`\.execute\(/.test(linha)) dentro = false;
  }

  return ruins;
}

describe("consultas cruas", () => {
  it("nenhum comentário dentro de SQL usa crase", () => {
    const problemas: string[] = [];

    for (const caminho of arquivos(RAIZ)) {
      const conteudo = readFileSync(caminho, "utf8");
      if (!conteudo.includes("sql`")) continue;

      for (const linha of crasesEmComentarioSql(conteudo)) {
        problemas.push(`${caminho.replace(RAIZ, "src")}: ${linha}`);
      }
    }

    expect(problemas).toEqual([]);
  });
});
