import { expect, test, type Page } from "@playwright/test";

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const RECEPCAO = "recepcao@sorriso.com.br";

const ROBERTO = "0a222222-2222-7222-8222-222222222222";

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

/** Cria um orçamento com um item avulso e devolve a URL dele. */
async function orcamentoCom(page: Page, valor: string): Promise<string> {
  await page.goto(`/orcamentos/novo?paciente=${ROBERTO}`);
  await page.getByRole("button", { name: "Criar orçamento" }).click();
  await page.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);

  await page.getByLabel("Descrição").fill("Procedimento de teste");
  await page.getByLabel("Unitário (R$)").fill(valor);
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByText("Item adicionado.")).toBeVisible();

  return page.url();
}

test.describe("a marca", () => {
  test("o produto se chama Áurea, no computador e no celular", async ({ page }) => {
    await page.goto("/entrar");
    await expect(page).toHaveTitle(/Áurea/);

    // No desktop, o nome vive no painel lateral.
    await expect(page.locator("aside").getByText("Áurea")).toBeVisible();

    // No celular o painel some, e o nome precisa continuar aparecendo — senão
    // quem entra pelo telefone não sabe em que sistema está.
    await page.setViewportSize({ width: 390, height: 780 });
    await expect(page.locator("aside")).toBeHidden();
    await expect(page.locator("main").getByText("Áurea")).toBeVisible();
  });
});

test.describe("nascer do plano de tratamento", () => {
  // Um teste só, de propósito: os itens planejados do paciente são um recurso
  // finito. Dois testes disputando a mesma lista passam ou falham conforme a
  // ordem em que rodam, que é a pior espécie de teste.
  test("o item vem com o preço da tabela e some da lista do plano", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/pacientes/${ROBERTO}`);
    await page.getByRole("link", { name: "Novo", exact: true }).click();

    await page.waitForURL(/\/orcamentos\/novo/);

    const planejados = page.locator('input[name="planItemIds"]');
    const antes = await planejados.count();
    expect(antes).toBeGreaterThan(0);

    await expect(page.getByText("Implante unitário")).toBeVisible();

    // Leva só o primeiro: o resto tem que continuar disponível.
    for (let i = 1; i < antes; i += 1) await planejados.nth(i).uncheck();

    await page.getByRole("button", { name: "Criar orçamento" }).click();
    await page.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);

    await expect(page.getByRole("cell", { name: "Implante unitário" })).toBeVisible();
    await expect(page.getByText("R$ 3.200,00").first()).toBeVisible();

    await page.goto(`/orcamentos/novo?paciente=${ROBERTO}`);
    const depois = await page.locator('input[name="planItemIds"]').count();

    expect(depois).toBe(antes - 1);
    await expect(page.getByText("Implante unitário")).toHaveCount(0);
  });
});

test.describe("alçada de desconto", () => {
  test("a tela mostra o teto de quem está olhando", async ({ page }) => {
    await entrar(page, RECEPCAO);
    const url = await orcamentoCom(page, "1000,00");

    await page.goto(url);
    // Recepção tem 5%: R$ 50,00 de R$ 1.000,00.
    await expect(page.getByText(/Sua alçada: 5%/)).toBeVisible();
  });

  test("recepção não consegue enviar acima da própria alçada", async ({ page }) => {
    await entrar(page, RECEPCAO);
    const url = await orcamentoCom(page, "1000,00");

    await page.goto(url);
    await page.getByLabel("Desconto (R$)").fill("300,00");
    await page.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(page.getByText("Desconto atualizado.")).toBeVisible();

    await expect(page.getByText(/passa do seu teto/)).toBeVisible();

    await page.getByRole("button", { name: "Enviar ao paciente" }).click();
    await expect(page.getByText(/excede o teto/)).toBeVisible();
  });

  test("a dona aprova e o envio passa", async ({ page }) => {
    await entrar(page, DONA);
    const url = await orcamentoCom(page, "1000,00");

    await page.goto(url);
    await page.getByLabel("Desconto (R$)").fill("200,00");
    await page.getByRole("button", { name: "Aplicar e aprovar" }).click();
    await expect(page.getByText("Desconto atualizado.")).toBeVisible();

    await page.getByRole("button", { name: "Enviar ao paciente" }).click();
    await expect(page.getByText("Orçamento enviado ao paciente.")).toBeVisible();
    await expect(page.getByText("R$ 800,00").first()).toBeVisible();
  });
});

test.describe("ciclo de vida", () => {
  test("orçamento sem item não sai da clínica", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/orcamentos/novo?paciente=${ROBERTO}`);

    // Desmarca tudo para criar vazio.
    for (const caixa of await page.locator('input[name="planItemIds"]').all()) {
      await caixa.uncheck();
    }
    await page.getByRole("button", { name: "Criar orçamento" }).click();
    await page.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);

    await page.getByRole("button", { name: "Enviar ao paciente" }).click();
    await expect(page.getByText(/sem itens|ao menos um item/i)).toBeVisible();
  });

  test("perda exige motivo e fica no histórico", async ({ page }) => {
    await entrar(page, DONA);
    const url = await orcamentoCom(page, "500,00");

    await page.goto(url);
    await page.getByRole("button", { name: "Enviar ao paciente" }).click();
    await expect(page.getByText("Orçamento enviado ao paciente.")).toBeVisible();

    await page.getByRole("button", { name: "Registrar perda" }).first().click();
    // Pelo VALOR, não pelo rótulo: o rótulo é conteúdo de tela e muda (este
    // aqui já mudou quando os acentos entraram no seed), e um teste que quebra
    // por acento não está medindo regressão nenhuma.
    const motivo = page.locator('select[name="lossReasonId"]');
    await motivo.selectOption(
      await motivo.locator("option", { hasText: "acima do esperado" }).first().getAttribute("value"),
    );
    await page.getByLabel("Observação").fill("Achou caro pelo parcelamento.");
    await page.getByRole("button", { name: "Registrar perda" }).last().click();

    await expect(page.getByText("Perda registrada.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Perdido").first()).toBeVisible();
  });

  test("aceite fecha o orçamento e ele para de aceitar edição", async ({ page }) => {
    await entrar(page, DONA);
    const url = await orcamentoCom(page, "2500,00");

    await page.goto(url);
    await page.getByRole("button", { name: "Enviar ao paciente" }).click();
    await expect(page.getByText("Orçamento enviado ao paciente.")).toBeVisible();

    await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
    await page.getByLabel("Quem está aceitando").fill("Roberto Carvalho");
    await page.getByRole("button", { name: "Confirmar aceite" }).click();

    await expect(page.getByText("Aceite registrado e assinado.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Fechado").first()).toBeVisible();
    // Fechado não mostra mais o formulário de item.
    await expect(page.getByLabel("Descrição")).toHaveCount(0);
  });
});

test.describe("lista", () => {
  test("soma por estágio e filtra", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/orcamentos");

    const resumo = page.getByRole("region", { name: "Resumo dos orçamentos" });
    for (const rotulo of ["Esperando resposta", "Fechado", "Perdido", "Vencido"]) {
      await expect(resumo.getByText(rotulo, { exact: true })).toBeVisible();
    }

    await page.getByLabel("Estágio").selectOption("accepted");
    await page.getByRole("button", { name: "Filtrar" }).click();

    await expect(page).toHaveURL(/status=accepted/);
  });
});
