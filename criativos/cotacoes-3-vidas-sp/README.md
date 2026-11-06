# Cotações de 3 vidas em São Paulo (SP) — Amil, Bradesco Saúde e SulAmérica

Quinze criativos estáticos para as cotações enviadas em 04/11/2026:
- três por cotação na primeira leva (a1–s3);
- mais seis com **hospital de referência** citado pelo nome e foto real da fachada (b4–s6, seção própria abaixo).
  As três da Amil estão suspensas até confirmar a rede.

Todos em **um formato só: Story
1080×1920**, com todo o texto entre **y=290 e y=1536**. Essa faixa fica livre das barras do Story e cabe inteira
no recorte 4:5 que o Meta faz para o Feed (y 285–1635). PNG em 2x (2160×3840) em `final/`. A visão geral
está em `final/_visao-geral.jpg` (a1–s3) e `final/_visao-geral-hospitais.jpg` (b4–s6).

## As cotações

| Operadora | Plano | Acomodação | Coparticipação | 3 vidas | Valor |
|---|---|---|---|---|---|
| Amil | Prata QC Copart TP (nacional) | enfermaria | parcial, só em terapias | 1 até 18 + 2 de 34–38 | **R$ 1.445,99/mês**; **R$ 723,00** na 1ª e na 2ª (50%) |
| Bradesco Saúde | Efetivo Plus | enfermaria | sem | sócios e diretores | **R$ 2.362,01/mês** (parcela total) |
| SulAmérica | Direto Nacional | enfermaria | sem | 1 até 18 + 2 de 34–38 | **R$ 1.593,54/mês** (R$ 1.556,49 + IOF 2,38%); válida até 19/12/2026 |

## Peças

| Peça | Gancho | Recurso visual |
|---|---|---|
| `a1-amil-recibo` | "Plano Amil para 3 vidas com a 1ª e a 2ª mensalidade pela metade" | Recibo de papel com a conta da cotação e o total circulado à mão |
| `a2-amil-hospital` | "Hospital, consulta e exame com a Amil, no Brasil todo." | Foto real de equipe médica no saguão de um hospital |
| `a3-amil-tabela` | "Quanto custa a Amil na sua idade?" | Tabela de valor por vida das 10 faixas, com marca-texto nas faixas do exemplo |
| `b1-bradesco-hospital` | "Plano de saúde para 3 vidas, sem coparticipação" | Foto real de médicos numa passarela de vidro, emoldurada |
| `b2-bradesco-extrato` | "Usou o plano? Não paga a mais por isso." | Extrato de coparticipação zerado (consulta, exames, pronto-socorro, internação) |
| `b3-bradesco-paulista` | "Sua empresa é de São Paulo?" | Avenida Paulista de dia, cartão para sócios e diretores |
| `s1-sula-preco` | "3 vidas, plano nacional, sem coparticipação." | Preço gigante e carimbo "cotação válida até 19/12/2026" |
| `s2-sula-hospital` | "Plano SulAmérica nacional para a sua empresa em SP" | Foto real de equipe médica num hospital com vista para a cidade |
| `s3-sula-conta` | "Quanto custa a SulAmérica para 3 vidas em SP?" | Avenida Paulista à noite e a conta aberta: vidas, IOF e total |

Fotos reais do **Adobe Stock** (licença gratuita, sem IA): 305689652 (equipe no saguão), 135255089 (passarela de
vidro), 1193644379 (equipe no corredor), 556739692 (Paulista de dia), 132782917 (Paulista à noite). As fotos de
hospital mostram saguão e corredor, não quarto, porque os três planos são de **enfermaria**: uma suíte privativa
daria a entender outra acomodação. Nas peças a1–s3 nenhum hospital é citado pelo nome. Os hospitais aparecem
nas variações b4–s6.

Logos: Amil (`assets/marca/amil.svg`, o mesmo das outras campanhas), Bradesco Saúde (SVG oficial do site da
Bradesco Seguros) e SulAmérica (recortado da imagem oficial do portal da SulAmérica; versão para fundo escuro com
o texto em branco).

## Variações com hospital de referência (b4–s6)

Regra do cliente (06/11/2026, no CLAUDE.md): **só os melhores hospitais de São Paulo, e só se estiverem na rede do plano
da cotação, na acomodação da cotação**.

- Os três do topo do ranking Newsweek 2026 (Einstein, Sírio-Libanês e Alemão Oswaldo Cruz) não estão na rede destes
  planos de enfermaria. Para anunciá-los, é preciso a cotação de um plano que os tenha.
- Por isso as peças usam os hospitais de primeira linha que estão na rede de cada cotação.

