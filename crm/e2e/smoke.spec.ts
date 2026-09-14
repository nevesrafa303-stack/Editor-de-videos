/**
 * Smoke test de navegador: percorre os quatro modulos com um usuário real.
 *
 * Serve para pegar o erro que o TypeScript não pega — pagina que quebra no
 * servidor, formulario que não grava, permissão que esconde o que não deveria.
 *
 * Requer o banco populado (`npm run db:seed`) e o app rodando na porta do
 * playwright.config.ts.
 */
import { expect, test, type Page } from "@playwright/test";

const DONO = { email: "ana@sorrisoestetica.com.br", senha: "odonto123" };
const RECEPCAO = { email: "recepcao@sorrisoestetica.com.br", senha: "odonto123" };

async function entrar(page: Page, user: { email: string; senha: string }) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/painel");
}

test("login inválido não entra e não revela se o e-mail existe", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(DONO.email);
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
  expect(page.url()).toContain("/entrar");
});

test("visitante não acessa área interna", async ({ page }) => {
  await page.goto("/pacientes");
  await page.waitForURL("**/entrar");
});

test("painel mostra a operação do dia", async ({ page }) => {
  await entrar(page, DONO);

  await expect(page.getByRole("heading", { name: /Olá, Ana/ })).toBeVisible();
  await expect(page.getByText("Atendimentos hoje")).toBeVisible();
  await expect(page.getByText("Recebido no mês")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agenda de hoje" })).toBeVisible();
});

test("agenda do dia lista os atendimentos e troca de status", async ({ page }) => {
  await entrar(page, DONO);
  await page.getByRole("link", { name: "Agenda", exact: true }).click();
  await page.waitForURL("**/agenda");

  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();

  const linha = page.locator("table tbody tr").filter({ hasText: "Agendado" }).first();
  await expect(linha).toBeVisible();
  const paciente = await linha.locator("td").nth(1).innerText();

  await linha.getByRole("button", { name: "Confirmar" }).click();

  const confirmada = page
    .locator("table tbody tr")
    .filter({ hasText: paciente.trim() })
    .first();
  await expect(confirmada.getByText("Confirmado")).toBeVisible();
});

test("agenda recusa dois atendimentos no mesmo horário do profissional", async ({ page }) => {
  await entrar(page, DONO);
  await page.goto("/agenda");

  await page.getByText("+ Novo agendamento").click();

  await page.getByPlaceholder("Buscar por nome, telefone ou CPF").fill("Mariana");
  await page.getByRole("button", { name: /Mariana Alves/ }).click();

  const hoje = new Date();
  const dia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const novo = page.locator("form").filter({ has: page.locator("select[name=professionalId]") });
  await novo.locator("select[name=professionalId]").selectOption({ label: "Dra. Ana Souza" });
  await novo.locator("input[name=startsAt]").fill(`${dia}T09:15`);
  await page.getByRole("button", { name: "Agendar" }).click();

  await expect(
    page.getByText("Este profissional já tem atendimento nesse horario."),
  ).toBeVisible();
});

test("funil cria lead e registra contato", async ({ page }) => {
  // Nome único: o teste roda contra um banco que já tem histórico e não pode
  // depender de ser a primeira execucao.
  const nome = `Lead Teste ${Date.now()}`;

  await entrar(page, DONO);
  await page.goto("/funil");

  await expect(page.getByRole("heading", { name: "Funil de vendas" })).toBeVisible();
    await page.getByText("+ Novo lead").click();
  await page.getByRole("textbox", { name: "Nome" }).fill(nome);
  await page.getByRole("textbox", { name: "WhatsApp" }).fill("11988887777");
  await page.getByRole("textbox", { name: "Interesse" }).fill("Clareamento");
  await page.getByRole("textbox", { name: "Valor potencial" }).fill("R$ 1.200,00");
  await page.getByRole("button", { name: "Adicionar lead" }).click();

  await expect(page.getByText(`Lead ${nome} adicionado ao funil.`)).toBeVisible();
  await expect(page.getByRole("link", { name: nome })).toBeVisible();

  await page.getByRole("link", { name: nome }).click();
  await page.waitForURL(/\/funil\/.+/);
  await page.getByLabel("O que aconteceu").fill("Respondeu no WhatsApp, quer orçamento.");
  await page.getByRole("button", { name: "Registrar contato" }).click();

  await expect(
    page.getByText("Respondeu no WhatsApp, quer orçamento.").first(),
  ).toBeVisible();

  // A criacao do lead também deixa rastro na linha do tempo.
  await expect(page.getByText(/Lead criado via/)).toBeVisible();
});

test("orçamento aprovado gera as parcelas no financeiro", async ({ page }) => {
  await entrar(page, DONO);
  await page.goto("/orcamentos");

  await page.getByText("+ Novo orçamento").click();
  await page.getByPlaceholder("Buscar por nome, telefone ou CPF").fill("Sandra");
  await page.getByRole("button", { name: /Sandra Ribeiro/ }).click();
  await page.getByRole("button", { name: "Criar orçamento" }).click();

  await page.waitForURL(/\/orcamentos\/.+/);

  const clareamento = await page
    .locator("select[name=procedureId] option", { hasText: "Clareamento a laser" })
    .first()
    .getAttribute("value");
  await page.getByLabel("Procedimento").selectOption(clareamento ?? "");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("cell", { name: "Clareamento a laser" })).toBeVisible();

  await page.getByLabel("Parcelas").fill("3");
  await page.getByRole("button", { name: /Aprovar e gerar/ }).click();

  await page.waitForURL(/aprovado=3/);
  await expect(page.getByText(/Orcamento aprovado\. 3 parcelas geradas no financeiro\./)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Parcelas geradas" })).toBeVisible();

  await page.goto("/financeiro");
  await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sandra Ribeiro" }).first()).toBeVisible();
});

test("prontuário registra evolução e odontograma", async ({ page }) => {
  await entrar(page, DONO);
  await page.goto("/pacientes");

  await page.getByRole("link", { name: "Roberto Carvalho" }).click();
  await page.waitForURL(/\/pacientes\/.+/);

  await expect(page.getByText("Alergia a penicilina.")).toBeVisible();

  await page.getByRole("link", { name: "Prontuário" }).click();
  await expect(page.getByRole("heading", { name: "Odontograma" })).toBeVisible();

  await page.getByRole("button", { name: "16", exact: false }).first().click();
  await page.getByRole("button", { name: "Cárie", exact: true }).click();
  await page.getByRole("button", { name: "Salvar odontograma" }).click();
  await expect(page.getByText("Salvo.")).toBeVisible();

  await page.getByLabel("Evolução do atendimento").fill("Paciente relatou sensibilidade no 26.");
  await page.getByRole("button", { name: "Registrar evolução" }).click();
  await expect(page.getByText("Paciente relatou sensibilidade no 26.")).toBeVisible();
});

test("recepção vê a operação mas não o prontuário nem a baixa de pagamento", async ({ page }) => {
  await entrar(page, RECEPCAO);

  await expect(page.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();

  // Recepção consulta o que o paciente deve (para cobrar no balcao), mas não
  // registra o recebimento: essa baixa e do financeiro.
  await page.goto("/financeiro");
  await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Receber" })).toHaveCount(0);
  await expect(page.getByText("+ Lançamento avulso")).toHaveCount(0);

  await page.goto("/pacientes");
  await page.getByRole("link", { name: "Roberto Carvalho" }).click();
  await expect(page.getByRole("link", { name: "Prontuário" })).toHaveCount(0);

  // A aba existe na URL, mas o conteudo clinico não e servido.
  await page.goto(`${page.url().split("?")[0]}?aba=prontuario`);
  await expect(page.getByRole("heading", { name: "Odontograma" })).toHaveCount(0);
});
