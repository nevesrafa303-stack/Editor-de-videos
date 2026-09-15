import { expect, test, type Page } from "@playwright/test";

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const RECEPCAO = "recepcao@sorriso.com.br";

const MARIANA = "0a111111-1111-7111-8111-111111111111";

/**
 * `Intl` em pt-BR separa "R$" do número com espaço NÃO-QUEBRÁVEL. Um regex com
 * espaço comum não casa, e a asserção falha por tipografia, não por defeito.
 */
function reais(texto: string): RegExp {
  return new RegExp(texto.replace(/R\$ /g, "R\\$\\s"));
}

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

/** Cria, envia e aceita um orçamento — o caminho real até existir parcela. */
async function orcamentoAceito(page: Page, valor: string, parcelas: string): Promise<void> {
  await page.goto(`/orcamentos/novo?paciente=${MARIANA}`);
  await page.getByRole("button", { name: "Criar orçamento" }).click();
  await page.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);

  await page.getByLabel("Item avulso").fill("Tratamento");
  await page.getByLabel("Unitário (R$)").fill(valor);
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByText("Item adicionado.")).toBeVisible();

  await page.getByLabel("Parcelas").selectOption(parcelas);
  await page.getByRole("button", { name: "Salvar condições" }).click();
  await expect(page.getByText("Condições atualizadas.")).toBeVisible();

  await page.getByRole("button", { name: "Enviar ao paciente" }).click();
  await expect(page.getByText("Orçamento enviado ao paciente.")).toBeVisible();

  await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
  await page.getByLabel("Quem está aceitando").fill("Mariana Alves");
  await page.getByRole("button", { name: "Confirmar aceite" }).click();
  await expect(page.getByText("Aceite registrado e assinado.")).toBeVisible();
}

test.describe("do aceite ao a receber", () => {
  test("aceitar o orçamento faz as parcelas aparecerem no financeiro", async ({ page }) => {
    await entrar(page, DONA);
    await orcamentoAceito(page, "1200,00", "3");

    await page.goto("/financeiro?recorte=abertas&busca=Mariana");

    // 3 parcelas de R$ 400,00.
    await expect(page.getByText("R$ 400,00").first()).toBeVisible();
    const linhas = page.locator("li").filter({ hasText: "Mariana Alves" });
    expect(await linhas.count()).toBeGreaterThanOrEqual(3);
  });
});

test.describe("recebimento", () => {
  test("recebe no PIX e a parcela fica quitada", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto("/financeiro?recorte=abertas&busca=Mariana");

    const linha = page.locator("li").filter({ hasText: "Mariana Alves" }).first();
    await linha.getByRole("button", { name: "Receber" }).click();
    await linha.getByLabel("Forma de pagamento").selectOption({ label: "PIX" });
    await linha.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText(/Parcela quitada/)).toBeVisible();
  });

  test("dinheiro em espécie avisa que precisa de caixa aberto", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto("/financeiro?recorte=abertas&busca=Mariana");

    const linha = page.locator("li").filter({ hasText: "Mariana Alves" }).first();
    await linha.getByRole("button", { name: "Receber" }).click();
    await linha.getByLabel("Forma de pagamento").selectOption({ label: "Dinheiro" });

    await expect(linha.getByText(/precisa de caixa aberto/)).toBeVisible();

    await linha.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(/Abra o caixa antes de receber em dinheiro/)).toBeVisible();
  });
});

test.describe("multa e juros", () => {
  test("parcela vencida mostra os dias e o acréscimo, e dá para perdoar", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/financeiro?recorte=vencidas&busca=Camila");

    const vencida = page.locator("li").filter({ hasText: "dias" }).first();
    await expect(vencida).toBeVisible();
    await expect(vencida.getByText(/multa e juros/)).toBeVisible();

    await vencida.getByRole("button", { name: "Receber" }).click();
    await expect(vencida.getByText(/Perdoar/)).toBeVisible();
  });
});

test.describe("caixa", () => {
  test("abre, recebe em dinheiro, sangra e fecha com a diferença", async ({ page }) => {
    await entrar(page, RECEPCAO);

    await page.goto("/financeiro/caixa");
    await page.getByLabel("Abertura (R$)").fill("100,00");
    await page.getByRole("button", { name: "Abrir caixa" }).click();
    await expect(page.getByText("Caixa aberto.")).toBeVisible();

    // Recebe em dinheiro: entra na gaveta.
    await page.goto("/financeiro?recorte=abertas&busca=Mariana");
    const linha = page.locator("li").filter({ hasText: "Mariana Alves" }).first();
    await linha.getByRole("button", { name: "Receber" }).click();
    await linha.getByLabel("Forma de pagamento").selectOption({ label: "Dinheiro" });
    await linha.getByLabel("Valor (R$)").fill("50,00");
    await linha.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(reais("Recebido R$ 50,00"))).toBeVisible();

    await page.goto("/financeiro/caixa");
    await expect(page.getByText("R$ 150,00").first()).toBeVisible();

    // Sangria.
    await page.getByLabel("Valor (R$)").fill("30,00");
    await page.getByLabel("Do que se trata").fill("Sangria para o cofre");
    await page.getByRole("button", { name: "Registrar", exact: true }).click();
    await expect(page.getByText("Movimentação registrada.")).toBeVisible();

    await expect(page.getByText("R$ 120,00").first()).toBeVisible();

    // Fecha contando menos: a falta tem que aparecer.
    await page.getByRole("button", { name: "Conferir e fechar" }).click();
    await page.getByLabel("Contado na gaveta (R$)").fill("115,00");
    await expect(page.getByText(reais("Falta de R$ 5,00"))).toBeVisible();

    await page.getByRole("button", { name: "Fechar caixa" }).click();
    await expect(page.getByText(reais("Caixa fechado com falta de R$ 5,00"))).toBeVisible();
  });
});

test.describe("permissão", () => {
  test("quem não registra recebimento não vê o botão", async ({ page }) => {
    await entrar(page, "carla@sorriso.com.br");
    await page.goto("/financeiro");

    await expect(page).toHaveURL(/\/sem-permissao/);
  });
});

test.describe("mora", () => {
  test("recebe a parcela vencida com multa e juros, e a mensagem separa os dois", async ({
    page,
  }) => {
    await entrar(page, RECEPCAO);
    await page.goto("/financeiro?recorte=vencidas&busca=Camila");

    const vencida = page.locator("li").filter({ hasText: "dias" }).first();
    await vencida.getByRole("button", { name: "Receber" }).click();
    await vencida.getByLabel("Forma de pagamento").selectOption({ label: "PIX" });

    // O campo já vem com o total devido, mora inclusa.
    const total = await vencida.getByLabel("Valor (R$)").inputValue();
    expect(total).not.toBe("0,00");

    await vencida.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText(/Sendo .* de parcela e .* de multa e juros/)).toBeVisible();
    await expect(page.getByText(/Parcela quitada/)).toBeVisible();
  });
});
