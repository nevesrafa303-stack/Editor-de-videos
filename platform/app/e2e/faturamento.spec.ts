import { expect, test, type Page } from "@playwright/test";

/**
 * Faturamento por guia, pelo navegador.
 *
 * O ciclo que estes testes percorrem é o que separa uma clínica que aceita
 * convênio de uma que vive dele: aceitar, faturar no lote, enviar, conferir o
 * repasse com glosa, e recorrer dentro do prazo.
 *
 * O que se prova aqui, e que a suíte de integração não prova: que existe
 * CAMINHO clicável para cada etapa, e que cada uma confirma o que aconteceu
 * numa tela que muda de forma no sucesso.
 */

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const RECEPCAO = "recepcao@sorriso.com.br";

/**
 * Paulo Henrique é só deste arquivo.
 *
 * Guia na fila e lote aberto são recurso COMPARTILHADO entre os specs: dois
 * arquivos mirando a mesma paciente fazem um pegar a guia do outro, e o teste
 * passa ou falha conforme a ordem em que roda. Cada spec de faturamento tem o
 * seu paciente, e cada teste tem a sua competência — assim o lote que ele abre
 * é dele, e a lista sempre tem uma linha só com aquele mês.
 */
const PAULO = "0a555555-5555-7555-8555-555555555555";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-03" -> "mar/2026", como a tela escreve. */
function rotulo(mes: string): string {
  const [ano, m] = mes.split("-");
  return `${MESES[Number(m) - 1]}/${ano}`;
}

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto("/entrar");

  // `/entrar` com sessão viva redireciona para dentro do app. Trocar de
  // usuário no meio do arquivo exige sair primeiro.
  if (!page.url().includes("/entrar")) {
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL(/\/entrar/);
  }

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/pacientes/);
}

async function escolher(page: Page, campo: string, trecho: string): Promise<void> {
  const seletor = page.locator(`select[name="${campo}"]`).first();
  const opcao = seletor.locator("option", { hasText: trecho }).first();
  await seletor.selectOption(await opcao.getAttribute("value"));
}

/** Aceita um orçamento faturado com um implante, e devolve o título usado. */
async function guiaDe(page: Page, titulo: string): Promise<string> {
  await page.goto(`/orcamentos/novo?paciente=${PAULO}`);
  await page.getByLabel("Título").fill(titulo);
  await escolher(page, "payerId", "Dental Mais");
  await page.getByRole("button", { name: "Criar orçamento" }).click();
  await page.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);

  await escolher(page, "procedureId", "Implante unitário");
  await page.getByLabel("Dente").fill("46");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByText("Item adicionado.")).toBeVisible();

  await page.getByRole("button", { name: "Enviar ao paciente" }).click();
  await expect(page.getByText("Orçamento enviado ao paciente.")).toBeVisible();
  await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
  await page.getByLabel("Quem está aceitando").fill("Paulo Henrique");
  await page.getByRole("button", { name: "Confirmar aceite" }).click();
  await expect(page.getByText("Aceite registrado e assinado.")).toBeVisible();

  return titulo;
}

/** Leva a guia do Paulo para o lote DAQUELA competência, e abre o lote. */
async function faturarEabrir(page: Page, mes: string): Promise<string> {
  await page.goto("/faturamento");
  await page.locator("li").filter({ hasText: "Paulo Henrique" }).first()
    .getByRole("checkbox").check();
  await page.locator('input[name="competenceMonth"]').fill(mes);
  await page.getByRole("button", { name: "Faturar no lote" }).click();

  // A fila esvazia no sucesso — se o recado dependesse do formulário, ele
  // sumiria junto com a lista que o continha.
  await expect(page.getByText(/faturada|faturadas/)).toBeVisible();

  await page.locator("tr").filter({ hasText: rotulo(mes) }).first()
    .getByRole("link").click();
  await page.waitForURL(/\/faturamento\/lotes\/[0-9a-f-]{36}$/);
  return page.url();
}

test.describe("do aceite ao lote", () => {
  test("a guia entra na fila e o lote a recebe", async ({ page }) => {
    await entrar(page, DONA);
    await guiaDe(page, "Guia para o lote");

    await page.goto("/faturamento");
    // R$ 3.000,00 menos R$ 900,00 de co-participação.
    await expect(
      page.locator("li").filter({ hasText: "Paulo Henrique" }).first()
        .getByText(/R\$\s*2\.100,00/),
    ).toBeVisible();

    await faturarEabrir(page, "2026-01");

    // O lote ainda não saiu da clínica: o aviso diz isso, e a guia dentro dele
    // aparece como em lote.
    await expect(page.getByText(/O lote ainda não saiu da clínica/)).toBeVisible();
    await expect(page.locator("main").getByText("Em lote")).toBeVisible();
  });

  test("recepção monta o lote, mas o botão de enviar não é dela", async ({ page }) => {
    await entrar(page, DONA);
    await guiaDe(page, "Recepção monta");

    await entrar(page, RECEPCAO);
    await faturarEabrir(page, "2026-02");

    await expect(page.getByRole("button", { name: "Enviar lote" })).toHaveCount(0);
  });
});

