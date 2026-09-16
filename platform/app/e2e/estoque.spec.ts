import { expect, test, type Page } from "@playwright/test";

/**
 * Estoque, pelo navegador.
 *
 * O caminho que importa é o último: executar o procedimento na ficha do
 * paciente e o material sumir da prateleira, sem ninguém abrir a tela de
 * estoque. É por isso que esta fatia existe — baixa que depende de alguém
 * lembrar é baixa que não acontece.
 */

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const RECEPCAO = "recepcao@sorriso.com.br";

const ROBERTO = "0a222222-2222-7222-8222-222222222222";
const RESINA = "04333333-3333-7333-8333-333333333333";

/**
 * Escolhe a opção pelo texto.
 *
 * `selectOption({ label })` só aceita string exata, e o nome do produto no
 * seed carrega acento e unidade ("Toxina botulínica 100U"). Casar por trecho
 * evita o teste quebrar toda vez que alguém acerta um acento no catálogo.
 */
async function escolherProduto(page: Page, trecho: RegExp): Promise<void> {
  const seletor = page.locator('select[name="productId"]');
  const opcao = seletor.locator("option").filter({ hasText: trecho }).first();
  await seletor.selectOption(await opcao.getAttribute("value"));
}

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

/** "19,8562 tubo" -> 19.8562 */
function numero(texto: string): number {
  const m = texto.match(/-?[\d.]+,?\d*/);
  return m ? Number(m[0].replace(/\./g, "").replace(",", ".")) : NaN;
}

async function saldoNaFicha(page: Page): Promise<number> {
  await page.goto(`/estoque/${RESINA}`);
  const bloco = page
    .getByRole("region", { name: "Situação do produto" })
    .locator("div", { has: page.getByText("Em estoque", { exact: true }) })
    .last();
  return numero((await bloco.textContent()) ?? "");
}

test.describe("lista de estoque", () => {
  test("mostra saldo na unidade de compra, não na de uso", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/estoque");

    // A afirmação é sobre a UNIDADE, não sobre o número: em unidade de uso a
    // toxina apareceria em centenas (cada frasco tem 100 U). Fixar o valor
    // amarrava o teste a quanto o seed tem hoje, e cada compra ou perda nova
    // no seed quebrava um teste que não é sobre isso.
    const linha = page.locator("tbody tr", { hasText: "Toxina" }).first();
    const saldo = (await linha.locator("td").nth(1).textContent()) ?? "";

    expect(saldo).toMatch(/frascos?$/);
    expect(numero(saldo)).toBeLessThan(100);

    await expect(page.locator("tbody tr", { hasText: "Resina" }).first()).toContainText("tubos");
  });

  test("o valor parado da linha soma o valor do topo", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/estoque");

    const total = numero(
      (await page
        .getByRole("region", { name: "Resumo do estoque" })
        .locator("div", { has: page.getByText("Parado em estoque") })
        .last()
        .textContent()) ?? "",
    );

    const celulas = page.locator("table tbody tr td:last-child");
    let soma = 0;
    for (let i = 0; i < (await celulas.count()); i++) {
      soma += numero((await celulas.nth(i).textContent()) ?? "");
    }

    expect(soma).toBeCloseTo(total, 2);
  });

  test("recepção vê o estoque e não vê o botão de entrada", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto("/estoque");

    await expect(page.getByRole("heading", { name: "Estoque" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Registrar entrada" })).toHaveCount(0);
  });
});

test.describe("entrada", () => {
  test("produto com rastreio pede lote e validade na própria tela", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/estoque/entrada");

    // Antes de escolher o produto não há campo de lote: campo cinza na tela é
    // uma pergunta que a pessoa ainda lê.
    await expect(page.getByLabel("Número do lote")).toHaveCount(0);

    await escolherProduto(page, /Toxina/);
    await expect(page.getByLabel("Número do lote")).toBeVisible();
    await expect(page.getByLabel("Validade")).toBeVisible();

    await escolherProduto(page, /Resina/);
    await expect(page.getByLabel("Número do lote")).toHaveCount(0);
  });

  test("entrada de lote novo soma no saldo e aparece na ficha", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/estoque/entrada");

    const lote = `E2E-${Date.now()}`;

    await escolherProduto(page, /Toxina/);
    await page.getByLabel(/Quantidade/).fill("2");
    await page.getByLabel("Número do lote").fill(lote);
    await page.getByLabel("Validade").fill("2030-12-31");
    await page.getByRole("button", { name: "Registrar entrada" }).click();

    await page.waitForURL(/\/estoque\/04111111/);
    await expect(page.getByText("Entrada registrada.")).toBeVisible();
    await expect(page.getByRole("cell", { name: lote })).toBeVisible();
  });
});

