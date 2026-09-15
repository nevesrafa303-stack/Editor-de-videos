import { expect, test, type Page } from "@playwright/test";

/**
 * Convênio, pelo navegador.
 *
 * O que estes testes travam é o que o dinheiro depende: a tabela do convênio
 * vence a particular na hora de orçar, trocar o convênio REPRECIFICA a proposta
 * inteira, e convênio faturado por guia é recusado no aceite em vez de virar
 * dívida no nome do paciente.
 *
 * Mariana é a paciente usada aqui porque os itens planejados do Roberto são
 * recurso finito, disputado pelo `orcamento.spec.ts`.
 */

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const RECEPCAO = "recepcao@sorriso.com.br";

const MARIANA = "0a111111-1111-7111-8111-111111111111";

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

/**
 * Escolhe a opção pelo TRECHO do texto.
 *
 * O rótulo carrega o preço formatado, e "R$ 180,00" em pt-BR usa espaço
 * inquebrável — comparar o rótulo inteiro quebra por um caractere invisível.
 */
async function escolher(page: Page, campo: string, trecho: string): Promise<void> {
  const seletor = page.locator(`select[name="${campo}"]`);
  const opcao = seletor.locator("option", { hasText: trecho }).first();
  await seletor.selectOption(await opcao.getAttribute("value"));
}

/** Cria um orçamento para a Mariana e devolve a URL dele. */
async function orcamento(page: Page, titulo: string, convenio?: string): Promise<string> {
  await page.goto(`/orcamentos/novo?paciente=${MARIANA}`);
  await page.getByLabel("Título").fill(titulo);
  if (convenio) await escolher(page, "payerId", convenio);

  await page.getByRole("button", { name: "Criar orçamento" }).click();
  await page.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);

  return page.url();
}

/** Adiciona a resina — procedimento de escopo por face — no dente 36. */
async function resina(page: Page): Promise<void> {
  await escolher(page, "procedureId", "Restauração em resina");
  await page.getByLabel("Dente").fill("36");
  await page.getByRole("checkbox", { name: "O", exact: true }).check();
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByText("Item adicionado.")).toBeVisible();
}

test.describe("tabela de preço", () => {
  test("mostra o particular e o do convênio lado a lado", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/convenios");

    await page.getByRole("link", { name: "Odonto Saúde" }).click();
    await page.waitForURL(/\/convenios\/[0-9a-f-]{36}$/);

    const linha = page.getByRole("row", { name: /Restauração em resina/ });
    await expect(linha.getByText(/R\$\s*280,00/)).toBeVisible();
    await expect(linha.getByText(/R\$\s*180,00/)).toBeVisible();

    // O que a clínica abre mão é a pergunta que se faz antes de assinar.
    await expect(page.locator("main").getByText(/R\$\s*100,00 vs\. particular/)).toBeVisible();
  });

  test("convênio faturado por guia se anuncia como tal", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/convenios");

    await expect(
      page.getByRole("row", { name: /Dental Mais/ }).getByText("Faturado por guia"),
    ).toBeVisible();
  });

  test("quem não mexe em preço vê a tabela e não o formulário", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto("/convenios");

    await expect(page.getByRole("link", { name: "Odonto Saúde" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cadastrar convênio" })).toHaveCount(0);
  });
});

test.describe("orçar por convênio", () => {
  test("o item nasce com o preço do convênio, e trocar reprecifica", async ({ page }) => {
    await entrar(page, DONA);
    const url = await orcamento(page, "Resina pelo convênio", "Odonto Saúde");

    await resina(page);

    // R$ 180,00 da tabela do convênio, não os R$ 280,00 da particular.
    const item = page.getByRole("row", { name: /Restauração em resina/ });
    await expect(item.getByText(/R\$\s*180,00/).first()).toBeVisible();

    // Voltar para particular devolve o preço cheio, sem mexer no item à mão.
    await page.goto(url);
    await escolher(page, "payerId", "Particular");
    await page.getByRole("button", { name: "Trocar", exact: true }).click();
    await expect(page.getByText(/1 item reprecificado/)).toBeVisible();

    await expect(
      page.getByRole("row", { name: /Restauração em resina/ }).getByText(/R\$\s*280,00/).first(),
    ).toBeVisible();
  });

  test("procedimento por face exige a face, e a tela diz isso", async ({ page }) => {
    await entrar(page, DONA);
    await orcamento(page, "Resina sem face");

    await escolher(page, "procedureId", "Restauração em resina");
    await page.getByLabel("Dente").fill("36");
    // De propósito: nenhuma face marcada.
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();

    await expect(page.getByText(/ao menos uma face/i)).toBeVisible();
  });

  test("o formulário se limpa depois de adicionar", async ({ page }) => {
    await entrar(page, DONA);
    await orcamento(page, "Dois itens seguidos");

    await resina(page);

    // O dente do item anterior não pode ficar no campo: o próximo item entraria
    // no dente errado, e isso só aparece quando o paciente lê a proposta.
    await expect(page.getByLabel("Dente")).toHaveValue("");
    await expect(page.locator('select[name="procedureId"]')).toHaveValue("");
  });
});

test.describe("faturado por guia", () => {
  test("o aceite é recusado com uma frase que explica o que fazer", async ({ page }) => {
    await entrar(page, DONA);
    await orcamento(page, "Proposta por guia", "Dental Mais");

    await page.getByLabel("Descrição").fill("Procedimento");
    await page.getByLabel("Unitário (R$)").fill("400,00");
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();
    await expect(page.getByText("Item adicionado.")).toBeVisible();

    await page.getByRole("button", { name: "Enviar ao paciente" }).click();
    await expect(page.getByText("Orçamento enviado ao paciente.")).toBeVisible();

    await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
    await page.getByLabel("Quem está aceitando").fill("Mariana Alves");
    await page.getByRole("button", { name: "Confirmar aceite" }).click();

    // A recusa vem do banco e chega INTEIRA: com o nome do convênio e a saída.
    // Sem o repasse da mensagem, isto viraria "A operação viola uma regra do
    // sistema" — verdade que não diz a ninguém o que fazer em seguida.
    const aviso = page.getByRole("status").filter({ hasText: "Dental Mais" });
    await expect(aviso).toContainText(/faturado por guia/i);
    await expect(aviso).toContainText(/Emita a guia por fora/);

    // E o orçamento continua ENVIADO, não fechado: o aceite foi desfeito
    // inteiro, e nenhuma parcela nasceu no nome do paciente.
    await page.goto("/orcamentos?busca=Proposta por guia");
    await expect(
      page.getByRole("row", { name: /Proposta por guia/ }).getByText("Enviado"),
    ).toBeVisible();

    await page.goto("/financeiro?recorte=abertas&busca=Mariana");
    await expect(page.getByText("Proposta por guia")).toHaveCount(0);
  });
});
