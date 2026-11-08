# Cotações de 3 vidas em SP — SulAmérica Direto Nacional e Bradesco Efetivo Plus (estáticos)

Seis criativos estáticos para o formulário do Meta, três por cotação. Seguem o estilo aprovado pelo cliente em
08/11/2026: referências 10, 14 e 16 de `criativos/_referencias/planos-de-saude/`, o mesmo sistema de
`criativos/hospitais-referencia-sp/`. Cada peça sai em **Feed 1:1** (2160×2160) e em **Story** (2160×3840), em PNG 2x
na pasta `final/`. A visão geral está em `_visao-geral-feed.jpg` e `_visao-geral-story.jpg`.

## As cotações (enviadas pelo cliente em 04/11/2026)

| Operadora | Plano | Acomodação | Coparticipação | 3 vidas | Valor |
|---|---|---|---|---|---|
| SulAmérica | Direto Nacional (Nacional SP, CAP1) | enfermaria | sem | 1 de 0–18 + 2 de 34–38 | **R$ 1.593,54/mês** (R$ 1.556,49 + IOF 2,38% R$ 37,05); válida até 19/12/2026 |
| Bradesco Saúde | Efetivo Plus | enfermaria | sem | sócios e diretores | **R$ 2.362,01/mês** (R$ 2.307,10 + IOF 2,38%) |

## Rede conferida antes de criar (só hospitais da capital, em enfermaria)

### Bradesco Efetivo Plus

**Fonte:** material oficial da Bradesco Saúde, versão agosto/2026. Cópia em
`fontes/bradesco-efetivo-plus-material-oficial-ago2026.pdf`; a página da rede de SP está em
`fontes/bradesco-efetivo-plus-rede-sp.png`. A tabela "Principais hospitais do plano" marca QTO (quarto) e ENF
(enfermaria).

| Situação | Hospitais |
|---|---|
| **Com enfermaria, citados nas peças** | Hospital Samaritano · BP – Beneficência Portuguesa · InCor · São Camilo Ipiranga · São Camilo Santana |
| Com enfermaria, não citados | Edmundo Vasconcelos e Villa Lobos (fora da lista de primeira linha do CLAUDE.md); São Luiz Guarulhos, São Luiz São Bernardo, BP São Caetano, Hospital Brasil e Hospital Vitória (fora da capital ou fora da lista) |
| **Só em quarto: ficam fora** | A.C. Camargo · HCor · São Camilo Pompéia · Santa Catarina · Santa Joana · São Luiz Alphaville |

Benefícios citados, do mesmo material:
- **Cobertura nacional:** "possui cobertura em todo o Brasil".
- **Telemedicina 24 horas:** "Saúde Digital – consultas on-line com médicos 24 horas por dia, 7 dias por semana".

### SulAmérica Direto Nacional

**Fonte:** guia de corretora baseado na rede de referência SulAmérica SP (PME), consultada no Painel do Corretor em
23/10/2026. Outra página de corretora confirma "Rede D'Or São Luiz" e "Hospital Beneficência Portuguesa" no Direto
Nacional SP. Os folhetos oficiais da SulAmérica a que tive acesso não listam a rede por plano.

| Situação | Hospitais |
|---|---|
| **Citados nas peças** | BP – Beneficência Portuguesa (internação e pronto-socorro) · São Luiz Jabaquara (internação) |
| Na rede, não citado | Sepaco (internação, maternidade e pronto-socorro): fora da lista de primeira linha do CLAUDE.md |
| **Fora do Direto Nacional** | São Luiz Itaim e Vila Nova Star (só a partir do Especial RC) · Einstein e Sírio-Libanês (Executivo e Prestige) |

Por isso as peças da SulAmérica não usam as fotos do São Luiz Itaim nem do Vila Nova Star.
**Confirmar no Painel do Corretor antes de subir.**

## Peças

