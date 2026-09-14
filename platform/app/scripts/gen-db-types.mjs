/**
 * Gera src/server/db-types.ts e corrige duas armadilhas do driver.
 *
 * 1. bigint (int8) chega como STRING no node-pg. Como todo dinheiro do sistema
 *    e bigint de centavos, isso espalharia `Number(x)` por toda a base — e um
 *    `+` esquecido viraria concatenacao de string silenciosa. Convertemos no
 *    driver e ajustamos o tipo. Centavos cabem com folga em Number.
 *
 * 2. `date` chega como Date em MEIA-NOITE LOCAL. Em UTC-3, `toISOString()` de
 *    um vencimento 2026-03-14 devolve 2026-03-13 — o off-by-one classico em
 *    parcela, validade de lote e competencia. Tratamos date como string
 *    'YYYY-MM-DD', que e o que ela e.
 *
 * 3. Colunas preenchidas por TRIGGER (numero sequencial por rede) sao NOT NULL
 *    sem DEFAULT, entao o gerador as marca como obrigatorias no insert. Quem
 *    escreve a feature nao deve — nem consegue — calcular esse numero. Elas
 *    entram na lista TRIGGER_GENERATED abaixo e viram Generated<>.
 *
 * Uso: node scripts/gen-db-types.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import "dotenv/config";

const OUT = new URL("../src/server/db-types.ts", import.meta.url);

/**
 * Colunas cujo valor nasce de trigger. Mantida a mao porque nao ha como
 * distinguir isso por introspeccao: para o catalogo, elas sao NOT NULL sem
 * default, exatamente como uma coluna que o app deveria preencher.
 */
const TRIGGER_GENERATED = {
  patient: ["code"],   // assign_patient_code: sequencial por rede
  quote: ["number"],   // assign_quote_number: sequencial por rede
};

execFileSync(
  "npx",
  ["kysely-codegen", "--dialect", "postgres", "--out-file", "src/server/db-types.ts",
   "--camel-case", "false", "--singularize", "false"],
  { stdio: "inherit", cwd: new URL("..", import.meta.url).pathname },
);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query(`
  select table_name, column_name
  from information_schema.columns
  where table_schema = 'public' and data_type = 'date'
  order by table_name, column_name
`);
await client.end();

const pascal = (name) =>
  name.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");

const dateColumns = new Map();
for (const row of rows) {
  const iface = pascal(row.table_name);
  if (!dateColumns.has(iface)) dateColumns.set(iface, new Set());
  dateColumns.get(iface).add(row.column_name);
}

let src = readFileSync(OUT, "utf8");

// 1. bigint como numero.
src = src.replace(
  /export type Int8 = ColumnType<string, [^>]+>;/,
  `/** Centavos e contadores. O parser do driver converte int8 para number. */\nexport type Int8 = ColumnType<number, bigint | number | string, bigint | number | string>;`,
);

// 2. date como string ISO.
src = src.replace(
  /export type Timestamp = ColumnType<Date[^>]*>;/,
  (match) =>
    `${match}\n\n/** Data sem hora, no formato 'YYYY-MM-DD'. Nunca vira Date: ver scripts/gen-db-types.mjs. */\nexport type DateOnly = ColumnType<string, Date | string, Date | string>;`,
);

const generatedColumns = new Map(
  Object.entries(TRIGGER_GENERATED).map(([table, cols]) => [pascal(table), new Set(cols)]),
);

let patched = 0;
let marked = 0;
src = src.replace(
  /export interface (\w+) \{\n([\s\S]*?)\n\}/g,
  (whole, iface, body) => {
    const dates = dateColumns.get(iface);
    const generated = generatedColumns.get(iface);
    if (!dates && !generated) return whole;

    const nextBody = body
      .split("\n")
      .map((line) => {
        const m = line.match(/^(\s*)(\w+): (.*);$/);
        if (!m) return line;
        let type = m[3];

        if (dates?.has(m[2])) {
          type = type.replace(/Timestamp/g, "DateOnly");
          patched += 1;
        }
        if (generated?.has(m[2]) && !type.startsWith("Generated<")) {
          type = `Generated<${type}>`;
          marked += 1;
        }

        return `${m[1]}${m[2]}: ${type};`;
      })
      .join("\n");

    return `export interface ${iface} {\n${nextBody}\n}`;
  },
);

writeFileSync(OUT, src, "utf8");
console.log(
  `Int8 -> number; ${patched} colunas date -> DateOnly em ${dateColumns.size} tabelas; ` +
    `${marked} colunas de trigger marcadas como Generated.`,
);
