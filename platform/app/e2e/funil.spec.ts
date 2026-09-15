import { expect, test, type Page } from "@playwright/test";

/**
 * Funil, pelo navegador.
 *
 * O caminho que estes testes percorrem é o que o CRM existe para servir: uma
 * pessoa liga, alguém registra, alguém combina voltar a falar, e um dia isso
 * vira dinheiro. O último teste é o que importa — ganhar no funil e ter
 * recebível no financeiro são o MESMO evento, não dois números parecidos.
 *
 * Cada teste cria o próprio contato, com telefone único: lead e negócio são
 * recurso compartilhado entre specs, e `.first()` numa fila comum faz um teste
 * pegar o contato do vizinho.
 */

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const FINANCEIRO = "financeiro@sorriso.com.br";

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

async function escolher(page: Page, campo: string, trecho: string): Promise<void> {
  const seletor = page.locator(`select[name="${campo}"]`).first();
  const opcao = seletor.locator("option", { hasText: trecho }).first();
  await seletor.selectOption(await opcao.getAttribute("value"));
}

let n = 0;

/** Cadastra um contato e devolve a URL do negócio dele. */
async function contato(page: Page, nome: string, valor = "3.000,00"): Promise<string> {
  n += 1;

  await page.goto("/funil/novo");
  await page.getByLabel("Nome", { exact: true }).fill(nome);
  await page.getByLabel("Telefone").fill(`11955${String(n).padStart(6, "0")}`);
  await page.getByLabel("Valor estimado (R$)").fill(valor);
  await page.getByLabel("O que a pessoa quer").fill(`Interesse de ${nome}`);
  await page.getByRole("button", { name: "Cadastrar contato" }).click();

  await page.waitForURL(/\/funil\/[0-9a-f-]{36}$/);
  return page.url();
}

test.describe("o contato entra", () => {
  test("lead e negócio nascem juntos, e o cartão aparece no quadro", async ({ page }) => {
    await entrar(page, DONA);
    await contato(page, "Helena Marques");

    await page.goto("/funil");
    const cartao = page.locator("li").filter({ hasText: "Helena Marques" }).first();

    await expect(cartao).toBeVisible();
    // Ainda não é paciente, e o quadro diz isso.
    await expect(cartao.getByText("lead")).toBeVisible();
    // Nunca tocado é exatamente o que se perde por silêncio.
    await expect(cartao.getByText("sem contato")).toBeVisible();
  });

  test("quem não mexe no funil não vê o botão de cadastrar", async ({ page }) => {
    await entrar(page, FINANCEIRO);
    await page.goto("/funil");

    await expect(page.getByRole("link", { name: "Novo contato" })).toHaveCount(0);
  });
});

test.describe("mover pelo funil", () => {
  test("o cartão anda de etapa pelo seletor, sem arrastar", async ({ page }) => {
    await entrar(page, DONA);
    const negocio = await contato(page, "Vai andar");

    await page.goto("/funil");
    const cartao = page.locator("li").filter({ hasText: "Vai andar" }).first();
    await escolherNoCartao(cartao, "Em contato");

    await expect(page.getByText("Negócio movido de etapa.")).toBeVisible();

    // A etapa mudou de verdade — e a prova é o estado do negócio, não em que
    // pedaço da tela o cartão foi parar.
    await page.goto(negocio);
    await expect(
      // `exact` porque "sem contato" contém "em contato": o casamento padrão é
      // por substring, e o outro número do resumo casaria junto.
      page
        .getByRole("region", { name: "Resumo do negócio" })
        .getByText("Em contato", { exact: true }),
    ).toBeVisible();
    // E o histórico guarda de onde veio: a abertura e o movimento, duas linhas
    // — por isso "Novo lead" aparece duas vezes, e a primeira basta.
    const historico = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Histórico de etapas" }) });

    await expect(historico.getByRole("listitem")).toHaveCount(2);
    await expect(historico.getByText("Novo lead", { exact: true }).first()).toBeVisible();
  });

  test("não existe caminho para ganhar sem orçamento", async ({ page }) => {
    await entrar(page, DONA);
    const negocio = await contato(page, "Sem atalho");

    // Nem no quadro nem na ficha a etapa de ganho é oferecida.
    await page.goto(negocio);
    const mover = page.locator('select[name="stageId"]').first();
    await expect(mover.locator("option", { hasText: "Fechado" })).toHaveCount(0);

    await expect(page.getByText(/Ganhar é o aceite do orçamento/)).toBeVisible();
  });

  test("perder exige motivo, e o motivo fica na tela", async ({ page }) => {
    await entrar(page, DONA);
    const negocio = await contato(page, "Vai perder");

    await page.goto(negocio);
    await page.getByRole("button", { name: "Registrar perda" }).click();
    await escolher(page, "lossReasonId", "Preço");
    await page.getByLabel("Observações da perda").fill("Achou caro, vai pesquisar.");
    await page.getByRole("button", { name: "Registrar perda" }).click();

    await expect(page.getByText(/Perda registrada/)).toBeVisible();
    await expect(page.getByText("Achou caro, vai pesquisar.")).toBeVisible();

    // E sai do quadro.
    await page.goto("/funil");
    await expect(page.locator("li").filter({ hasText: "Vai perder" })).toHaveCount(0);
  });
});

