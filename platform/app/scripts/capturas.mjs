/**
 * Captura as telas do produto em PNG.
 *
 * Nao e teste: e a forma de olhar o sistema inteiro sem abrir sete abas, e de
 * comparar duas versoes lado a lado depois de uma mudanca de layout.
 *
 *   ../db/reset.sh && npx next build && npx next start --port 3200 &
 *   node scripts/capturas.mjs [destino]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.CAPTURA_URL ?? "http://127.0.0.1:3200";
const DESTINO = process.argv[2] ?? "capturas";
const SENHA = "senha-de-teste-123";

const CHROMIUM =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

/** `espera` evita capturar a tela antes de o dado chegar. */
const TELAS = [
  { nome: "01-entrar", url: "/entrar", espera: "Entrar", semSessao: true },
  { nome: "02-pacientes", url: "/pacientes", espera: "Mariana Alves" },
  { nome: "03-paciente", url: "/pacientes/0a222222-2222-7222-8222-222222222222", espera: "Roberto Carvalho" },
  { nome: "04-paciente-novo", url: "/pacientes/novo", espera: "Cadastrar paciente" },
  { nome: "05-agenda", url: `/agenda?data=${hoje}`, espera: "Grade do dia", altura: 1500 },
  { nome: "06-agenda-encaixe", url: `/agenda/novo?data=${hoje}`, espera: "Agendar" },
  { nome: "08-orcamentos", url: "/orcamentos", espera: "Esperando resposta" },
  { nome: "10-financeiro", url: "/financeiro?recorte=abertas", espera: "A receber", altura: 1300 },
  { nome: "11-caixa", url: "/financeiro/caixa", espera: "Na gaveta" },
  // Abre o primeiro orcamento da lista: assim o script nao depende de alguem
  // descobrir o id e passar por variavel de ambiente.
  {
    nome: "09-orcamento",
    url: "/orcamentos",
    clicar: "Reabilitação inferior direita",
    espera: "Condições comerciais",
    altura: 1200,
  },
  {
    nome: "12-prontuario-decidua",
    url: "/pacientes/0a222222-2222-7222-8222-222222222222/prontuario",
    clicarBotao: "Mista",
    espera: "como na troca",
    altura: 900,
  },
  {
    nome: "07-prontuario",
    url: "/pacientes/0a222222-2222-7222-8222-222222222222/prontuario",
    espera: "Odontograma",
    altura: 1500,
  },
];

const destino = path.resolve(DESTINO);
await mkdir(destino, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROMIUM });
const OPCOES = {
  viewport: { width: 1360, height: 1000 },
  deviceScaleFactor: 2,
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
};

const context = await browser.newContext(OPCOES);

const page = await context.newPage();

// Sessao: as telas internas nao existem sem ela.
await page.goto(`${BASE}/entrar`);
await page.getByLabel("E-mail").fill("ana@sorriso.com.br");
await page.getByLabel("Senha").fill(SENHA);
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL(/\/pacientes/);

for (const tela of TELAS) {
  // Tela publica vai em contexto proprio: limpar cookie no contexto logado
  // derrubaria a sessao das telas seguintes.
  const anonimo = tela.semSessao ? await browser.newContext(OPCOES) : null;
  const alvo = anonimo ? await anonimo.newPage() : page;

  await alvo.setViewportSize({ width: 1360, height: tela.altura ?? 1000 });
  await alvo.goto(`${BASE}${tela.url}`);

  if (tela.clicarBotao) {
    await alvo.getByRole("button", { name: tela.clicarBotao, exact: true }).first().click();
  }

  if (tela.clicar) {
    await alvo.getByRole("link", { name: tela.clicar }).first().click();
    await alvo.waitForLoadState("networkidle");
  }

  await alvo.getByText(tela.espera).first().waitFor({ state: "visible" });
  await alvo.waitForTimeout(250);

  const arquivo = path.join(destino, `${tela.nome}.png`);
  await alvo.screenshot({ path: arquivo, fullPage: true });
  console.log(arquivo);

  if (anonimo) await anonimo.close();
}

await browser.close();
