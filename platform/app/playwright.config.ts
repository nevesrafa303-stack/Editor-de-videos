import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(import.meta.dirname, ".env") });

const PORT = 3100;

const CHROMIUM = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
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
    // Roda o build de producao: e o mesmo artefato que iria pro ar, e e onde
    // um vazamento de modulo de servidor pro bundle do navegador aparece.
    command: `npx next build && npx next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/entrar`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