test.describe("contato e próxima ação", () => {
  test("registrar conversa esquenta o negócio", async ({ page }) => {
    await entrar(page, DONA);
    const negocio = await contato(page, "Vai esquentar");

    await page.goto(negocio);
    await page.getByLabel("O que aconteceu").fill("Mandei os valores por mensagem.");
    await page.getByRole("button", { name: "Registrar", exact: true }).click();

    await expect(page.getByText("Contato registrado.")).toBeVisible();
    await expect(page.getByText("Mandei os valores por mensagem.")).toBeVisible();

    await page.goto("/funil");
    const cartao = page.locator("li").filter({ hasText: "Vai esquentar" }).first();
    await expect(cartao.getByText("falado hoje")).toBeVisible();
  });

  test("a próxima ação entra na fila de pendências da clínica", async ({ page }) => {
    await entrar(page, DONA);
    const negocio = await contato(page, "Com pendência");

    const amanha = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    await page.goto(negocio);
    await page.getByLabel("O que fazer").fill("Ligar para confirmar a avaliação");
    await page.getByLabel("Quando").fill(amanha);
    await page.getByRole("button", { name: "Marcar" }).click();

    await expect(page.getByText("Próxima ação marcada.")).toBeVisible();

    await page.goto("/funil/pendencias");
    const linha = page
      .locator("li")
      .filter({ hasText: "Ligar para confirmar a avaliação" })
      .first();

    await expect(linha.getByText("Com pendência")).toBeVisible();

    await linha.getByRole("button", { name: "Concluir" }).click();
    await expect(page.getByText("Tarefa concluída.")).toBeVisible();
    await expect(
      page.locator("li").filter({ hasText: "Ligar para confirmar a avaliação" }),
    ).toHaveCount(0);
  });
});

test.describe("do contato ao dinheiro", () => {
  test("converter, orçar e aceitar — o funil e o financeiro dizem o mesmo", async ({
    page,
  }) => {
    await entrar(page, DONA);
    const negocio = await contato(page, "Fecha o ciclo", "5.000,00");

    // Sem paciente não dá para orçar, e a tela diz isso em vez de esconder.
    await page.goto(negocio);
    await expect(page.getByText(/Converta o contato em paciente para poder orçar/)).toBeVisible();

    await page.getByRole("button", { name: "Converter em paciente" }).click();
    await expect(page.getByText(/Paciente criado/)).toBeVisible();

    await page.getByRole("link", { name: "nova proposta" }).click();
    await page.waitForURL(/\/orcamentos\/novo/);
    await page.getByLabel("Título").fill("Proposta do funil");
    await page.getByRole("button", { name: "Criar orçamento" }).click();
    await page.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);

    await escolher(page, "procedureId", "Clareamento");
    await page.getByRole("button", { name: "Adicionar", exact: true }).click();
    await expect(page.getByText("Item adicionado.")).toBeVisible();

    // O valor do negócio passa a ser o do documento, não a estimativa.
    await page.goto(negocio);
    await expect(page.locator("main").getByText(/R\$\s*900,00/).first()).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Resumo do negócio" }).getByText("Do orçamento"),
    ).toBeVisible();

    await page.getByRole("link", { name: /Orçamento #/ }).click();
    await page.waitForURL(/\/orcamentos\/[0-9a-f-]{36}$/);

    await page.getByRole("button", { name: "Enviar ao paciente" }).click();
    await expect(page.getByText("Orçamento enviado ao paciente.")).toBeVisible();
    await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
    await page.getByLabel("Quem está aceitando").fill("Fecha o ciclo");
    await page.getByRole("button", { name: "Confirmar aceite" }).click();
    await expect(page.getByText("Aceite registrado e assinado.")).toBeVisible();

    // Ganhou no funil…
    await page.goto(negocio);
    await expect(page.locator("main").getByText("Fechado").first()).toBeVisible();
    await expect(page.getByText(/Fechado pelo aceite do orçamento/)).toBeVisible();

    // …e o dinheiro está no financeiro, pelo mesmo valor.
    await page.goto("/financeiro?recorte=abertas&busca=Fecha o ciclo");
    await expect(page.getByText(/R\$\s*900,00/).first()).toBeVisible();
  });
});

/** Escolhe a etapa no seletor do cartão, que se envia sozinho ao mudar. */
async function escolherNoCartao(
  cartao: ReturnType<Page["locator"]>,
  etapa: string,
): Promise<void> {
  const seletor = cartao.locator("select");
  const opcao = seletor.locator("option", { hasText: etapa }).first();
  await seletor.selectOption(await opcao.getAttribute("value"));
}
