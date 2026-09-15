/**
 * Monta o cenário de demonstração PELA INTERFACE.
 *
 * Plantar o estado direto no banco mente: mostra uma tela que talvez nem seja
 * alcançável clicando. Este script faz o que a clínica faria — monta o
 * orçamento, aceita, abre o caixa e recebe — e por isso quebra quando o
 * caminho quebra, que é exatamente o que se quer de um roteiro de demonstração.
 *
 *   ../db/reset.sh && npx next build && npx next start --port 3200 &
 *   node scripts/demo.mjs && node scripts/capturas.mjs
 */
import { chromium } from "@playwright/test";

const BASE = process.env.DEMO_URL ?? "http://127.0.0.1:3200";
const SENHA = "senha-de-teste-123";
const ROBERTO = "0a222222-2222-7222-8222-222222222222";
const MARIANA = "0a111111-1111-7111-8111-111111111111";

const CHROMIUM =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/**
 * Escolhe a opcao pelo TRECHO do texto, nao pelo rotulo inteiro.
 *
 * O rotulo carrega o preco formatado, e "R$ 180,00" em pt-BR usa espaco
 * inquebravel — comparar a string inteira quebra por um caractere invisivel.
 */
async function escolher(page, campo, trecho) {
  const opcao = page.locator(`select[name="${campo}"] option`, { hasText: trecho }).first();
  await page.locator(`select[name="${campo}"]`).selectOption(await opcao.getAttribute("value"));
}

const browser = await chromium.launch({ executablePath: CHROMIUM });
const context = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
const page = await context.newPage();

await page.goto(`${BASE}/entrar`);
await page.getByLabel("E-mail").fill("ana@sorriso.com.br");
await page.getByLabel("Senha").fill(SENHA);
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL(/pacientes/);

// ---------------------------------------------------------------- orçamento --
await page.goto(`${BASE}/orcamentos/novo?paciente=${ROBERTO}`);
await page.getByLabel("Título").fill("Reabilitação inferior direita");
await page.getByRole("button", { name: "Criar orçamento" }).click();
await page.waitForURL(/orcamentos\/[0-9a-f-]{36}$/);

await page.getByLabel("Parcelas").selectOption("6");
await page.getByLabel("Entrada (R$)").fill("800,00");
await page.getByRole("button", { name: "Salvar condições" }).click();
await page.getByText("Condições atualizadas.").waitFor();

await page.getByRole("button", { name: "Enviar ao paciente" }).click();
await page.getByText("Orçamento enviado ao paciente.").waitFor();

await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
await page.getByLabel("Quem está aceitando").fill("Roberto Carvalho");
await page.getByRole("button", { name: "Confirmar aceite" }).click();
await page.getByText("Aceite registrado e assinado.").waitFor();
console.log("orçamento aceito · parcelas geradas");

// --------------------------------------------------------------- convênio --
// A mesma resina, pela tabela do convênio: R$ 280,00 particular contra
// R$ 180,00. Passa pelo seletor da tela, não por insert no banco.
await page.goto(`${BASE}/orcamentos/novo?paciente=${MARIANA}`);
await page.getByLabel("Título").fill("Restauração pelo convênio");
await escolher(page, "payerId", "Odonto Saúde");
await page.getByRole("button", { name: "Criar orçamento" }).click();
await page.waitForURL(/orcamentos\/[0-9a-f-]{36}$/);

await escolher(page, "procedureId", "Restauração em resina");
await page.getByLabel("Dente").fill("36");
await page.getByRole("checkbox", { name: "O", exact: true }).check();
await page.getByRole("button", { name: "Adicionar" }).click();
await page.getByText("Item adicionado.").waitFor();
console.log("orçamento por convênio · item precificado pela tabela do pagador");

// ----------------------------------------------------------------- funil --
// O caminho inteiro do funil, pela tela: contato novo, conversa registrada,
// próxima ação marcada, lead virando paciente, proposta e aceite — que é o que
// ganha o negócio.
await page.goto(`${BASE}/funil/novo`);
await page.getByLabel("Nome", { exact: true }).fill("Helena Marques");
await page.getByLabel("Telefone").fill("11987659999");
await escolher(page, "sourceId", "Indicação");
await page.getByLabel("Valor estimado (R$)").fill("2.800,00");
await page.getByLabel("O que a pessoa quer").fill("Clareamento antes do casamento");
await page.getByRole("button", { name: "Cadastrar contato" }).click();
await page.waitForURL(/funil\/[0-9a-f-]{36}$/);
const negocio = page.url();

await page.getByLabel("O que aconteceu").fill("Explicou a data do casamento. Quer começar já.");
await page.getByRole("button", { name: "Registrar", exact: true }).click();
await page.getByText("Contato registrado.").waitFor();

const daquiA = (dias) => {
  const d = new Date(Date.now() + dias * 86400000);
  return d.toISOString().slice(0, 16);
};
await page.getByLabel("O que fazer").fill("Confirmar a avaliação de segunda");
await page.getByLabel("Quando").fill(daquiA(2));
await page.getByRole("button", { name: "Marcar" }).click();
await page.getByText("Próxima ação marcada.").waitFor();
console.log("contato no funil · conversa e próxima ação registradas");

await page.getByRole("button", { name: "Converter em paciente" }).click();
await page.getByText(/Paciente criado/).waitFor();

