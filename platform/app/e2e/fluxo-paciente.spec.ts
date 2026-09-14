import { expect, test, type Page } from "@playwright/test";

const SENHA = "senha-de-teste-123";

const DONA = "ana@sorriso.com.br"; // Rede Sorriso, papel owner
const OUTRA_REDE = "helena@bellavita.com.br"; // Bella Vita, owner
const FINANCEIRO = "financeiro@sorriso.com.br"; // Rede Sorriso, papel finance

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

test.describe("porta de entrada", () => {
  test("visitante sem sessao nao chega na lista", async ({ page }) => {
    await page.goto("/pacientes");
    await expect(page).toHaveURL(/\/entrar/);
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("senha errada nao abre sessao e nao diz qual campo errou", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(DONA);
    await page.getByLabel("Senha").fill("senha-errada-de-proposito");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText(/credenciais inv|e-mail ou senha/i)).toBeVisible();
    await expect(page).toHaveURL(/\/entrar/);

    // O e-mail volta preenchido: errar a senha nao deve custar digitar tudo.
    await expect(page.getByLabel("E-mail")).toHaveValue(DONA);
  });

  test("login leva para a lista com o nome da rede visivel", async ({ page }) => {
    await entrar(page, DONA);
    await expect(page.getByRole("heading", { name: "Pacientes", level: 1 })).toBeVisible();
    await expect(page.getByText("Rede Sorriso")).toBeVisible();
  });
});

test.describe("lista de pacientes", () => {
  test("mostra so os pacientes da rede de quem entrou", async ({ page }) => {
    await entrar(page, DONA);

    await expect(page.getByRole("link", { name: "Mariana Alves" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Roberto Carvalho" })).toBeVisible();
    // Paciente da Bella Vita: existe no banco, nao pode aparecer aqui.
    await expect(page.getByRole("link", { name: "Paciente da Bella" })).toHaveCount(0);
  });

  test("busca filtra pelo nome", async ({ page }) => {
    await entrar(page, DONA);

    await page.getByLabel("Buscar").fill("Mariana");
    await page.getByRole("button", { name: "Filtrar" }).click();

    await expect(page.getByRole("link", { name: "Mariana Alves" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Roberto Carvalho" })).toHaveCount(0);
  });

  test("busca sem resultado explica o que fazer em vez de mostrar tabela vazia", async ({
    page,
  }) => {
    await entrar(page, DONA);

    await page.getByLabel("Buscar").fill("Zeferino Inexistente");
    await page.getByRole("button", { name: "Filtrar" }).click();

    await expect(page.getByText("Nenhum paciente encontrado")).toBeVisible();
  });
});

test.describe("visao do paciente", () => {
  test("reune dinheiro, agenda e alerta clinico numa tela so", async ({ page }) => {
    await entrar(page, DONA);
    // Roberto e o caso completo do seed: anamnese com alerta, parcela vencida
    // e tratamento planejado.
    await page.getByRole("link", { name: "Roberto Carvalho" }).click();

    await expect(page.getByRole("heading", { name: "Roberto Carvalho", level: 1 })).toBeVisible();

    // O alerta de anamnese e a razao da tela existir: nao pode ficar escondido.
    await expect(page.getByText(/Atenção clínica/)).toBeVisible();
    await expect(page.getByText("Alergia a penicilina")).toBeVisible();

    const resumo = page.getByRole("region", { name: "Resumo do paciente" });
    for (const rotulo of ["Em aberto", "Próxima consulta", "Tratamento pendente", "Orçamento em aberto"]) {
      await expect(resumo.getByText(rotulo, { exact: true })).toBeVisible();
    }

    // A parcela vencida do seed tem que estar marcada como tal, nos dois
    // lugares em que a tela fala dela.
    await expect(page.getByText("vencida").first()).toBeVisible();
    await expect(page.getByText("Parcela em atraso")).toBeVisible();
  });

  test("paciente de outra rede da 404, nao vazamento", async ({ page }) => {
    // Mariana, da Rede Sorriso, vista por quem so atende na Bella Vita.
    await entrar(page, OUTRA_REDE);
    const resposta = await page.goto("/pacientes/0a111111-1111-7111-8111-111111111111");

    expect(resposta?.status()).toBe(404);
    await expect(page.getByText("Mariana")).toHaveCount(0);
  });
});

test.describe("cadastro", () => {
  test("cadastra e cai direto na visao do paciente novo", async ({ page }) => {
    await entrar(page, DONA);
    await page.getByRole("link", { name: "Novo paciente" }).click();

    const nome = `Tereza Bastos ${Date.now()}`;
    await page.getByLabel("Nome completo").fill(nome);
    await page.getByLabel("Telefone").fill("(11) 97777-1234");
    await page.getByLabel("Data de nascimento").fill("1985-03-12");
    await page.getByRole("button", { name: "Cadastrar paciente" }).click();

    await page.waitForURL(/\/pacientes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: nome, level: 1 })).toBeVisible();
    await expect(page.getByText("Nada pendente para este paciente")).toBeVisible();

    // E aparece na lista logo em seguida: o revalidate faz parte do fluxo.
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page.getByRole("link", { name: nome })).toBeVisible();
  });

  test("formulario recusa telefone invalido sem perder o que foi digitado", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/pacientes/novo");

    await page.getByLabel("Nome completo").fill("Nome Com Telefone Ruim");
    await page.getByLabel("Telefone").fill("123");
    await page.getByRole("button", { name: "Cadastrar paciente" }).click();

    await expect(page).toHaveURL(/\/pacientes\/novo/);
    await expect(page.getByText(/telefone/i).first()).toBeVisible();
  });
});

test.describe("papel e permissao", () => {
  test("quem nao pode cadastrar nao ve o botao nem alcanca a rota", async ({ page }) => {
    await entrar(page, FINANCEIRO);

    await expect(page.getByRole("link", { name: "Novo paciente" })).toHaveCount(0);

    await page.goto("/pacientes/novo");
    await expect(page).toHaveURL(/\/pacientes(\?|$)/);
  });

  test("sair encerra a sessao de verdade", async ({ page }) => {
    await entrar(page, DONA);
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL(/\/entrar/);

    // Voltar no historico nao pode ressuscitar a sessao.
    await page.goto("/pacientes");
    await expect(page).toHaveURL(/\/entrar/);
  });
});
