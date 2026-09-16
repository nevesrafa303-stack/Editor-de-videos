import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

/**
 * Painel gerencial, pelo navegador.
 *
 * O que estes testes seguram não é "a página abre". É o conjunto de coisas que
 * fazem alguém parar de confiar num relatório:
 *
 *   - dois números da MESMA tela que não fecham entre si;
 *   - o período da URL não ser o período mostrado;
 *   - o filtro de unidade não repartir nada;
 *   - quem não pode ver dinheiro ver dinheiro.
 */

const SENHA = "senha-de-teste-123";
const DONA = "ana@sorriso.com.br";
const PROFISSIONAL = "carla@sorriso.com.br";
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

/** "R$ 1.234,56" -> 123456. Sem `Number`: o ponto de milhar mente. */
function centavos(texto: string): number {
  const digitos = texto.replace(/\D/g, "");
  return digitos.length ? Number(digitos) : 0;
}

async function valorDoCartao(page: Page, rotulo: string): Promise<number> {
  const resumo = page.getByRole("region", { name: "Resumo do período" });
  const bloco = resumo.locator("div", { has: page.getByText(rotulo, { exact: true }) }).last();

  // Só o VALOR, não o cartão inteiro. Desde que existe a comparação com o mês
  // anterior, o texto do cartão carrega dois números — e `centavos()` colava os
  // dígitos dos dois num só ("R$ 768,00" + "20%" = 76800020).
  return centavos((await bloco.locator(".num").first().textContent()) ?? "");
}

// Janela larga: o seed espalha o histórico por três meses, e o mês corrente
// sozinho não tem gente suficiente para o funil mostrar mais de uma etapa.
const AMPLO = "?de=2020-01-01&ate=2099-12-31";