await page.getByRole("link", { name: "nova proposta" }).click();
await page.waitForURL(/orcamentos\/novo/);
await page.getByLabel("Título").fill("Clareamento antes do casamento");
await page.getByRole("button", { name: "Criar orçamento" }).click();
await page.waitForURL(/orcamentos\/[0-9a-f-]{36}$/);

await escolher(page, "procedureId", "Clareamento");
await page.getByRole("button", { name: "Adicionar", exact: true }).click();
await page.getByText("Item adicionado.").waitFor();

await page.getByRole("button", { name: "Enviar ao paciente" }).click();
await page.getByText("Orçamento enviado ao paciente.").waitFor();
await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
await page.getByLabel("Quem está aceitando").fill("Helena Marques");
await page.getByRole("button", { name: "Confirmar aceite" }).click();
await page.getByText("Aceite registrado e assinado.").waitFor();

await page.goto(negocio);
await page.getByText("Fechado").first().waitFor();
console.log("negócio ganho pelo aceite · funil e financeiro dizendo o mesmo");

// ---------------------------------------------------------- faturamento --
// O ciclo inteiro do convênio faturado por guia, pela tela: aceitar, faturar
// no lote, enviar, conferir o repasse com glosa, e recorrer.
await page.goto(`${BASE}/orcamentos/novo?paciente=${MARIANA}`);
await page.getByLabel("Título").fill("Implante pelo convênio faturado");
await escolher(page, "payerId", "Dental Mais");
await page.getByRole("button", { name: "Criar orçamento" }).click();
await page.waitForURL(/orcamentos\/[0-9a-f-]{36}$/);

await escolher(page, "procedureId", "Implante unitário");
await page.getByLabel("Dente").fill("46");
await page.getByRole("button", { name: "Adicionar", exact: true }).click();
await page.getByText("Item adicionado.").waitFor();

await page.getByRole("button", { name: "Enviar ao paciente" }).click();
await page.getByText("Orçamento enviado ao paciente.").waitFor();
await page.getByRole("button", { name: "Registrar aceite do paciente" }).click();
await page.getByLabel("Quem está aceitando").fill("Mariana Alves");
await page.getByRole("button", { name: "Confirmar aceite" }).click();
await page.getByText("Aceite registrado e assinado.").waitFor();
console.log("guia emitida · co-participação virou cobrança do paciente");

// Fatura a guia no lote da competência.
await page.goto(`${BASE}/faturamento`);
const guia = page.locator("li").filter({ hasText: "Mariana Alves" }).first();
await guia.getByRole("checkbox").check();
await page.getByRole("button", { name: "Faturar no lote" }).click();
await page.getByText(/guia faturada|guias faturadas/).waitFor();

await page.getByRole("link", { name: "Dental Mais" }).first().click();
await page.waitForURL(/faturamento\/lotes\/[0-9a-f-]{36}$/);
const lote = page.url();

await page.getByRole("button", { name: "Enviar lote" }).click();
await page.getByText(/Lote enviado/).waitFor();
console.log("lote enviado ao convênio");

// O demonstrativo chega datado de cinco dias atrás: o prazo conta de lá.
const cincoDiasAtras = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
await page.goto(lote);
await page.getByLabel("Data do demonstrativo").fill(cincoDiasAtras);
await page.getByRole("button", { name: "Registrar" }).click();
await page.getByText(/prazo de recurso conta dela/).waitFor();

// E o convênio pagou R$ 1.600,00 dos R$ 2.100,00 faturados.
await page.goto(lote);
const linhaDaGuia = page.locator("tr").filter({ hasText: "Implante unitário" }).first();
await linhaDaGuia.getByLabel(/^Pago em/).fill("1600,00");
await linhaDaGuia.getByLabel("Código da glosa").fill("1707");
await linhaDaGuia.getByLabel("Motivo da glosa").fill("Procedimento não coberto pelo plano contratado");
await linhaDaGuia.getByRole("button", { name: "Conferir" }).click();
await page.getByText(/R\$\s*500,00 glosado/).waitFor();
console.log("repasse conferido · glosa de R$ 500,00 com prazo");

// Recorre da glosa: é onde está o dinheiro que a clínica perde por silêncio.
await page.goto(`${BASE}/faturamento/glosas`);
await escolher(page, "status", "Recorri");
await page
  .getByLabel("Observações do recurso")
  .first()
  .fill("Enviado o comprovante de autorização prévia.");
await page.getByRole("button", { name: "Registrar" }).first().click();
await page.getByText(/Recurso registrado/).waitFor();
console.log("recurso registrado · a glosa continua contando até o convênio responder");

// ------------------------------------------------------------------- caixa --
await page.goto(`${BASE}/financeiro/caixa`);
await page.getByLabel("Abertura (R$)").fill("200,00");
await page.getByRole("button", { name: "Abrir caixa" }).click();
await page.getByText("Caixa aberto.").waitFor();

// A parcela vencida da Camila, em dinheiro: entra na gaveta com mora.
await page.goto(`${BASE}/financeiro?recorte=vencidas&busca=Camila`);
const linha = page.locator("li").filter({ hasText: "Camila" }).first();
await linha.getByRole("button", { name: "Receber" }).click();
await linha.getByLabel("Forma de pagamento").selectOption({ label: "Dinheiro" });
await linha.getByRole("button", { name: "Confirmar" }).click();
await page.getByText(/Parcela quitada/).waitFor();
console.log("caixa aberto · recebimento em dinheiro com mora");

await browser.close();
