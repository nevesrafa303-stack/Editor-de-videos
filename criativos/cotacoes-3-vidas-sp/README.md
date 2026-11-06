# Cotações de 3 vidas em São Paulo (SP) — Amil, Bradesco Saúde e SulAmérica

Nove criativos estáticos, três para cada cotação enviada em 04/11/2026. É a **versão 2**, refeita sobre as referências
do cliente (`criativos/_referencias/planos-de-saude/`) depois do retorno de que a primeira versão tinha "cara de IA".

- **Formato:** um só, Story 1080×1920, com todo o texto entre y=290 e y=1536. Essa faixa fica livre das barras do Story
  e cabe no recorte 4:5 que o Meta faz para o Feed (y 285–1635).
- **Arquivos:** PNG em 2x (2160×3840) em `final/`; visão geral em `final/_visao-geral.jpg`.
- **Versão anterior:** a versão 1 (recibo, carimbo, polaroide, enquete etc.) está em `final/_v1/` e
  `pecas/_v1-*.html`, fora do render.

## As cotações

| Operadora | Plano | Acomodação | Coparticipação | 3 vidas | Valor |
|---|---|---|---|---|---|
| Amil | Prata QC Copart TP (nacional) | enfermaria | parcial, só em terapias | 1 até 18 + 2 de 34–38 | **R$ 1.445,99/mês**; **R$ 723,00** na 1ª e na 2ª (50%) |
| Bradesco Saúde | Efetivo Plus | enfermaria | sem | sócios e diretores | **R$ 2.362,01/mês** (parcela total) |
| SulAmérica | Direto Nacional | enfermaria | sem | 1 até 18 + 2 de 34–38 | **R$ 1.593,54/mês** (R$ 1.556,49 + IOF 2,38%); válida até 19/12/2026 |

## O que mudou da versão 1 para a 2

Saíram os recursos que davam cara de IA: recibo, extrato, carimbo, polaroide, escrita à mão, enquete e anéis
decorativos. Entrou o que se repete nas 16 referências:

- foto real grande (fachada, médico, sócios, equipe);
- painel sólido na cor da operadora;
- bloco de preço direto ("3 VIDAS a partir de" + R$ grande com centavos sobrescritos) com selo de CNPJ;
- lista curta de benefícios com marcador quadrado;
- fila de hospitais;
- faixa cheia de CTA no rodapé.

## Peças

| Peça | Arquétipo (referência) | O que tem |
|---|---|---|
| `a1-amil-tabela` | Hospital no topo + tabela por idade (01) | Equipe médica no saguão, "Saúde e proteção para a sua empresa", caixa com R$ 723,00 na 1ª e na 2ª, tabela das 10 faixas |
| `a2-amil-cards` | Cards modulares (02) | Card de foto (equipe no corredor) com selo "Coparticipação só em terapias", card de preço "Planos de saúde para CNPJ/MEI", card "3 VIDAS" com marca-texto e pílulas com seta |
| `a3-amil-medica` | Pergunta + pessoa recortada (05, 08) | "Sua empresa ainda não tem plano de saúde?", médica recortada, cartão branco com o preço e o selo "50% OFF na 1ª e na 2ª" |
| `b1-bradesco-samaritano` | Hospital no topo + oferta (01, 10, 16) | Fachada do Hospital Samaritano, "Plano de Saúde Bradesco para a sua empresa", selo "Sem coparticipação · enfermaria", rede BP / Samaritano / InCor |
| `b2-bradesco-medico` | Pergunta + médico recortado (08) | "Você já conhece o Plano Bradesco Saúde para CNPJ?", cruzes em contorno, cartão vinho com o preço |
| `b3-bradesco-socios` | Painel branco + foto com borda curva (12) | Três sócios, "para sócios e diretores", "03 vidas a partir de", faixa CNPJ/MEI e "Diferenciais do plano" |
| `s1-sula-equipe` | Laranja com ondas + cartão azul (09) | Equipe com borda em onda, "Plano de saúde nacional para a sua empresa", cartão azul-marinho com preço, selo CNPJ/MEI e "Na rede: BP · São Luiz" |
| `s2-sula-preco` | Preço gigante (14) | Arco laranja com o logo, "PLANO DE SAÚDE COM CNPJ", R$ 1.593,54 gigante, cartão da BP e caixa de benefícios |
| `s3-sula-bp` | Fachada com degradê + faixa CNPJ (15) | Fachada da BP, cartão azul-marinho com texto e preço, faixa laranja "Condições exclusivas para CNPJ/MEI" |