test.describe("conferir o repasse", () => {
  test("o convênio pagou menos, e a diferença vira glosa com prazo", async ({ page }) => {
    await entrar(page, DONA);
    await guiaDe(page, "Conferir repasse");
    const lote = await faturarEabrir(page, "2026-03");

    await page.getByRole("button", { name: "Enviar lote" }).click();
    await expect(page.getByText(/Lote enviado/)).toBeVisible();

    // A data vem ANTES da conferência: é dela que o prazo conta.
    const cincoDiasAtras = new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10);
    await page.goto(lote);
    await expect(page.getByText(/Sem a data, a glosa nasce com prazo contado de hoje/)).toBeVisible();

    await page.getByLabel("Data do demonstrativo").fill(cincoDiasAtras);
    await page.getByRole("button", { name: "Registrar" }).click();
    await expect(page.getByText(/prazo de recurso conta dela/)).toBeVisible();

    await page.goto(lote);
    const linha = page.locator("tr").filter({ hasText: "Implante unitário" }).first();
    await linha.getByLabel(/^Pago em/).fill("1600,00");

    // O motivo só é pedido quando o valor digitado fica abaixo do faturado.
    await expect(linha.getByText(/Glosa de R\$\s*500,00/)).toBeVisible();

    await linha.getByLabel("Motivo da glosa").fill("Procedimento não coberto");
    await linha.getByRole("button", { name: "Conferir" }).click();

    await expect(page.getByText(/R\$\s*500,00 glosado/)).toBeVisible();

    // 5 dias atrás + 30 de prazo do convênio.
    await page.goto("/faturamento/glosas");
    await expect(page.getByText("25 dias")).toBeVisible();
  });

  test("a linha já conferida não pede o motivo de novo", async ({ page }) => {
    await entrar(page, DONA);
    await guiaDe(page, "Não pede de novo");
    const lote = await faturarEabrir(page, "2026-04");

    await page.getByRole("button", { name: "Enviar lote" }).click();
    await expect(page.getByText(/Lote enviado/)).toBeVisible();

    await page.goto(lote);
    const linha = page.locator("tr").filter({ hasText: "Implante unitário" }).first();
    await linha.getByLabel(/^Pago em/).fill("1500,00");
    await linha.getByLabel("Motivo da glosa").fill("Glosa parcial");
    await linha.getByRole("button", { name: "Conferir" }).click();
    await expect(page.getByText(/glosado/)).toBeVisible();

    // Depois de conferida, a linha mostra o resultado — não repete o aviso de
    // "sem motivo não há o que recorrer" com os campos em branco.
    await page.goto(lote);
    const conferida = page.locator("tr").filter({ hasText: "Implante unitário" }).first();
    await expect(conferida.getByText(/sem motivo não há o que recorrer/)).toHaveCount(0);
    await expect(conferida.getByRole("button", { name: "Corrigir" })).toBeDisabled();
  });

  test("o lote não fecha enquanto falta linha", async ({ page }) => {
    await entrar(page, DONA);
    await guiaDe(page, "Lote incompleto");
    const lote = await faturarEabrir(page, "2026-05");

    await page.getByRole("button", { name: "Enviar lote" }).click();
    await expect(page.getByText(/Lote enviado/)).toBeVisible();

    await page.goto(lote);
    await expect(page.getByText(/1 linha\(s\) ainda sem conferência/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Fechar lote" })).toBeDisabled();
  });
});

test.describe("recurso de glosa", () => {
  test("recorrer guarda o que foi enviado, e recuperar devolve o valor", async ({ page }) => {
    await entrar(page, DONA);
    await guiaDe(page, "Para recorrer");
    const lote = await faturarEabrir(page, "2026-06");

    await page.getByRole("button", { name: "Enviar lote" }).click();
    await expect(page.getByText(/Lote enviado/)).toBeVisible();

    await page.goto(lote);
    await page.getByLabel("Data do demonstrativo").fill(new Date().toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Registrar" }).click();
    await expect(page.getByText(/prazo de recurso conta dela/)).toBeVisible();

    await page.goto(lote);
    const linha = page.locator("tr").filter({ hasText: "Implante unitário" }).first();
    await linha.getByLabel(/^Pago em/).fill("1600,00");
    await linha.getByLabel("Motivo da glosa").fill("Procedimento não coberto");
    await linha.getByRole("button", { name: "Conferir" }).click();
    await expect(page.getByText(/glosado/)).toBeVisible();

    await page.goto("/faturamento/glosas");
    const glosa = page.locator("li").filter({ hasText: "Implante unitário" }).first();

    await escolher(page, "status", "Recorri");
    await glosa.getByLabel("Observações do recurso").fill("Enviado o comprovante de autorização.");
    await glosa.getByRole("button", { name: "Registrar" }).click();
    await expect(page.getByText(/Recurso registrado/)).toBeVisible();

    // O que foi escrito volta para a tela: pedir e depois esconder faria do
    // campo um buraco.
    await expect(page.getByText("Enviado o comprovante de autorização.")).toBeVisible();
    await expect(page.locator("main").getByText("Recorrida")).toBeVisible();
  });
});
