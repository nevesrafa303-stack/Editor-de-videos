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
