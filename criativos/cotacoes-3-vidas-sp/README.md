# Cotações de 3 vidas em São Paulo (SP) — Amil, Bradesco Saúde e SulAmérica

Nove criativos estáticos, três para cada cotação enviada em 04/11/2026. Todos em **um formato só: Story
1080×1920**, com todo o texto entre **y=290 e y=1536**. Essa faixa fica livre das barras do Story e cabe inteira
no recorte 4:5 que o Meta faz para o Feed (y 285–1635). PNG em 2x (2160×3840) em `final/`. A visão geral
está em `final/_visao-geral.jpg`.

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
daria a entender outra acomodação. Nenhum hospital é citado pelo nome: a rede de cada plano precisa ser confirmada
antes.

Logos: Amil (`assets/marca/amil.svg`, o mesmo das outras campanhas), Bradesco Saúde (SVG oficial do site da
Bradesco Seguros) e SulAmérica (recortado da imagem oficial do portal da SulAmérica; versão para fundo escuro com
o texto em branco).

## Observações obrigatórias (CLAUDE.md) que entraram

Texto exato. Abaixo de cada preço: **"Valores sujeitos à faixa etária e região."** No rodapé, depois do perfil da
cotação (marcado com \*):

- Em todas: "Valores referenciais sujeitos às regras da operadora.", "Os valores podem variar conforme perfil do
  beneficiário.", "Cobertura e rede sujeitas à modalidade contratada.", "Consulte condições e elegibilidade.",
  "Condições sujeitas à análise comercial."
- Amil (desconto de novembro): "Oferta sujeita à disponibilidade comercial."
- Peças com foto de hospital (a2, b1, s2): "A rede credenciada pode variar conforme plano contratado.", "Consulte a
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

## Gerar de novo

```bash
cd criativos/cotacoes-3-vidas-sp
node render.mjs                     # as 9 peças em 2x
node ferramentas/conferir.mjs       # zona segura (Story + recorte do Feed), fonte mínima e contraste
```
