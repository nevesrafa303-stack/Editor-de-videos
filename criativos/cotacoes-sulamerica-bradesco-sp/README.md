# Cotações de 3 vidas em SP — SulAmérica Direto Nacional e Bradesco Efetivo Plus (estáticos)

Seis criativos estáticos para o formulário do Meta, três por cotação. Esta é a **versão 2** (08/11/2026), refeita a
pedido do cliente:

- **Modelo:** cópia fiel das referências 10, 14 e 16 de `criativos/_referencias/planos-de-saude/`. As medidas foram
  tiradas das referências (640 px × 1,6875) e as cores, amostradas delas.
- **Pouca informação:** a nota do \* curta e só as observações essenciais.
- **Cores do logo de cada operadora:**
  - SulAmérica: azul-marinho #0b2354 + laranja #df5e23;
  - Bradesco Saúde: vermelho #cc092f + branco.
  - Saiu o preto e dourado.
- **Foto real do hospital em destaque.**
- **Um formato só:** Story 1080×1920 (PNG 2x em `final/`). Todo texto fica no quadro central y 420–1500, então o mesmo
  arquivo serve no Feed:
  - **recorte 1:1:** exatamente esse quadro, ver `final/_como-fica-no-feed-1x1.jpg`;
  - **recorte 4:5:** y 285–1635, também cabe;
  - **zona livre do Story:** y 230–1536.
  - Fora do quadro só há imagem e cor: a foto do hospital sobe até o alto da tela e a cor da faixa de CTA desce até o pé.

A regra está registrada no `CLAUDE.md` da raiz ("Criativos estáticos").

## As cotações (enviadas pelo cliente em 04/11/2026)

| Operadora | Plano | Acomodação | Coparticipação | 3 vidas | Valor |
|---|---|---|---|---|---|
| SulAmérica | Direto Nacional (Nacional SP, CAP1) | enfermaria | sem | 2 de 34–38 + 1 de 0–18 | **R$ 1.593,54/mês** (R$ 1.556,49 + IOF 2,38%); válida até 19/12/2026 |
| Bradesco Saúde | Efetivo Plus | enfermaria | sem | sócios e diretores | **R$ 2.362,01/mês** (R$ 2.307,10 + IOF 2,38%) |

## Rede conferida antes de criar (capital de SP, enfermaria)

### Bradesco Efetivo Plus

**Fonte:** material oficial da Bradesco Saúde, versão agosto/2026. Cópia em `fontes/`, e a página da rede de SP em
`fontes/bradesco-efetivo-plus-rede-sp.png`.

| Situação | Hospitais |
|---|---|
| **Com enfermaria, citados nas peças** | Samaritano · BP · InCor · São Camilo Ipiranga · São Camilo Santana |
| **Só em quarto: ficam fora** | A.C. Camargo · HCor · Santa Catarina · Santa Joana · São Camilo Pompéia · São Luiz Alphaville |

Benefícios citados, do mesmo material: cobertura nacional e telemedicina 24 horas (Saúde Digital).

### SulAmérica Direto Nacional

**Fonte:** guia de corretora baseado na rede de referência SulAmérica SP do Painel do Corretor (23/10/2026); outra
corretora confirma BP e Rede D'Or São Luiz. Os folhetos oficiais da SulAmérica não listam a rede por plano.

| Situação | Hospitais |
|---|---|
| **Citados nas peças** | BP (internação e pronto-socorro) · São Luiz Jabaquara (internação) |
| **Fora do Direto Nacional** | São Luiz Itaim e Vila Nova Star (só a partir do Especial RC) |

**Confirmar no Painel do Corretor antes de subir.**

## Peças (`final/*-story.png`)

