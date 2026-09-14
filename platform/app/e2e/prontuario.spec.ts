import { expect, test, type Page } from "@playwright/test";

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const PROFISSIONAL = "carla@sorriso.com.br";
const RECEPCAO = "recepcao@sorriso.com.br";

const ROBERTO = "0a222222-2222-7222-8222-222222222222";

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

test.describe("abrir o prontuario", () => {
  test("do resumo do paciente para a ficha clinica", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/pacientes/${ROBERTO}`);
    await page.getByRole("link", { name: "Prontuário" }).click();

    await page.waitForURL(/\/prontuario$/);
    await expect(page.getByRole("heading", { name: "Roberto Carvalho", level: 1 })).toBeVisible();

    // O alerta clinico e a primeira coisa que tem que aparecer.
    await expect(page.getByText(/Atenção clínica/)).toBeVisible();
    await expect(page.getByText("Alergia: penicilina")).toBeVisible();

    // E a tela avisa que a abertura ficou registrada.
    await expect(page.getByText(/ficou registrada na trilha de acesso/)).toBeVisible();
  });

  test("quem so tem cadastro nao chega no prontuario", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto(`/pacientes/${ROBERTO}`);

    // Nem o botao aparece...
    await expect(page.getByRole("link", { name: "Prontuário" })).toHaveCount(0);

    // ...nem a rota digitada a mao abre.
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);
    await expect(page).toHaveURL(/\/sem-permissao/);
    await expect(page.getByText(/Abrir prontu/)).toBeVisible();
  });
});

test.describe("odontograma", () => {
  test("mostra o que a boca tem, dente a dente", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    // 32 dentes permanentes, cada um clicavel.
    const dentes = page.getByRole("button", { name: /^Dente \d{2} —/ });
    await expect(dentes).toHaveCount(32);

    // O 46 esta ausente no seed.
    await expect(page.getByRole("button", { name: /Dente 46 —[\s\S]*Ausente/ })).toBeVisible();
  });

  test("clicar num dente mostra o historico dele", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    await page.getByRole("button", { name: /^Dente 36 —/ }).click();

    await expect(page.getByRole("heading", { name: /Dente 36/ })).toBeVisible();
    await expect(page.getByText("Cárie ativa, dentina.")).toBeVisible();
  });

  test("profissional registra uma condicao e ela entra na ficha", async ({ page }) => {
    await entrar(page, PROFISSIONAL);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    await page.getByRole("button", { name: /^Dente 15 —/ }).click();
    await page.getByLabel("Condição").selectOption("caries");
    await page.getByText("Oclusal", { exact: true }).click();
    await page.getByRole("button", { name: "Registrar no dente" }).click();

    await expect(page.getByText(/Registrado/)).toBeVisible();
  });

  test("condicao de face sem face escolhida e recusada", async ({ page }) => {
    await entrar(page, PROFISSIONAL);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    await page.getByRole("button", { name: /^Dente 17 —/ }).click();
    await page.getByLabel("Condição").selectOption("caries");
    await page.getByRole("button", { name: "Registrar no dente" }).click();

    await expect(page.getByText("Escolha ao menos uma face.")).toBeVisible();
  });
});

test.describe("evolucao clinica", () => {
  test("o aditamento aparece junto da evolucao que corrige", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    const original = page
      .locator("li")
      .filter({ hasText: "Paciente relata dor ao mastigar" })
      .first();

    await expect(original.getByText("fechada")).toBeVisible();
    await expect(original.getByText(/Aditamento: Dente anotado errado/)).toBeVisible();
    await expect(original.getByText(/a cárie oclusal é no 36/)).toBeVisible();
  });

  test("profissional registra evolucao e ela nasce assinada", async ({ page }) => {
    await entrar(page, PROFISSIONAL);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    const texto = `Avaliação de harmonização facial. Registro de teste ${Date.now()}.`;
    await page.getByLabel("Nova evolução").fill(texto);
    await page.getByRole("button", { name: "Registrar evolução" }).click();

    await expect(page.getByText("Evolução registrada e assinada.")).toBeVisible();

    await page.reload();
    const nova = page.locator("li").filter({ hasText: texto }).first();
    await expect(nova.getByText("assinada")).toBeVisible();
  });

  test("texto curto demais nao vira evolucao", async ({ page }) => {
    await entrar(page, PROFISSIONAL);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    await page.getByLabel("Nova evolução").fill("ok");
    await page.getByRole("button", { name: "Registrar evolução" }).click();

    await expect(page.getByText(/ao menos 10 caracteres/)).toBeVisible();
  });
});

test.describe("anamnese", () => {
  test("responder muda o alerta do topo", async ({ page }) => {
    await entrar(page, PROFISSIONAL);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    await page.getByRole("button", { name: "Atualizar anamnese" }).click();
    await page.getByLabel("Está grávida?").selectOption("sim");
    await page.getByRole("button", { name: "Salvar anamnese" }).click();

    await expect(page.getByText(/Anamnese salva/)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/Atenção clínica/)).toBeVisible();
    await expect(page.getByText("Gestante")).toBeVisible();
  });
});

test.describe("trilha de acesso", () => {
  test("quem audita vê quem abriu a ficha", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    await expect(page.getByText("Quem abriu este prontuário")).toBeVisible();

    await page.getByText(/acessos? registrados?/).click();
    await expect(page.getByText("Ana Souza").first()).toBeVisible();
    await expect(page.getByText("atendimento").first()).toBeVisible();
  });

  test("profissional não vê a trilha dos colegas", async ({ page }) => {
    await entrar(page, PROFISSIONAL);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    await expect(page.getByText("Odontograma")).toBeVisible();
    await expect(page.getByText("Quem abriu este prontuário")).toHaveCount(0);
  });
});
