# Ana Claudia Clicks — Black Friday Gestante (novembro/2026)

Criativos estáticos da ação de Black Friday do estúdio Ana Claudia Clicks (cliente da LAKS),
no padrão visual da proposta comercial em PDF que a cliente envia ("BLACK20 Proposta Comercial
Gestante.pdf"). Cada peça usa **uma modelo diferente do PDF** e **uma página diferente do PDF como
modelo de layout**.

Cada peça sai em **Story 1080×1920** e **Feed 4:5 1080×1350**, em `final/`.
No Story, todo texto fica entre y=250 e y=1530 (fora das áreas cobertas pela interface).
`final/_visao-geral.jpg` mostra as 6 imagens lado a lado.

## Texto pedido pela cliente

> Condição Especial somente em Novembro
> ENSAIO GESTANTE* — 15% OFF
> COMBO GESTANTE + NEWBORN* — 20% OFF

Nota do asterisco usada nas peças (tirada da capa do PDF, "Condição especial para reservas
realizadas em novembro"): **"\*Válido para reservas realizadas em novembro de 2026."**
Confirmar com a cliente se o asterisco deve dizer outra coisa.

## Peças

| Peça | Modelo do PDF | Layout de referência no PDF |
|---|---|---|
| `c1-capa` | Gestante de vestido vermelho (capa) | Capa: "GESTANTE" no alto, etiqueta Black Friday pendurada, oferta sobre a saia e pílula vinho com "Condição Especial somente em Novembro" |
| `c2-holofote` | Gestante de blazer no círculo de luz | Página do holofote + caixas preto/claro da página "Escolha adicionais ao seu pacote" |
| `c3-convite` | Gestante de conjunto marrom | Última página ("Vamos fazer o seu ensaio?"): foto à esquerda, painel claro à direita, pílulas pretas dos pacotes e logo |

## De onde veio cada elemento

- **Fotos** (`assets/fotos/`): extraídas do próprio PDF da cliente (páginas 1, 12 e 15), sem edição.
- **"GESTANTE"** (`assets/marca/gestante-wordmark.png`): recortado da capa do PDF em 600 dpi, é o título original.
- **Etiqueta Black Friday** (`assets/marca/etiqueta-black-friday.png`): PNG do PDF, com o barbante prolongado para cima.
- **Logo** (`assets/marca/logo-preto.png` e `logo-branco.png`): logo "Ana Claudia clicks" da última página do PDF.
- **Cores** tiradas do PDF: grafite `#31312f`, papel `#f4f4f4`, vinho `#7a010f`, marfim `#f6f3ee`.

## Fontes

O PDF usa Montserrat (gratuita, mantida) e as fontes TAN Pearl, TAN Aegean e Kief Montaser,
pagas do Canva, que não podem ser tiradas do PDF para uso fora dele. No lugar delas:

- **Gilda Display** ≈ TAN Pearl (títulos em caixa alta e baixa)
- **Bellefair** ≈ Kief Montaser Light ("BLACK FRIDAY" espaçado e os números 15% e 20%)
- O "GESTANTE" decorativo (TAN Aegean) entra como imagem recortada do PDF, então fica idêntico.

Se a cliente quiser as fontes exatas, dá para remontar no Canva dela com este mesmo layout.

## Gerar de novo

```bash
node render.mjs        # todas
node render.mjs c2     # só uma
```

Usa o Playwright global e sobe um servidor local para fontes e fotos.
O HTML de cada peça está em `pecas/`, com estilos compartilhados em `pecas/base.css`.

## Conferir antes de subir

- Texto do asterisco (acima).
- Se o estúdio prefere WhatsApp ou outro CTA escrito na peça (hoje fica só o botão do anúncio).
- As regras de observação legal do `CLAUDE.md` são de plano de saúde e não se aplicam a este cliente.