**Em todas as peças:**
- etiqueta "Exclusivo para CNPJ/MEI · A partir de 3 vidas" logo abaixo do logo;
- faixa de CTA "Solicite sua cotação ↗" (formulário com trava);
- "Valores sujeitos à faixa etária e região." abaixo do preço.

**Fotos (todas reais, nenhuma gerada por IA):**
- **Adobe Stock (licença gratuita):**
  - 335918554: médico, recortado no Adobe Photoshop (remover fundo);
  - 490032919: médica, recortada;
  - 221706617: três sócios;
  - 561309706: equipe;
  - 305689652: equipe no saguão;
  - 1193644379: equipe no corredor.
- **Wikimedia Commons:**
  - [Hospital Samaritano](https://commons.wikimedia.org/wiki/File:1-FachadanovocomplexoHospitalar.jpg) (Hsama, CC BY 3.0);
  - [BP](https://commons.wikimedia.org/wiki/File:Hospital_Benefic%C3%AAncia_Portuguesa_-_panoramio_-_Alexandre_Possi_(1).jpg) (Alexandre Possi, CC BY 3.0).
  - O crédito do autor está escrito sobre a foto.
- **Por que não o banco do cliente:** o README de `_banco-de-imagens` avisa que várias fotos de lá parecem geradas por
  IA. Por isso as pessoas vêm do Adobe Stock.
- **Recortes:** saem de `ferramentas/cortar-v2.py`.

## Hospitais citados (regra do CLAUDE.md: só os melhores de SP, e só se estiverem na rede)

- **Bradesco Efetivo Plus: fonte oficial.** É o material da Bradesco Saúde de setembro de 2026
  ([PDF](https://www.bradescoseguros.com.br/wcm/connect/cfe02e3b-0d71-4f18-b8c3-c40a7d30d58a/260824_BRASAU_EfetivoPlus_Nacional_SP-DF-RS-PR-BA_AF.pdf?MOD=AJPERES&CONVERT_TO=url&CACHEID=ROOTWORKSPACE-cfe02e3b-0d71-4f18-b8c3-c40a7d30d58a-q0R5H.S)).
  As peças citam BP, Samaritano e InCor, que estão em enfermaria na capital. HCor e Santa Catarina só têm quarto.
- **SulAmérica Direto Nacional: fonte de corretor, falta confirmar.** A página da
  [Capitalis](https://conveniosmedicossp.com.br/rede-credenciada-sulamerica-saude/) foi revisada em 18/10/2026. As
  peças citam BP e São Luiz (Rede D'Or). **Confirmar no buscador da SulAmérica**, inclusive qual unidade São Luiz
  atende o plano.
- **Amil Prata: nenhum hospital citado.** Não há confirmação de hospital de primeira linha no Prata QC em enfermaria.
  As fotos da Amil mostram equipe médica sem identificar hospital.

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

`node ferramentas/conferir.mjs` passa nas 9 peças:
- texto entre y=414 e y=1497;
- fonte mínima de 19 px;
- contraste aprovado. O pior caso é 3,04:1, em texto grande, onde o mínimo é 3:1.

## Conferir antes de subir

- **SulAmérica:** confirmar BP e São Luiz no Direto Nacional em enfermaria.
- **Bradesco:** a cotação não traz as idades das 3 vidas. O rodapé diz "sócios e diretores, conforme cotação de
  04/11/2026".
- **Amil:** o desconto de 50% na 1ª e na 2ª mensalidade está como "para contratos de novembro/2026". Confirmar com a
  corretora.
- **"Telemedicina 24h" (B3):** vem do material oficial do Efetivo Plus (Saúde Digital, 24 horas pelo app).

## Versões editáveis

O Figma (https://www.figma.com/design/7RLZ8ig3nppPELzo6mbAAR) e o Adobe Express ainda têm a **versão 1**. A versão 2
ainda não foi montada neles.

## Gerar de novo

```bash
cd criativos/cotacoes-3-vidas-sp
python3 -I ferramentas/cortar-v2.py   # recortes das fotos no tamanho 2x de cada espaço
node render.mjs                       # as 9 peças em 2x
node ferramentas/conferir.mjs         # zona segura (Story + recorte do Feed), fonte mínima e contraste
```
