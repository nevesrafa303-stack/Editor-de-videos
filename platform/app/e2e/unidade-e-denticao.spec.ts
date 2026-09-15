import { expect, test, type Page } from "@playwright/test";

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br"; // atende nas duas unidades da Rede Sorriso
const RECEPCAO = "recepcao@sorriso.com.br"; // só na Sorriso Centro
const ROBERTO = "0a222222-2222-7222-8222-222222222222";

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

test.describe("troca de unidade", () => {
  test("quem atende em duas unidades escolhe no menu, e a agenda acompanha", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/agenda");

    // O nome da unidade também aparece no seletor do menu; a asserção olha só
    // o conteúdo da página.
    const conteudo = page.locator("main");
    await expect(conteudo.getByText("Sorriso Centro")).toBeVisible();

    await page.getByLabel("Unidade").selectOption({ label: "Sorriso Zona Sul" });
    await page.waitForURL(/\/agenda/);

    // A agenda passa a ser a da outra unidade.
    await expect(conteudo.getByText("Sorriso Zona Sul")).toBeVisible();
    await expect(conteudo.getByText("Sorriso Centro")).toHaveCount(0);

    // E a escolha sobrevive à navegação: vive na sessão, não na URL.
    await page.goto("/pacientes");
    await page.goto("/agenda");
    await expect(conteudo.getByText("Sorriso Zona Sul")).toBeVisible();
  });

  test("quem atende em uma unidade só não escolhe nada", async ({ page }) => {
    await entrar(page, RECEPCAO);

    await expect(page.getByLabel("Unidade")).toHaveCount(0);
    await expect(page.locator("nav").getByText("Sorriso Centro")).toBeVisible();
  });
});

test.describe("ocupação", () => {
  test("mostra o que dá para vender e o expediente cheio", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/agenda");

    const resumo = page.getByRole("region", { name: "Resumo do dia" });
    await expect(resumo.getByText("Ocupação", { exact: true })).toBeVisible();

    // Almoço não conta como capacidade ociosa: o texto traz os dois números.
    await expect(resumo.getByText(/vendáveis/)).toBeVisible();
    await expect(resumo.getByText(/do expediente de/)).toBeVisible();
  });
});

test.describe("dentição", () => {
  test("alterna entre permanente, decídua e mista", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    // Adulto: 32 permanentes.
    await expect(page.getByRole("button", { name: /^Dente \d{2} —/ })).toHaveCount(32);
    await expect(page.getByRole("button", { name: /^Dente 51 —/ })).toHaveCount(0);

    await page.getByRole("button", { name: "Decídua" }).click();
    await expect(page.getByRole("button", { name: /^Dente \d{2} —/ })).toHaveCount(20);
    await expect(page.getByRole("button", { name: /^Dente 51 —/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Dente 16 —/ })).toHaveCount(0);

    await page.getByRole("button", { name: "Mista" }).click();
    await expect(page.getByRole("button", { name: /^Dente \d{2} —/ })).toHaveCount(52);
    await expect(page.getByText(/como na troca/)).toBeVisible();
  });

  test("registra condição em dente de leite", async ({ page }) => {
    await entrar(page, "carla@sorriso.com.br");
    await page.goto(`/pacientes/${ROBERTO}/prontuario`);

    await page.getByRole("button", { name: "Decídua" }).click();
    await page.getByRole("button", { name: /^Dente 54 —/ }).click();

    await page.getByLabel("Condição").selectOption("caries");
    await page.getByText("Oclusal", { exact: true }).click();
    await page.getByRole("button", { name: "Registrar no dente" }).click();

    await expect(page.getByText(/Registrado/)).toBeVisible();
  });
});
