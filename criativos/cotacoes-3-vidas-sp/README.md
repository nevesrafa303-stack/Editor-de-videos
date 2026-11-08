# Cotações de 3 vidas em São Paulo (SP) — Amil, Bradesco Saúde e SulAmérica

Nove criativos estáticos, três para cada cotação enviada em 04/11/2026. Esta é a **versão 3**.

> **Versão 4 (08/11/2026), no estilo das referências 10, 14 e 16 aprovado pelo cliente:** SulAmérica e Bradesco em
> `criativos/cotacoes-sulamerica-bradesco-sp/`, com a rede de cada cotação conferida de novo (enfermaria, capital).

- **Formato:** um só, Story 1080×1920, com todo o texto entre y=290 e y=1536. Essa faixa fica livre das barras do Story
  e cabe no recorte 4:5 que o Meta faz para o Feed (y 285–1635).
- **Arquivos:** PNG em 2x (2160×3840) em `final/`; visão geral em `final/_visao-geral.jpg`.
- **Versões anteriores:** ficam em `final/_v1/`, `final/_v2/` e `pecas/_v1-*` e `pecas/_v2-*`, fora do render.

## As cotações

| Operadora | Plano | Acomodação | Coparticipação | 3 vidas | Valor |
|---|---|---|---|---|---|
| Amil | Prata QC Copart TP (nacional) | enfermaria | parcial, só em terapias | 1 até 18 + 2 de 34–38 | **R$ 1.445,99/mês**; **R$ 723,00** na 1ª e na 2ª (50%) |
| Bradesco Saúde | Efetivo Plus | enfermaria | sem | sócios e diretores | **R$ 2.362,01/mês** (parcela total) |
| SulAmérica | Direto Nacional | enfermaria | sem | 1 até 18 + 2 de 34–38 | **R$ 1.593,54/mês** (R$ 1.556,49 + IOF 2,38%); válida até 19/12/2026 |

## Versão 3 (pedido do cliente: mais destaque, hospitais melhores, mais criatividade)

- **Sempre em destaque:** logo abaixo do logo vêm "PLANOS DE SAÚDE", grande e em caixa alta sobre tarja colorida
  (refs 06 e 10), e o selo forte "EXCLUSIVO PARA CNPJ/MEI" com ícone, seguido de "a partir de 3 vidas". A regra está
  no CLAUDE.md.