| Peça | Referência | Foto real (hospital na rede da cotação) | Destaques |
|---|---|---|---|
| `s1-sula-hospital` | 10 | BP com o logo na fachada | tarja laranja "PLANOS DE SAÚDE", "sem coparticipação", "BP" e "São Luiz" em laranja, cartão "3 VIDAS por apenas R$ 1.593,54*" com aba "EXCLUSIVO PARA CNPJ/MEI", fila BP │ São Luiz Jabaquara │ Enfermaria, logo na aba da faixa |
| `s2-sula-cnpj` | 14 | BP em cartão | arco com o logo, "PLANOS DE SAÚDE / COM CNPJ/MEI", preço gigante em laranja, "VALOR EXCLUSIVO PARA CNPJ/MEI", caixa de benefícios |
| `s3-sula-premium` | 16 | BP no topo | "Seu plano de saúde com a BP na rede", "3 VIDAS A PARTIR DE R$ 1.593,54*" + caixa dourada "SEM COPARTICIPAÇÃO", benefícios em barras |
| `b1-brad-hospital` | 10 (cores Bradesco) | Samaritano | "Para sócios e diretores", tarja vermelha "PLANOS DE SAÚDE", cartão "3 VIDAS por apenas R$ 2.362,01*", fila Samaritano │ BP │ InCor │ São Camilo |
| `b2-brad-cnpj` | 14 (cores Bradesco) | BP em cartão | arco vermelho com o logo, preço gigante em vermelho, caixa "Benefícios do plano" (sem coparticipação, enfermaria, cobertura nacional, telemedicina 24 horas) |
| `b3-brad-premium` | 16 | Samaritano no topo | "Seu plano de saúde com o Samaritano na rede", preço + "SEM COPARTICIPAÇÃO", "Também na rede, em enfermaria: BP │ InCor │ São Camilo Ipiranga │ São Camilo Santana" |

**Fotos**, todas reais e com o crédito sobre a foto, como pedem as licenças:
- **BP:** Cecilia Melozi (CC BY-SA 4.0) e Alexandre Possi (CC BY 3.0), Wikimedia Commons.
- **Samaritano:** Hsama (CC BY 3.0), Wikimedia Commons.
- Não há foto do InCor nem do São Camilo; eles entram só pelo nome.

## Observações obrigatórias (CLAUDE.md, texto exato, só na tela)

- **Abaixo de cada preço:** "Valores sujeitos à faixa etária e região."
- **Texto legal, logo acima da faixa** (16 px no Feed, 19 px no Story), nesta ordem:
  - dados da cotação (marcados com \*);
  - fonte da rede;
  - Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. ·
    Cobertura e rede sujeitas à modalidade contratada. · Consulte condições e elegibilidade. · Condições sujeitas à
    análise comercial. · A rede credenciada pode variar conforme plano contratado. · Consulte a disponibilidade da rede
    hospitalar. · Imagem meramente ilustrativa.;
  - registro ANS: Sul América Companhia de Seguro Saúde 006246 ou Bradesco Saúde S.A. 005711.

`node ferramentas/conferir.mjs` passa nas 12 imagens:
- texto nas zonas seguras (Story entre y=290 e y=1536);
- fonte mínima de 16 px no Feed e 19 px no Story;
- contraste WCAG contra o fundo real.

## Texto do anúncio no Meta (sugestão)

- **SulAmérica:**
  - **Texto principal:** "Plano de saúde SulAmérica para a sua empresa: 3 vidas por R$ 1.593,54/mês, sem
    coparticipação, com a BP e o São Luiz Jabaquara na rede. Exclusivo para CNPJ/MEI, a partir de 3 vidas, capital
    de São Paulo."
  - **Título:** "3 vidas por R$ 1.593,54" · **Botão:** Obter cotação
- **Bradesco:**
  - **Texto principal:** "Bradesco Saúde Efetivo Plus para sócios e diretores: 3 vidas por R$ 2.362,01/mês, sem
    coparticipação, com Samaritano, BP, InCor e São Camilo na rede em enfermaria. Exclusivo para CNPJ/MEI, a partir de
    3 vidas, capital de São Paulo."
  - **Título:** "Samaritano no seu plano, pelo CNPJ" · **Botão:** Obter cotação
- **Nos dois, no texto:** Valores sujeitos à faixa etária e região. Consulte a disponibilidade da rede hospitalar.
  Consulte condições e elegibilidade.

## Gerar de novo

```bash
cd criativos/cotacoes-sulamerica-bradesco-sp
node render.mjs                 # 6 peças em Feed 1:1 e Story, em 2x
node ferramentas/conferir.mjs   # zonas seguras, fonte mínima e contraste
```