test.describe("executar o procedimento", () => {
  test("a ficha do paciente diz o que vai sair antes de clicar", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/pacientes/${ROBERTO}`);

    await expect(page.getByText(/Baixa 0,1438 tubos de Resina composta A2/)).toBeVisible();
  });

  test("executar baixa o estoque sem ninguém abrir a tela de estoque", async ({ page }) => {
    await entrar(page, DONA);

    const antes = await saldoNaFicha(page);

    await page.goto(`/pacientes/${ROBERTO}`);
    await page
      .locator("li", { has: page.getByText("Restauração em resina") })
      .getByRole("button", { name: "Executar" })
      .first()
      .click();

    await expect(page.getByText(/1 material baixado do estoque/)).toBeVisible();

    expect(await saldoNaFicha(page)).toBeCloseTo(antes - 0.1438, 4);
  });

  test("desfazer devolve o material e mantém as duas linhas no histórico", async ({ page }) => {
    await entrar(page, DONA);

    const antes = await saldoNaFicha(page);

    await page.goto(`/pacientes/${ROBERTO}`);

    // `getByRole("region")` não acha: um `<section>` só ganha o papel quando
    // tem nome acessível, e estes painéis são identificados pelo título.
    await page
      .locator("section", { has: page.getByText("Executado nos últimos dias") })
      .getByRole("button", { name: "Desfazer" })
      .first()
      .click();

    await page.getByPlaceholder("Por que está desfazendo?").fill("Dente errado no registro.");
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText(/Execução estornada/)).toBeVisible();
    expect(await saldoNaFicha(page)).toBeCloseTo(antes + 0.1438, 4);

    // Consumo e devolução ficam lado a lado. Estoque que apaga histórico não
    // defende ninguém numa fiscalização.
    await expect(page.getByText("Consumo", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Acerto", { exact: true }).first()).toBeVisible();
  });
});

test.describe("perda e acerto", () => {
  test("o acerto pede o que foi contado e responde com a diferença", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/estoque/${RESINA}`);

    // Conta três a menos do que o sistema tem AGORA: um número fixo vira no-op
    // no dia em que o seed já estiver naquele valor, e o teste passa sem
    // testar.
    const atual = numero(
      (await page
        .getByRole("region", { name: "Situação do produto" })
        .locator("div", { has: page.getByText("Em estoque") })
        .last()
        .textContent()) ?? "",
    );
    const contado = atual - 3;

    await page.getByLabel(/^Contei/).fill(String(contado).replace(".", ","));
    await page
      .locator("form", { has: page.getByLabel(/^Contei/) })
      .getByLabel("Por que estava diferente")
      .fill("Contagem de fim de mês.");
    await page.getByRole("button", { name: "Lançar acerto" }).click();

    // A frase diz o SINAL. "Acerto registrado" deixaria quem contou sem saber
    // se o sistema entendeu sobra ou falta.
    await expect(page.getByText(/Faltou/)).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Situação do produto" }),
    ).toContainText(String(contado).replace(".", ","));
  });

  test("perda exige motivo", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/estoque/${RESINA}`);

    const form = page.locator("form", { has: page.getByText("O que aconteceu") });
    await form.getByLabel(/^Quantidade/).fill("1");
    await form.getByRole("button", { name: "Registrar perda" }).click();

    // O campo é required: o navegador barra antes de chegar ao servidor.
    await expect(page).toHaveURL(new RegExp(`/estoque/${RESINA}`));
  });
});

test.describe("validade", () => {
  test("a fila mostra o que vence e o que já venceu", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/estoque/validade");

    await expect(page.getByRole("heading", { name: "Validade" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Resumo da validade" })).toBeVisible();
  });
});

test("o menu leva ao estoque, que não é mais 'breve'", async ({ page }) => {
  await entrar(page, DONA);
  await page.getByRole("link", { name: "Estoque" }).click();

  await expect(page).toHaveURL(/\/estoque/);
  await expect(page.getByRole("heading", { name: "Estoque" })).toBeVisible();
});
