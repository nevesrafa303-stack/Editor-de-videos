import { expect, test, type Page } from "@playwright/test";

/**
 * Importador, pelo navegador.
 *
 * Dois passos é a regra: o primeiro confere e não escreve nada, o segundo
 * cria. Importação não tem desfazer, e quem traz 2.000 pacientes precisa ver
 * quantos vão entrar antes de confirmar.
 *
 * O teste do saldo sem vencimento existe porque esse caso só apareceu ao rodar
 * pela tela: a suíte de integração sempre mandava uma data, e `due_on` é
 * obrigatório no banco.
 */

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const RECEPCAO = "recepcao@sorriso.com.br";

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");

  if (!page.url().includes("/entrar")) {
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL(/\/entrar/);
  }

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

let n = 0;

/** Telefone único por execução: o banco não é recriado entre elas. */
function fone(): string {
  n += 1;
  return `1193${String(n).padStart(7, "0")}`;
}

/** Cola a planilha e vai para a tela de conferência. */
async function conferir(page: Page, linhas: string[]): Promise<void> {
  await page.goto("/importar");
  await page.getByLabel("Ou cole as células aqui").fill(linhas.join("\n"));
  await page.getByRole("button", { name: "Conferir planilha" }).click();
  await page.waitForURL(/\/importar\/[0-9a-f-]{36}$/);
}

test.describe("conferir antes de criar", () => {
  test("mostra o que entra, o que já existe e o que não entra", async ({ page }) => {
    await entrar(page, DONA);

    const nova = fone();
    await conferir(page, [
      "Nome Completo;Celular",
      `Bruno Tavares;${nova}`,
      "Mariana Alves;11987650001", // já está no seed
      "Sem Telefone;",
    ]);

    await expect(page.getByText("Nada foi criado ainda")).toBeVisible();

    const resumo = page.getByRole("region", { name: "Resumo da importação" });
    await expect(resumo.getByText("Esperando confirmação")).toBeVisible();

    // Uma linha de cada tipo, e o motivo em cada uma.
    const tabela = page.locator("tbody");
    await expect(tabela.getByText("Vai entrar")).toBeVisible();
    await expect(tabela.getByText("Já existe")).toBeVisible();
    await expect(tabela.getByText("Não entra")).toBeVisible();
    await expect(page.getByText("Já cadastrado: Mariana Alves")).toBeVisible();
    await expect(page.getByText("Telefone vazio")).toBeVisible();

    // O botão diz o NÚMERO: é a última coisa que se lê antes de clicar.
    await expect(page.getByRole("button", { name: /Importar 1 paciente/ })).toBeVisible();
  });

  test("planilha sem as colunas diz o que falta e quais nomes servem", async ({ page }) => {
    await entrar(page, DONA);

    await page.goto("/importar");
    await page.getByLabel("Ou cole as células aqui").fill("apelido,idade\nMá,30");
    await page.getByRole("button", { name: "Conferir planilha" }).click();

    // No AVISO, não em qualquer lugar da tela: a lista de nomes aceitos também
    // aparece no "Como a coluna pode se chamar", que fica recolhido.
    const aviso = page.getByRole("status").filter({ hasText: "precisa de uma coluna" });
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText("nome_completo");
    await expect(aviso).toContainText("celular");
  });

  test("recepção não vê o formulário: é dado pessoal em volume", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto("/importar");

    // Sem `import.read`, a tela nem abre.
    await expect(page).toHaveURL(/sem-permissao/);
  });
});

test.describe("importar", () => {
  test("cria os cadastros e mostra o relatório do que entrou", async ({ page }) => {
    await entrar(page, DONA);

    const nova = fone();
    await conferir(page, [
      "Nome Completo;Celular;CPF;Data de Nascimento",
      `Aurora Campos;${nova};010.000.000-28;15/03/1990`,
    ]);

    await page.getByRole("button", { name: /Importar 1 paciente/ }).click();
    await expect(page.getByText("1 paciente importado.")).toBeVisible();

    // A linha vira link para a ficha criada.
    await page.getByRole("link", { name: "Aurora Campos" }).click();
    await page.waitForURL(/\/pacientes\/[0-9a-f-]{36}$/);
    await expect(
      page.getByRole("heading", { name: "Aurora Campos", level: 1 }),
    ).toBeVisible();
  });

  test("saldo sem vencimento vira dívida vencendo hoje", async ({ page }) => {
    await entrar(page, DONA);

    const nova = fone();
    await conferir(page, [
      "Nome Completo;Celular;Saldo",
      `Deve Da Migração;${nova};1.500,00`,
    ]);

    await page.getByRole("button", { name: /Importar 1 paciente/ }).click();
    await expect(page.getByText("1 paciente importado.")).toBeVisible();

    // O saldo trazido aparece no financeiro, com a origem na descrição.
    await page.goto("/financeiro?recorte=abertas&busca=Deve Da Migração");
    await expect(page.getByText(/R\$\s*1\.500,00/).first()).toBeVisible();
    await expect(page.getByText(/sistema anterior/i).first()).toBeVisible();
  });

  test("descartar não cria ninguém", async ({ page }) => {
    await entrar(page, DONA);

    const nova = fone();
    await conferir(page, ["Nome Completo;Celular", `Não Vai Entrar;${nova}`]);

    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(page.getByText(/Nada foi criado/)).toBeVisible();

    await page.goto("/pacientes?busca=Não Vai Entrar");
    await expect(page.getByText("Não Vai Entrar")).toHaveCount(0);
  });
});
