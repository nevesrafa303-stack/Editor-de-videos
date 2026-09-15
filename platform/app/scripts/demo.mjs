/**
 * Monta o cenário de demonstração PELA INTERFACE.
 *
 * Plantar o estado direto no banco mente: mostra uma tela que talvez nem seja
 * alcançável clicando. Este script faz o que a clínica faria — monta o
 * orçamento, aceita, abre o caixa e recebe — e por isso quebra quando o
 * caminho quebra, que é exatamente o que se quer de um roteiro de demonstração.
 *
 *   ../db/reset.sh && npx next build && npx next start --port 3200 &
 *   node scripts/demo.mjs && node scripts/capturas.mjs
 */
import { chromium } from "@playwright/test";

const BASE = process.env.DEMO_URL ?? "http://127.0.0.1:3200";
const SENHA = "senha-de-teste-123";
const ROBERTO = "0a222222-2222-7222-8222-222222222222";

const CHROMIUM =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const browser = await chromium.launch({ executablePath: CHROMIUM });
const context = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
const page = await context.newPage();

await page.goto(`${BASE}/entrar`);
await page.getByLabel("E-mail").fill("ana@sorriso.com.br");
await page.getByLabel("Senha").fill(SENHA);
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL(/pacientes/);

// ---------------------------------------------------------------- orçamento --
await page.goto(`${BASE}/orcamentos/novo?paciente=${ROBERTO}`);
await page.getByLabel("Título").fill("Reabilitação inferior direita");
await page.getByRole("button", { name: "Criar orçamento" }).click();
await page.waitForURL(/orcamentos\/[0-9a-f-]{36}$/);

await page.getByLabel("Parcelas").selectOption("6");
await page.getByLabel("Entrada (R$)").fill("800,00");
await page.getByRole("button", { name: "Salvar condições" }).click();
await page.getByText("Condições atualizadas.").waitFor();

await page.getByRole("button", { name: "Enviar ao paciente" }).click();
await page.getByText("Orçamento enviado ao paciente.").waitFor();

await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
await page.getByLabel("Quem está aceitando").fill("Roberto Carvalho");
await page.getByRole("button", { name: "Confirmar aceite" }).click();
await page.getByText("Aceite registrado e assinado.").waitFor();
console.log("orçamento aceito · parcelas geradas");

// ------------------------------------------------------------------- caixa --
await page.goto(`${BASE}/financeiro/caixa`);
await page.getByLabel("Abertura (R$)").fill("200,00");
await page.getByRole("button", { name: "Abrir caixa" }).click();
await page.getByText("Caixa aberto.").waitFor();

// A parcela vencida da Camila, em dinheiro: entra na gaveta com mora.
await page.goto(`${BASE}/financeiro?recorte=vencidas&busca=Camila`);
const linha = page.locator("li").filter({ hasText: "Camila" }).first();
await linha.getByRole("button", { name: "Receber" }).click();
await linha.getByLabel("Forma de pagamento").selectOption({ label: "Dinheiro" });
await linha.getByRole("button", { name: "Confirmar" }).click();
await page.getByText(/Parcela quitada/).waitFor();
console.log("caixa aberto · recebimento em dinheiro com mora");

await browser.close();
