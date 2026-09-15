import { expect, test, type Page } from "@playwright/test";

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const RECEPCAO = "recepcao@sorriso.com.br";

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

/** O dia da clinica, nao o do runner. */
const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

test.describe("grade do dia", () => {
  test("abre no dia de hoje com os profissionais em expediente", async ({ page }) => {
    await entrar(page, DONA);
    await page.getByRole("link", { name: "Agenda" }).click();

    await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
    // O seletor de unidade no menu também traz o nome; a asserção é sobre a
    // página.
    await expect(page.locator("main").getByText("Sorriso Centro")).toBeVisible();

    const grade = page.getByRole("region", { name: "Grade do dia" }).or(page.locator("body"));
    await expect(grade.getByText("Ana Souza").first()).toBeVisible();
    await expect(grade.getByText("Bruno Lima").first()).toBeVisible();

    // O bloqueio de almoco tem que ser visivel: e a explicacao do buraco.
    await expect(page.getByText("Almoço").first()).toBeVisible();
  });

  test("o resumo do dia conta o que a recepcao precisa saber", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/agenda?data=${hoje}`);

    const resumo = page.getByRole("region", { name: "Resumo do dia" });
    for (const rotulo of ["Atendimentos", "A confirmar", "Ocupação", "Receita prevista"]) {
      await expect(resumo.getByText(rotulo, { exact: true })).toBeVisible();
    }

    // 9 atendimentos no seed do dia.
    await expect(resumo.getByText("9", { exact: true })).toBeVisible();
  });

  test("dia sem movimento nao finge que tem", async ({ page }) => {
    await entrar(page, DONA);
    // Um domingo qualquer bem distante: ninguem tem expediente.
    await page.goto("/agenda?data=2027-01-03");

    await expect(page.getByText("Nenhum atendimento neste dia.")).toBeVisible();
  });
});

test.describe("maquina de estados pela tela", () => {
  test("confirmar muda o estado do atendimento", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto(`/agenda?data=${hoje}`);

    // Sergio Tavares as 15:30 esta 'A confirmar' no seed.
    const linha = page.locator("li").filter({ hasText: "Sergio Tavares" }).first();
    await linha.getByRole("button", { name: "Confirmar" }).click();

    await expect(linha.getByText("Consulta confirmada.")).toBeVisible();
    await expect(linha.getByText("Confirmado")).toBeVisible();
  });

  test("cancelar exige motivo antes de deixar cancelar", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto(`/agenda?data=${hoje}`);

    const linha = page.locator("li").filter({ hasText: "Mariana Alves" }).first();
    await linha.getByRole("button", { name: "Cancelar" }).click();

    const motivo = linha.getByPlaceholder("Motivo do cancelamento");
    await expect(motivo).toBeVisible();

    await motivo.fill("Paciente pediu para remarcar.");
    await linha.getByRole("button", { name: "Confirmar" }).click();

    await expect(linha.getByText("Agendamento cancelado.")).toBeVisible();
  });

  test("atendimento concluido nao oferece acao de volta", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto(`/agenda?data=${hoje}`);

    const linha = page.locator("li").filter({ hasText: "Camila Duarte" }).first();
    await expect(linha.getByText("Atendido")).toBeVisible();
    await expect(linha.getByRole("button")).toHaveCount(0);
  });
});

test.describe("encaixe", () => {
  test("conflito de horario e recusado pelo banco, em portugues", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto(`/agenda/novo?data=${hoje}`);

    // 08:00 da Ana ja esta ocupado pela Camila no seed.
    await page.getByLabel("Paciente").selectOption({ label: "Luiza Prado" });
    await page.getByLabel("Profissional").selectOption({ label: "Ana Souza · Implantodontia" });
    await page.getByLabel("Horário").fill("08:15");
    await page.getByLabel("Duração (minutos)").fill("30");
    await page.getByRole("button", { name: "Agendar" }).click();

    // A mensagem vem da exclusion constraint, traduzida — nao de uma checagem
    // na tela, que uma segunda aba driblaria.
    await expect(
      page.getByText("Este profissional ja tem atendimento marcado nesse horario."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/agenda\/novo/);
  });

  test("horario livre entra na grade", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto(`/agenda/novo?data=${hoje}`);

    await page.getByLabel("Paciente").selectOption({ label: "Paulo Henrique" });
    await page.getByLabel("Profissional").selectOption({ label: "Bruno Lima · Ortodontia" });
    await page.getByLabel("Horário").fill("13:00");
    await page.getByLabel("Duração (minutos)").fill("30");
    await page.getByRole("button", { name: "Agendar" }).click();

    await page.waitForURL(/\/agenda\?/);
    await expect(page.getByText("Agendamento criado.")).toBeVisible();
    await expect(
      page.locator("li").filter({ hasText: "13:00–13:30" }).first(),
    ).toBeVisible();
  });
});
