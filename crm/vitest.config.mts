import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Os testes de isolamento falam com o Postgres de desenvolvimento; o Next
// carrega o .env sozinho, o Vitest nao.
loadEnv();

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // O teste de isolamento escreve no banco: rodar em paralelo com ele mesmo
    // embaralharia as contagens.
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
