import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "vitest/config";

loadEnv({ path: path.resolve(import.meta.dirname, ".env") });

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Os testes de integracao compartilham um banco: rodar arquivos em
    // paralelo embaralharia contagens e sequencias.
    fileParallelism: false,
    globalSetup: ["./tests/global-setup.ts"],
    hookTimeout: 30_000,
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
});