- **Hospitais pedidos (São Camilo e São Luiz), só onde estão na rede em enfermaria:**
  - **Bradesco Efetivo Plus:** São Camilo Ipiranga e Santana, BP e Samaritano. Fonte: material oficial da Bradesco
    Saúde, set/2026
    ([PDF](https://www.bradescoseguros.com.br/wcm/connect/cfe02e3b-0d71-4f18-b8c3-c40a7d30d58a/260824_BRASAU_EfetivoPlus_Nacional_SP-DF-RS-PR-BA_AF.pdf?MOD=AJPERES&CONVERT_TO=url&CACHEID=ROOTWORKSPACE-cfe02e3b-0d71-4f18-b8c3-c40a7d30d58a-q0R5H.S)).
    O São Luiz desse plano fica fora da capital (Guarulhos e São Bernardo), por isso não entra.
  - **SulAmérica Direto Nacional:** São Luiz (Rede D'Or) e BP. Fonte de corretor, a
    [Capitalis](https://conveniosmedicossp.com.br/rede-credenciada-sulamerica-saude/) (out/2026). O São Camilo não
    aparece nesse plano. **Confirmar no buscador da SulAmérica.**
  - **Amil Prata:** nenhum hospital citado. Numa tabela de corretor, o São Camilo Pompéia e Ipiranga só entram a partir
    do Amil Ouro; o Santana e o São Luiz não têm confirmação no Prata.
  - Nenhum dos dois tem foto livre para anúncio: o Adobe Stock não tem, e no Wikimedia só há o logo da Rede D'Or. Por
    isso aparecem como cartões de nome, como as filas de hospitais das referências 09, 10 e 13.
- **Mais movimento:**
  - pessoa saindo da moldura (médico do Bradesco, médica da Amil);
  - forma curva sobre a foto dos sócios (ref 07);
  - onda e linhas (ref 09);
  - caixa "Acesso aos hospitais" (ref 13);
  - moldura fina dourada e tabela por idade (ref 01);
  - cards modulares (ref 02).

## Peças

| Peça | Base | O que tem |
|---|---|---|
| `a1-amil-cards` | ref 02 | Card de foto (equipe no corredor) com selo "Coparticipação só em terapias", card do preço (R$ 723,00 na 1ª e na 2ª), card amarelo "50% OFF" |
| `a2-amil-tabela` | ref 01 | Equipe no saguão com moldura dourada, "PLANOS DE SAÚDE" em tarja dourada, caixa do preço, selo 50% OFF e tabela das 10 faixas |
| `a3-amil-medica` | refs 05/08 | "50% OFF" gigante, médica saindo do círculo amarelo, preço da 1ª e da 2ª |
| `b1-bradesco-rede` | refs 09/10 | Cartão grande do São Camilo (Ipiranga · Santana), fotos da BP e do Samaritano, cartão branco com o preço |
| `b2-bradesco-medico` | ref 08 | Médico saindo da moldura vermelha, lista São Camilo / BP / Samaritano, preço |
| `b3-bradesco-socios` | ref 07 | Sócios em tela cheia com forma curva vinho: "para sócios e diretores", preço, "São Camilo │ BP │ Samaritano" |
| `s1-sula-bp` | ref 10 | "PLANOS DE SAÚDE" em tarja laranja, fachada da BP, cartão de preço, fila "São Luiz │ BP" |
| `s2-sula-ondas` | ref 09 | Equipe com borda em onda, cartões São Luiz e BP, cartão azul-marinho com o preço |
| `s3-sula-acesso` | ref 13 | Logo em cartão branco, pílula "São Paulo (SP)", caixa laranja "Acesso aos hospitais", equipe em moldura laranja |

**Fotos (todas reais, nenhuma gerada por IA):**
- **Adobe Stock (licença gratuita):**
  - 335918554: médico, recortado no Adobe;
  - 490032919: médica, recortada;
  - 221706617: sócios;
  - 561309706: equipe;
  - 305689652: saguão;
  - 1193644379: corredor.
- **Wikimedia Commons, com crédito sobre a foto:**
  - [Samaritano](https://commons.wikimedia.org/wiki/File:1-FachadanovocomplexoHospitalar.jpg) (Hsama, CC BY 3.0);
  - [BP](https://commons.wikimedia.org/wiki/File:Hospital_Benefic%C3%AAncia_Portuguesa_-_panoramio_-_Alexandre_Possi.jpg) (Alexandre Possi, CC BY 3.0).
- **Recortes:** saem de `ferramentas/cortar-v2.py` e `ferramentas/cortar-v3.py`.

## Observações obrigatórias (CLAUDE.md) que entraram

Texto exato. Abaixo de cada preço: **"Valores sujeitos à faixa etária e região."** No rodapé, depois do perfil da
cotação (marcado com \*):

- **Em todas:** "Valores referenciais sujeitos às regras da operadora.", "Os valores podem variar conforme perfil do
  beneficiário.", "Cobertura e rede sujeitas à modalidade contratada.", "Consulte condições e elegibilidade.",
  "Condições sujeitas à análise comercial.", "Imagem meramente ilustrativa."
- **Amil** (desconto de novembro): "Oferta sujeita à disponibilidade comercial."
- **Bradesco e SulAmérica** (citam hospitais): "A rede credenciada pode variar conforme plano contratado.", "Consulte a
  disponibilidade da rede hospitalar."
- **Registro ANS:** Amil 326305, Bradesco Saúde S.A. 005711, Sul América Companhia de Seguro Saúde 006246.

`node ferramentas/conferir.mjs` passa nas 9 peças: texto entre y=325 e y=1497, fonte mínima de 19 px e contraste aprovado.

## Conferir antes de subir

- **SulAmérica:** confirmar BP e São Luiz no Direto Nacional em enfermaria, e qual unidade do São Luiz.
- **Bradesco:** a cotação não traz as idades das 3 vidas. O rodapé diz "sócios e diretores, conforme cotação de
  04/11/2026".
- **Amil:** o desconto de 50% na 1ª e na 2ª mensalidade está como "para contratos de novembro/2026". Confirmar com a
  corretora.
- **"Telemedicina 24h" (B3):** vem do material oficial do Efetivo Plus (Saúde Digital, 24 horas pelo app).

## Versões editáveis

O Figma (https://www.figma.com/design/7RLZ8ig3nppPELzo6mbAAR) e o Adobe Express ainda têm a **versão 1**. A versão 3
ainda não foi montada neles.

## Gerar de novo

```bash
cd criativos/cotacoes-3-vidas-sp
python3 -I ferramentas/cortar-v2.py   # recortes das fotos no tamanho 2x de cada espaço
python3 -I ferramentas/cortar-v3.py   # recortes novos da v3
node render.mjs                       # as 9 peças em 2x
node ferramentas/conferir.mjs         # zona segura (Story + recorte do Feed), fonte mínima e contraste
```
