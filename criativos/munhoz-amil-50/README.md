# Munhoz Corretora — Amil 50% (outubro/2026)

Variações estáticas do criativo "ADS01 - Amil 50% primeira e segunda parcela STORY"
(referência em `assets/munhoz/ref/`). Oferta: plano Amil para CNPJ **a partir de 2 vidas**,
**50% de desconto na 1ª e na 2ª fatura**, para contratações em outubro.

Cada peça sai em **Story 1080×1920** e **Feed 4:5 1080×1350**, em `final/`.
Na Story, nada importante fica acima de y=220 nem abaixo de y=1600.

| Peça | Ângulo | Título |
|---|---|---|
| `ADS01 … STORY - 2 vidas.png` | Original | PNG original com "A partir de 2 vidas" |
| `ADS01 … FEED - 2 vidas.png` | Original | Mesma peça remontada em 4:5 (`pecas/ads01-original.html`) |
| `v1-metade` | Oferta tipográfica | 50% de desconto na 1ª e na 2ª fatura |
| `v2-voce-mais-1` | 2 vidas = você + 1 (foto) | Você +1. Já dá para ter Amil pelo seu CNPJ. |
| `v3-fatura` | A fatura pela metade (fundo claro) | Suas 2 primeiras faturas *pela metade.* |
| `v4-outubro` | Prazo (calendário) | Contrate até 31 de outubro. |
| `v5-seu-cnpj` | Dona do negócio (foto) | Seu CNPJ vale um plano Amil. |
| `v6-pessoa-fisica` | Pergunta (foto) | Ainda paga plano como pessoa física? |

`final/_visao-geral.jpg` mostra as 12 peças lado a lado.

## Linha empresários (e1–e6)

Mesma copy da peça original, com linguagem de private banking para público de maior valor:
azul quase preto `#0a0f1f`, marfim `#f3eee4`, Instrument Serif nos números e Instrument Sans no texto
(`pecas/premium.css`). Visão geral em `final/_visao-geral-empresarios.jpg`.

| Peça | Conceito |
|---|---|
| `e1-retrato` | Retrato de empresário em fundo escuro (foto espelhada), 50% em serifa |
| `e2-executiva` | Executiva em moldura editorial, estilo revista |
| `e3-socios` | Dois sócios em reunião, fundo marfim |
| `e4-cinquenta` | Tipográfica, sem foto, com órbitas finas (eco dos anéis da peça original) |
| `e5-convite` | Cartão-convite marfim com moldura dupla e tipografia centralizada |
| `e6-hospital` | Arquitetura hospitalar em duotone azul |

Fotos Adobe Stock (licença gratuita, sem IA): 394364278, 1202072654, 539120828, 570162129.

## Linha atenção (a1–a6)

Objetos e situações do dia a dia como gancho, para parar a rolagem sem cara de anúncio gerado.
Fontes extras em `pecas/atencao.css`. Visão geral em `final/_visao-geral-atencao.jpg`.

| Peça | Gancho | Título |
|---|---|---|
| `a1-maca` | Foto real: maçã inteira e maçã cortada, com anotações à mão | Saúde inteira. Fatura pela metade. |
| `a2-fatura-cortada` | A palavra FATURA cortada ao meio com tesoura, fundo ciano | Sua 1ª e 2ª fatura pela metade. |
| `a3-post-it` | Post-it escrito à mão na tela do notebook (foto real, texto original apagado) | Lembrete de outubro. |
| `a4-conversa` | Conversa entre sócios | A mensagem que todo sócio precisa receber em outubro. |
| `a5-cupom` | Cupom de recortar, estilo varejo antigo | Recorte e economize. |
| `a6-classificados` | Página de classificados com o anúncio circulado à caneta | Plano de saúde p/ CNPJ — 50% off |

Fotos Adobe Stock (licença gratuita, sem IA): 401175887 (maçãs), 315425981 (post-it; o texto
original foi removido em `assets/fotos/postit-notebook-limpo.jpg`). Os anúncios vizinhos do
classificado são fictícios, sem telefone nem nome.

## Linha Figma no sistema visual da Amil (C1–C5)

Feita no Figma, editável: https://www.figma.com/design/UpR5IhAWqlVhUWCZNFi2lM
PNGs exportados do Figma em `final/figma/`, visão geral em `final/figma/_visao-geral-figma.jpg`.

Sistema visual tirado do site oficial da Amil (CSS de institucional.amil.com.br):
violeta `#461BFF`, violeta claro `#5C3CFF`, azul-noite `#0F0D59`, ciano `#00ADFF`, verde `#00D896`
(botões) e anéis concêntricos atrás de pessoas recortadas, como nos banners da própria Amil.
A fonte da Amil (Amil Typeface) é proprietária; no lugar dela usamos **Lexend**, a gratuita mais
parecida (82% de sobreposição de formas no teste). Se a Munhoz tiver o kit de marca da Amil, é só
trocar a fonte no Figma.

No arquivo: página **Base** com variáveis de cor e componentes (logo, botão de simulação com texto
editável, selo 50%); página **Criativos** com uma seção por conceito (Story e Feed lado a lado).

| Peça | Conceito | Título |
|---|---|---|
| `C1-dois-ja-e-empresa` | Dupla de sócios (2 vidas) | Dois já é empresa. E já é plano Amil. |
| `C2-familia` | Pai e filha (titular e dependente) | Sua empresa. Sua família. Um plano Amil. |
| `C3-50-em-camadas` | 50% gigante atrás da modelo | 50% de desconto na 1ª e na 2ª fatura. |
| `C4-metade` | Close de meio rosto (a foto é a metade) | Metade. É o que você paga na 1ª e na 2ª fatura. |
| `C5-empresario` | Empresário com selo | Empresário, a 1ª e a 2ª fatura saem pela metade. |

Fotos Adobe Stock (licença gratuita, sem IA): 204746182, 214903170, 873259401, 675869823, 510257064.
Recortes feitos no Photoshop (Adobe para criatividade); versões usadas no Figma em `assets/fotos/figma/`.

## Gerar de novo

```bash
node render.mjs        # todas
node render.mjs v3     # só uma
```

Usa o Playwright global e sobe um servidor local para as fontes e fotos.
O HTML de cada peça está em `pecas/`, com estilos compartilhados em `pecas/base.css`.

## Identidade

- Cores da peça original: tinta `#07055c`, azul elétrico `#2a1ff0`, ciano `#3fe0f9`.
- Tipografia: Gabarito (próxima da fonte da peça original) + Instrument Serif itálico em um destaque.
- Logo Amil vetorizado a partir da peça original (`assets/amil-logo.svg`).
- Fotos reais do Adobe Stock, licença gratuita, sem IA: 266668318 (casal), 545100019 (sócios),
  496943330 (dona do mercado).

## Conferir antes de subir

- Número ANS da Amil no rodapé (`326305`).
- Regras de elegibilidade com 2 vidas (sócio, cônjuge, funcionário) no PME Amil.