| Peça | Gancho | Hospital e foto |
|---|---|---|
| `b4-bradesco-samaritano` | "Hospital Samaritano na rede, em enfermaria" | Fachada do Samaritano (Higienópolis) com a placa do hospital à vista |
| `b5-bradesco-bp` | "Precisou internar? A BP está na rede do seu plano." | Fachada da BP – Beneficência Portuguesa (Bela Vista) |
| `b6-bradesco-rede` | "BP, Samaritano e InCor na rede, em enfermaria" | BP e Samaritano em cartões, mais o InCor |
| `s4-sula-bp` | "A BP no seu plano, sem coparticipação" | Fachada da BP vista do viaduto |
| `s5-sula-rede` | "Hospitais de referência na rede, em enfermaria" | Cartão da BP e lista: BP e São Luiz (Rede D'Or) |
| `s6-sula-enquete` | "Qual desses hospitais você quer na rede da sua empresa?" (cara de enquete de Story) | BP (com miniatura da fachada) e São Luiz, os dois marcados "na rede" |

**Amil (peças `_a4`, `_a5` e `_a6` em `pecas/`, fora de `final/`): suspensas.**

- Elas citavam a rede própria da Amil (Paulistano, Metropolitano, Vitória e Luz), que não está entre os melhores
  hospitais de SP.
- Na página oficial "Nossos planos" da Amil, a linha Prata aparece com Samaritano Paulista e Hospital Santa Catarina.
  Mas a página não deixa claro se isso vale para o Prata QC Copart TP em enfermaria.
- Depois de confirmar esses hospitais na cotação, as três peças são refeitas com eles. O `_` no nome deixa as peças
  fora do render.

**De onde vem a rede de cada plano:**

- **Bradesco Saúde Efetivo Plus: fonte oficial.** É o material da Bradesco Saúde "Efetivo Plus · cobertura
  nacional", de setembro de 2026, com quarto e enfermaria marcados por hospital
  ([PDF](https://www.bradescoseguros.com.br/wcm/connect/cfe02e3b-0d71-4f18-b8c3-c40a7d30d58a/260824_BRASAU_EfetivoPlus_Nacional_SP-DF-RS-PR-BA_AF.pdf?MOD=AJPERES&CONVERT_TO=url&CACHEID=ROOTWORKSPACE-cfe02e3b-0d71-4f18-b8c3-c40a7d30d58a-q0R5H.S)).
  - Os hospitais de primeira linha com **enfermaria** marcada na capital são BP – Beneficência Portuguesa,
    Hospital Samaritano e InCor.
  - HCor, Santa Catarina e Santa Joana estão na rede, mas só com quarto. Por isso não entram nestas peças de
    enfermaria.
- **SulAmérica Direto Nacional: fonte de corretor.** Não achei lista oficial pública.
  - A página da [Capitalis](https://conveniosmedicossp.com.br/rede-credenciada-sulamerica-saude/) foi revisada em
    18/10/2026 com a tabela da operadora de julho/2026.
  - Para o "Direto Nacional [E]" (enfermaria) ela lista São Luiz (Rede D'Or), BP – Beneficência Portuguesa, Leforte e
    Santa Paula. Ficaram só BP e São Luiz.
  - **Confirmar no buscador de rede da SulAmérica, com o produto da cotação, antes de subir.** Confirmar também qual
    unidade São Luiz atende o plano.

**Fotos (reais, Wikimedia Commons, licença que permite uso comercial; crédito do autor escrito sobre cada foto):**

| Hospital | Arquivo | Autor | Licença |
|---|---|---|---|
| BP – Beneficência Portuguesa | [Hospital Beneficência Portuguesa - panoramio - Alexandre Possi.jpg](https://commons.wikimedia.org/wiki/File:Hospital_Benefic%C3%AAncia_Portuguesa_-_panoramio_-_Alexandre_Possi.jpg) e [… (1).jpg](https://commons.wikimedia.org/wiki/File:Hospital_Benefic%C3%AAncia_Portuguesa_-_panoramio_-_Alexandre_Possi_(1).jpg) | Alexandre Possi | CC BY 3.0 |
| Hospital Samaritano | [1-FachadanovocomplexoHospitalar.jpg](https://commons.wikimedia.org/wiki/File:1-FachadanovocomplexoHospitalar.jpg) | Hsama | CC BY 3.0 |

- As fotos são miniaturas oficiais do Wikimedia, de 1280 a 1920 px. O Wikimedia bloqueou o download dos originais
  desta máquina por excesso de pedidos.
- Os espaços das peças foram dimensionados para a foto quase não ser ampliada: no máximo 1,27x, na faixa da BP da B5.
- Os recortes saem de `ferramentas/cortar-hospitais.py`.
- O São Luiz não tem foto livre no Wikimedia, então aparece só por escrito (S5 e S6).

As 6 peças passam no `conferir.mjs`: fonte mínima de 19 px, contraste aprovado e texto até y=1536.

## Destino: formulário com trava (CNPJ + 3 vidas ou mais)

Todos os anúncios levam para o formulário do Meta, que só aceita quem tem CNPJ (MEI incluído) e 3 vidas ou mais (regra do
CLAUDE.md). Por isso as 9 peças têm:

- **No topo, logo abaixo da marca:** a etiqueta "**EXCLUSIVO PARA CNPJ/MEI** · A PARTIR DE 3 VIDAS · SÃO PAULO (SP)". Na B3 o
  texto é "SÓCIOS E DIRETORES · A PARTIR DE 3 VIDAS". O "Exclusivo para CNPJ/MEI" vem num selo na cor de destaque da operadora:
  verde na Amil, branco no Bradesco, laranja na SulAmérica.
- **Botão:** "**Solicite sua cotação**", com ícone de formulário. Não há "fale com um consultor" nem balão de
  conversa. No Meta, use o botão "Obter cotação".

## Observações obrigatórias (CLAUDE.md) que entraram

Texto exato. Abaixo de cada preço: **"Valores sujeitos à faixa etária e região."** No rodapé, depois do perfil da
cotação (marcado com \*):

- Em todas: "Valores referenciais sujeitos às regras da operadora.", "Os valores podem variar conforme perfil do
  beneficiário.", "Cobertura e rede sujeitas à modalidade contratada.", "Consulte condições e elegibilidade.",
  "Condições sujeitas à análise comercial."
- Amil (desconto de novembro): "Oferta sujeita à disponibilidade comercial."
- Peças com foto de hospital (a2, b1, s2 e todas as b4–s6): "A rede credenciada pode variar conforme plano contratado.", "Consulte a
  disponibilidade da rede hospitalar.", "Imagem meramente ilustrativa."
- Peças com foto da cidade (b3, s3): "Imagem meramente ilustrativa."
- Registro ANS: Amil 326305, Bradesco Saúde S.A. 005711, Sul América Companhia de Seguro Saúde 006246.

`node ferramentas/conferir.mjs` passa nas 9 peças: texto entre y=414 e y=1536, fonte mínima de 19 px, pior
contraste de 4,27:1 (texto grande).

## Conferir antes de subir

- **Bradesco:** a cotação não traz as idades das 3 vidas. O rodapé diz "sócios e diretores, conforme cotação de
  04/11/2026". Se for o mesmo perfil das outras (1 até 18 + 2 de 34 a 38), dá para escrever isso no rodapé.
- **Amil:** o desconto de 50% na 1ª e na 2ª mensalidade está como "para contratos de novembro/2026", igual à
  campanha da Amil deste mês. Confirmar com a corretora.
- **Bradesco SPG de novembro** (50% na 2ª mensalidade nos cálculos de 03 a 30/11): a cotação mostra a 1ª e as
  demais parcelas iguais, então as peças não citam esse desconto.
- **Hospitais citados nas peças s4–s6:** confirmar BP e São Luiz no SulAmérica Direto Nacional em enfermaria. A rede do
  Bradesco Efetivo Plus (b4–b6) vem do material oficial. As peças da Amil com hospital estão suspensas.

## Versões editáveis

- **Figma:** https://www.figma.com/design/7RLZ8ig3nppPELzo6mbAAR. São 9 frames de 1080×1920 com textos vivos, fotos como
  preenchimento de imagem, logos em vetor e grupos girados (recibo, extrato, carimbo). Cada preço está em caixas
  separadas ("Preço · R$", "Preço · valor", "Preço · ,54*"), porque o Figma não sobe um trecho dentro do mesmo
  texto. Para trocar o valor, edite a caixa do meio e ajuste a posição dos centavos.
- **Adobe Express:** "Cotações 3 vidas SP · Stories · FINAL", com as 9 peças num documento só:
  https://new.express.adobe.com/id/urn:aaid:sc:VA6C2:6735f0bc-03ca-49cb-b34b-1f76674c120d.
  **Atenção:** esse documento é anterior à etiqueta "Exclusivo para CNPJ/MEI" e ao botão "Solicite sua cotação".
  O serviço da Adobe estava fora do ar (06/11/2026) na hora de importar a versão nova. Para reimportar, siga
  "Gerar de novo" abaixo.
  O Express não tem Courier Prime nem Gabarito, então ficou assim:
  - o texto de recibo/extrato/carimbo usa **Inconsolata**, a única monoespaçada do Express e só no peso Regular,
    com +0,1em de espaçamento para as colunas continuarem alinhadas;
  - os títulos em Gabarito (A1 e A3) usam **Figtree**.

  Os PNGs de `final/` continuam sendo a versão de referência.

## Gerar de novo

```bash
cd criativos/cotacoes-3-vidas-sp
node render.mjs                     # as 9 peças em 2x
node ferramentas/conferir.mjs       # zona segura (Story + recorte do Feed), fonte mínima e contraste

# versões editáveis
node ferramentas/extrair-camadas.mjs /tmp/camadas                     # camadas de cada peça (JSON) para Figma/Express
python3 -I ferramentas/gerar-express.py /tmp/camadas /tmp/express      # HTML com estilo inline e imagens embutidas
node ferramentas/preparar-express.mjs /tmp/express/express-story.html /tmp/express/express-final.html   # fontes do Express
```

Depois, `express-final.html` sobe para o Creative Cloud e é importado no Express. O Figma é montado a partir das
mesmas camadas, como na campanha `bradesco-spg-50-novembro`.
