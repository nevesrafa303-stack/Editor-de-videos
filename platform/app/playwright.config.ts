import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(import.meta.dirname, ".env") });

const PORT = 3100;

const CHROMIUM = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // O Chromium ja vem instalado na imagem; apontar o executavel evita o
        // download que o runner tentaria fazer por causa do numero de build.
        ...(CHROMIUM ? { launchOptions: { executablePath: CHROMIUM } } : {}),
      },
    },
  ],
  webServer: {
    // O reset vem AQUI, e nao em `globalSetup`, porque o Playwright sobe o
    // webServer ANTES do globalSetup. Recriar o banco sob um servidor ja de pe
    // deixava o processo com os OIDs dos enums do banco anterior — e OID de
    // tipo e por banco. O sintoma era `surfaces.join is not a function` numa
    // tela so, de vez em quando, conforme o servidor tivesse ou nao servido
    // algum request antes do reset. Teste que falha por isso nao esta medindo
    // regressao nenhuma.
    //
    // Roda o build de producao: e o mesmo artefato que iria pro ar, e e onde
    // um vazamento de modulo de servidor pro bundle do navegador aparece.
    command: `../db/reset.sh && npx next build && npx next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/entrar`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
