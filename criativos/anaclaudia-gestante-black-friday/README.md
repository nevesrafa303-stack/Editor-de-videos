# Ana Claudia Clicks — Black Friday Gestante (novembro/2026)

Criativos estáticos da ação de Black Friday do estúdio Ana Claudia Clicks (cliente da LAKS), no padrão
visual da proposta comercial em PDF da cliente ("BLACK20 Proposta Comercial Gestante.pdf").

Cada peça sai em **Story** e **Feed 4:5**, exportada em **2x** para máxima nitidez:
Story **2160×3840** e Feed **2160×2700** (mesma proporção de 1080×1920 e 1080×1350), em `final/`.
No Story, todo texto fica entre y=250 e y=1530 da peça em 1080 (fora da área coberta pela interface).
Visões gerais: `final/_visao-geral-desconto.jpg` e `final/_visao-geral-pacote-ouro.jpg`.

## Peças

### Desconto (texto pedido pela cliente)

> Condição Especial somente em Novembro · ENSAIO GESTANTE* 15% OFF · COMBO GESTANTE + NEWBORN* 20% OFF
> \*Válido para reservas realizadas em novembro de 2026. (confirmar com a cliente)

| Peça | Layout (página do PDF) | Modelo |
|---|---|---|
| `d1-capa-vermelho` | Capa escura | Vestido vermelho |
| `d2-holofote-sentada` | Holofote | Sentada, top e calça pretos |
| `d3-convite-jeans` | Convite (última página) | Top branco e jeans |

### Pacote Ouro parcelado

Valores da proposta (pág. 6): **R$ 654,00 no cartão** em até 12x sem juros, ou **R$ 545,00 à vista**
(Pix/dinheiro). Parcelas calculadas sobre os R$ 654,00: **12x R$ 54,50 · 8x R$ 81,75 · 6x R$ 109,00**.
Itens em destaque: 25 fotos · 3 looks · 1h de sessão · make + babyliss.
Todas trazem "Condição Especial somente em Novembro" e a nota "Pacote Ouro do Ensaio Gestante. Total de
R$ 654,00 no cartão. Válido para reservas realizadas em novembro de 2026."

| Peça | Parcelas | Layout | Modelo |
|---|---|---|---|
| `o1-capa-vermelho-12x` | 12x R$ 54,50 | Capa escura | Vestido vermelho |
| `o2-capa-clara-branco-12x` | 12x R$ 54,50 | Capa clara | Branco, com tênis de bebê |
| `o3-holofote-jeans-8x` | 8x R$ 81,75 | Holofote | Top branco e jeans |
| `o4-capa-clara-marrom-8x` | 8x R$ 81,75 | Capa clara | Conjunto marrom de tule |
| `o5-convite-sentada-6x` | 6x R$ 109,00 | Convite | Sentada, top e calça pretos |
| `o6-holofote-sentada-6x` | 6x R$ 109,00 | Holofote | Sentada, top e calça pretos |

As peças de preço não trazem o "15% OFF", porque a proposta não diz se os R$ 654,00 já têm o desconto.
Se tiverem, dá para acrescentar.

## Como funciona

- `pecas/dados.js`: lista única das peças (layout, foto, oferta, parcelas e enquadramento da foto).
  Os valores do Pacote Ouro e o cálculo das parcelas também ficam aqui.
- `pecas/capa.html`, `pecas/holofote.html`, `pecas/convite.html`: os três layouts. Cada um lê a peça
  pela URL (`?p=<id>#story` ou `#feed`).
- `pecas/base.js` e `pecas/base.css`: textos, preço e estilos comuns.

```bash
node render.mjs        # todas
node render.mjs o3     # só as que têm "o3" no nome
```

Usa o Playwright global e sobe um servidor local para fontes e fotos.

## Fotos e recortes

- `assets/fotos/originais/`: as 5 fotos originais enviadas pelo estúdio (~1700×2576).
- `assets/fotos/recortes/`: as mesmas modelos recortadas do fundo, usadas no layout holofote
  (o círculo de luz é desenhado atrás delas). Feitos localmente com BiRefNet:

```bash
# modelo: https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx (~970 MB)
python3 -I ferramentas/recortar.py /caminho/BiRefNet-general-epoch_244.onnx sentada jeans
```

O script também tira a cor do fundo original das bordas do cabelo, para não aparecer contorno cinza
sobre o círculo branco.

## Marca

- **"GESTANTE"** (`assets/marca/gestante-wordmark*.png`): recortado da capa do PDF em 600 dpi (versão clara e escura).
- **Etiqueta Black Friday** (`assets/marca/etiqueta-black-friday.png`): PNG do PDF, com o barbante prolongado.
- **Logo** (`assets/marca/logo-preto.png` e `logo-branco.png`): da última página do PDF.
- **Cores** do PDF: grafite `#31312f`, papel `#f4f4f4`, vinho `#7a010f`, marfim `#f6f3ee`.
- **Fontes**: Montserrat (a mesma do PDF). No lugar das fontes pagas do Canva: Gilda Display ≈ TAN Pearl
  e Bellefair ≈ Kief Montaser Light.

## Conferir antes de subir

- Texto do asterisco nas peças de desconto.
- Se os valores do Pacote Ouro já incluem o desconto de Black Friday.
- Se o parcelamento em 8x e 6x também é sem juros (a proposta só fala em 12x sem juros).
- As regras de observação legal do `CLAUDE.md` são de plano de saúde e não se aplicam a este cliente.