| Peça | Referência | Foto real | O que tem |
|---|---|---|---|
| `s1-sula-hospital` | 10 | BP com o logo na fachada, do alto da tela até o meio | "SUA EMPRESA PROTEGIDA COM SULAMÉRICA", tarja laranja "PLANOS DE SAÚDE", texto à esquerda, cartão com aba "EXCLUSIVO PARA CNPJ/MEI" e "3 VIDAS por apenas R$ 1.593,54*", hospitais "BP │ São Luiz Jabaquara" em letreiro branco, faixa laranja com a aba do logo |
| `s2-sula-cnpj` | 14 | BP em cartão grande | arco laranja com o logo, "PLANOS DE SAÚDE COM CNPJ/MEI", "3 VIDAS POR APENAS", "1.593" gigante em laranja, tarja "VALOR EXCLUSIVO PARA CNPJ/MEI", caixa laranja de benefícios, faixa azul |
| `s3-sula-premium` | 16 em azul e laranja | BP no alto | aba branca com o logo, "Seu plano de saúde com a BP na rede", cartão azul "3 VIDAS A PARTIR DE R$ 1.593,54*" + caixa laranja "SEM COPARTICIPAÇÃO", benefícios em barras |
| `b1-brad-hospital` | 10 em vermelho | Samaritano no alto | "PARA SÓCIOS E DIRETORES DA SUA EMPRESA", tarja branca "PLANOS DE SAÚDE", cartão com o preço R$ 2.362,01*, "Samaritano │ BP │ InCor │ São Camilo", faixa vermelha com a aba do logo |
| `b2-brad-cnpj` | 14 em vermelho | BP em cartão grande | arco vermelho com o logo, "2.362" gigante em vermelho, caixa vermelha (sem coparticipação, cobertura nacional, telemedicina 24 horas) |
| `b3-brad-premium` | 16 em vermelho | Samaritano no alto | "Seu plano de saúde com o Samaritano na rede", cartão + caixa vermelha "SEM COPARTICIPAÇÃO", "Também na rede, em enfermaria: BP │ InCor │ São Camilo Ipiranga │ São Camilo Santana" |

**Fotos:** todas reais, com o crédito pequeno no canto, como pedem as licenças.
- **BP:** Cecilia Melozi (CC BY-SA 4.0) e Alexandre Possi (CC BY 3.0).
- **Samaritano:** Hsama (CC BY 3.0).
- Todas do Wikimedia Commons.

## Observações (CLAUDE.md, texto exato)

- **Abaixo do preço:** "Valores sujeitos à faixa etária e região."
- **Nota no pé** (19 px), com o \* e três observações:
  - **SulAmérica:** "\*Valor referente a 3 vidas (2 de 34 a 38 anos e 1 de 0 a 18 anos), Direto Nacional, enfermaria."
  - **Bradesco:** "\*Valor referente a 3 vidas (sócios e diretores), Efetivo Plus, enfermaria."
  - **Nas duas:** "Consulte condições e elegibilidade. A rede credenciada pode variar conforme plano contratado. Imagem
    meramente ilustrativa."

`node ferramentas/conferir.mjs` passa nas 6 peças:
- todo texto entre y 420 e 1500;
- fonte mínima de 19 px;
- contraste WCAG contra o fundo real.

## Texto do anúncio no Meta (sugestão)

- **SulAmérica:** "Plano de saúde SulAmérica para a sua empresa: 3 vidas por R$ 1.593,54/mês, sem coparticipação, com
  a BP e o São Luiz Jabaquara na rede. Exclusivo para CNPJ/MEI, a partir de 3 vidas, capital de São Paulo."
  - **Título:** "3 vidas por R$ 1.593,54" · **Botão:** Obter cotação
- **Bradesco:** "Bradesco Saúde Efetivo Plus para sócios e diretores: 3 vidas por R$ 2.362,01/mês, sem coparticipação,
  com Samaritano, BP, InCor e São Camilo na rede. Exclusivo para CNPJ/MEI, a partir de 3 vidas, capital de São Paulo."
  - **Título:** "Samaritano no seu plano, pelo CNPJ" · **Botão:** Obter cotação

## Gerar de novo

```bash
cd criativos/cotacoes-sulamerica-bradesco-sp
node render.mjs                 # 6 peças em Story 2x
node ferramentas/conferir.mjs   # quadro central, fonte mínima e contraste
```