test.describe("relatórios", () => {
  test("o período da URL é o período mostrado", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/relatorios?de=2026-03-01&ate=2026-03-31");

    // O rótulo do período também aparece nos textos de "nada aqui" de cada
    // painel vazio, então o alvo é o cabeçalho, não a primeira ocorrência.
    await expect(page.getByText("01/03/2026 a 31/03/2026").first()).toBeVisible();
  });

  test("mudar o período pelo formulário muda o endereço", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto("/relatorios");

    const filtro = page.getByRole("form", { name: "Período do relatório" });
    await filtro.locator('input[name="de"]').fill("2026-01-01");
    await filtro.locator('input[name="ate"]').fill("2026-12-31");
    await filtro.getByRole("button", { name: "Aplicar" }).click();

    // É o que torna o relatório compartilhável: sem isso ele vira captura de
    // tela, e ninguém confere uma captura de tela.
    await expect(page).toHaveURL(/de=2026-01-01.*ate=2026-12-31/);
    await expect(page.getByText("01/01/2026 a 31/12/2026").first()).toBeVisible();
  });

  test("o vendido do resumo bate com a soma da tabela de procedimentos", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/relatorios${AMPLO}`);

    const vendido = await valorDoCartao(page, "Vendido");

    // Escopado ao painel: desde que existe também a tabela de custo real, um
    // `table tbody tr` solto soma as duas e o teste passa a medir outra coisa.
    const linhas = page
      .locator("section", { has: page.getByText("Vendido: margem orçada") })
      .last()
      .locator("tbody tr");
    const total = (await linhas.count()) === 0 ? 0 : await somaColuna(linhas, 2);

    expect(total).toBe(vendido);
  });

  test("o recebido do resumo bate com a soma por profissional", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/relatorios${AMPLO}`);

    const recebido = await valorDoCartao(page, "Recebido");

    // Segunda barra de cada linha do painel de profissionais.
    const painel = page
      .locator("section", { has: page.getByText("Faturamento por profissional") })
      .last();
    const valores = painel.locator("li > div:last-child > div > span");

    let soma = 0;
    const n = await valores.count();
    // Pares: a primeira de cada linha é "vendido", a segunda é "recebido".
    for (let i = 1; i < n; i += 2) {
      soma += centavos((await valores.nth(i).textContent()) ?? "");
    }

    expect(soma).toBe(recebido);
  });

  test("o funil nunca mostra mais gente adiante do que atrás", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/relatorios${AMPLO}`);

    const painel = page.locator("section", { has: page.getByText("Conversão do funil") }).last();
    const linhas = painel.locator("li");

    const contagens: number[] = [];
    for (let i = 0; i < (await linhas.count()); i++) {
      const texto = (await linhas.nth(i).textContent()) ?? "";
      const m = texto.match(/(\d+)\s+neg[óo]cios?/);
      if (m) contagens.push(Number(m[1]));
    }

    expect(contagens.length).toBeGreaterThan(1);
    for (let i = 1; i < contagens.length; i++) {
      expect(contagens[i]!).toBeLessThanOrEqual(contagens[i - 1]!);
    }
  });

  test("filtrar por unidade reparte o recebido em vez de repeti-lo", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/relatorios${AMPLO}`);

    const rede = await valorDoCartao(page, "Recebido");

    const seletor = page.locator('select[name="unidade"]');
    const opcoes = await seletor.locator("option").all();

    let soma = 0;
    for (const opcao of opcoes) {
      const valor = await opcao.getAttribute("value");
      if (!valor) continue;

      await page.goto(`/relatorios${AMPLO}&unidade=${valor}`);
      soma += await valorDoCartao(page, "Recebido");
    }

    expect(soma).toBe(rede);
  });

  test("período invertido vira frase, não erro", async ({ page }) => {
    await entrar(page, DONA);
    const resposta = await page.goto("/relatorios?de=2026-09-30&ate=2026-09-01");

    // O que não pode acontecer é a tela branca do 500 — e nem o silêncio, que
    // é pior: a pessoa leria os números do mês corrente achando que pediu
    // outra coisa.
    expect(resposta?.status()).toBeLessThan(500);
    await expect(
      page.getByText("A data final não pode ser anterior à inicial."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  });

  test("profissional vê funil e captação, não vê dinheiro", async ({ page }) => {
    await entrar(page, PROFISSIONAL);
    await page.goto(`/relatorios${AMPLO}`);

    await expect(page.getByText("Seu perfil não vê números financeiros.")).toBeVisible();
    await expect(page.getByText("Conversão do funil")).toBeVisible();
    await expect(page.getByText("Origem de captação")).toBeVisible();

    await expect(page.getByText("Faturamento por profissional")).toHaveCount(0);
    await expect(page.getByText("Vencido por unidade")).toHaveCount(0);
    await expect(page.getByText("Produção e margem por procedimento")).toHaveCount(0);
  });

  test("procedimento sem ficha técnica não vira margem cheia", async ({ page }) => {
    // É o número mais perigoso que este painel poderia exibir: custo real zero
    // porque ninguém cadastrou o que o procedimento consome, lido como margem
    // de 100%. A linha aparece, avisa, e não mostra percentual.
    await entrar(page, DONA);
    await page.goto(`/relatorios${AMPLO}`);

    const painel = page.locator("section", { has: page.getByText("Executado: custo real") }).last();
    const linha = painel.locator("tbody tr", { hasText: "Implante unitário" }).first();

    await expect(linha).toContainText("Sem ficha técnica");
    await expect(linha.locator("td").last()).toHaveText("—");
  });

  test("as duas tabelas dizem qual cohorte cada uma conta", async ({ page }) => {
    // Vendido e executado são recortes diferentes com colunas parecidas. Sem o
    // rótulo dizendo qual é qual, a pergunta que sobra é "qual número é o
    // certo?" — e aí nenhum dos dois serve.
    await entrar(page, DONA);
    await page.goto(`/relatorios${AMPLO}`);

    await expect(page.getByText("Vendido: margem orçada")).toBeVisible();
    await expect(page.getByText("Executado: custo real")).toBeVisible();
    await expect(page.getByText(/Orçamentos ACEITOS no período/)).toBeVisible();
    await expect(page.getByText(/Procedimentos FEITOS no período/)).toBeVisible();
  });

  test("o desperdício tem painel próprio e não se dilui na margem", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/relatorios${AMPLO}`);

    const painel = page
      .locator("section", { has: page.getByText("Saiu do estoque sem procedimento") })
      .last();

    await expect(painel).toContainText("Perda");
    await expect(painel).toContainText("fora do estoque");
  });

  test("o painel diz se o mês está melhor ou pior que o anterior", async ({ page }) => {
    // Número sem base é difícil de agir: "recebi R$ 12 mil" não diz nada
    // sozinho. O mês fechado compara com o mês calendário anterior, pelo nome.
    await entrar(page, DONA);
    await page.goto("/relatorios?de=2026-09-01&ate=2026-09-30");

    const resumo = page.getByRole("region", { name: "Resumo do período" });
    await expect(resumo).toContainText("vs. agosto");

    // "Vencido hoje" é foto de agora, não recorte de período: comparar seria
    // comparar o mesmo número com ele mesmo.
    const vencido = resumo
      .locator("div", { has: page.getByText("Vencido hoje") })
      .last();
    await expect(vencido).not.toContainText("vs.");
  });

  test("exportar leva o mesmo recorte da tela e abre como planilha", async ({ page }) => {
    await entrar(page, DONA);
    await page.goto(`/relatorios${AMPLO}`);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page
        .locator("section", { has: page.getByText("Executado: custo real") })
        .last()
        .getByText("Exportar")
        .click(),
    ]);

    // O período no nome: três exportações na pasta de Downloads sem isso são
    // três "relatorio.csv" e ninguém sabe qual é de qual mês.
    expect(download.suggestedFilename()).toContain("executado-custo-real");
    expect(download.suggestedFilename()).toMatch(/\d{4}-\d{2}-\d{2}.*\.csv$/);

    const conteudo = await readFile((await download.path())!, "utf8");
    expect(conteudo.startsWith("\ufeff")).toBe(true);
    expect(conteudo).toContain("Procedimento;Feitos;");
  });

  test("quem não pode exportar não vê o link nem alcança a rota", async ({ page }) => {
    await entrar(page, RECEPCAO);
    await page.goto("/relatorios");

    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
    await expect(page.getByText("Exportar")).toHaveCount(0);

    // A rota devolve 403, não redireciona: mandar um download para a tela de
    // "sem permissão" entregaria um HTML com nome .csv, que a pessoa abriria
    // no Excel e leria como dado.
    //
    // Pela navegação, e não por `page.request`: o cookie de sessão é `secure`,
    // e o contexto de request do Playwright não manda cookie secure sobre
    // HTTP. O navegador manda (localhost é origem confiável), então
    // `page.request` daria 401 e o teste estaria medindo o próprio teste.
    const resposta = await page.goto("/relatorios/exportar?secao=custo-real");
    expect(resposta?.status()).toBe(403);
  });

  test("seção desconhecida não vira arquivo vazio", async ({ page }) => {
    await entrar(page, DONA);
    const resposta = await page.goto("/relatorios/exportar?secao=inventada");

    expect(resposta?.status()).toBe(400);
  });

  test("o menu leva ao painel", async ({ page }) => {
    await entrar(page, DONA);
    await page.getByRole("link", { name: "Relatórios" }).click();

    await expect(page).toHaveURL(/\/relatorios/);
    await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  });
});

async function somaColuna(
  linhas: ReturnType<Page["locator"]>,
  indice: number,
): Promise<number> {
  let soma = 0;
  for (let i = 0; i < (await linhas.count()); i++) {
    const celula = linhas.nth(i).locator("td").nth(indice);
    soma += centavos((await celula.textContent()) ?? "");
  }
  return soma;
}
