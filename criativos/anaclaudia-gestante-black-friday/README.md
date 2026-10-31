# Ana Claudia Clicks — Black Friday Gestante (novembro/2026)

Criativos estáticos da ação de Black Friday do estúdio Ana Claudia Clicks (cliente da LAKS), no padrão
visual da proposta comercial em PDF da cliente ("BLACK20 Proposta Comercial Gestante.pdf").

Cada peça sai em **Story** e **Feed 4:5**, exportada em **2x**: Story **2160×3840** e Feed **2160×2700**
(mesma proporção de 1080×1920 e 1080×1350), em `final/`. Visão geral: `final/_visao-geral.jpg`.

## Pedidos da cliente

- Texto: **Condição Especial somente em Novembro · ENSAIO GESTANTE\* 15% OFF · COMBO GESTANTE + NEWBORN\* 20% OFF**.
- **Sem valores em reais**: só a porcentagem de desconto (as variações do Pacote Ouro parcelado foram retiradas).
- **Sem a logo da Ana Claudia** nas peças.
- Nota do asterisco: "\*Válido para reservas realizadas em novembro de 2026." (confirmar o texto com a cliente).

## Peças

| Peça | Layout (página do PDF) | Modelo |
|---|---|---|
| `d1-capa-vermelho` | Capa escura | Vestido vermelho |
| `d2-holofote-sentada` | Holofote | Sentada, top e calça pretos |
| `d3-convite-jeans` | Convite (última página) | Top branco e jeans |
| `d4-capa-clara-branco` | Capa clara | Branco, com tênis de bebê |
| `d5-holofote-jeans` | Holofote | Top branco e jeans |
| `d6-capa-clara-marrom` | Capa clara | Conjunto marrom de tule |
| `d7-convite-sentada` | Convite | Sentada, top e calça pretos |

Informações centralizadas: no Story, todo texto fica entre y=330 e y=1470 da peça em 1080 (folga dentro da
zona segura 250–1530); no convite, o texto é centralizado no painel claro.

## Como funciona

- `pecas/dados.js`: lista das peças (layout, foto e enquadramento da foto em Story e Feed).
- `pecas/capa.html`, `pecas/holofote.html`, `pecas/convite.html`: os três layouts. Cada um lê a peça
  pela URL (`?p=<id>#story` ou `#feed`).
- `pecas/base.js` e `pecas/base.css`: textos e estilos comuns.

```bash
node render.mjs        # todas
node render.mjs d5     # só as que têm "d5" no nome
```

Usa o Playwright global e sobe um servidor local para fontes e fotos.

## Fotos: ampliação, acabamento e recortes

1. `assets/fotos/originais/`: as 5 fotos enviadas pelo estúdio (~1700×2576).
2. `assets/fotos/hd/`: ampliadas 2x (~3400×5150) com super-resolução por IA (Real-ESRGAN x2plus, local na CPU).
3. `assets/fotos/nitidas/` (usadas nas peças): a ampliação com a textura fina da foto original devolvida
   (pele, fios, tatuagens que a IA alisa) e nitidez sutil. Assim a exportação em 2x nunca amplia foto no
   navegador e a pele não fica com aspecto de plástico.
4. `assets/fotos/recortes/`: as modelos do layout holofote recortadas do fundo (das fotos nítidas) com
   BiRefNet, local, com limpeza da cor do fundo nas bordas do cabelo. O círculo de luz é desenhado atrás.

O grão fino (`assets/marca/grao.png`) fica só no fundo desenhado do holofote, para não aparecer faixas
no degradê; as fotos ficam limpas.

```bash
# 1. super-resolução — pesos em https://github.com/xinntao/Real-ESRGAN/releases (requer torch CPU + spandrel)
python3 -I ferramentas/ampliar.py RealESRGAN_x2plus.pth assets/fotos/originais/jeans.jpg assets/fotos/hd/jeans.jpg
# 2. acabamento (textura original + nitidez)
python3 -I ferramentas/refinar.py jeans
# 3. recorte — modelo em https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx
python3 -I ferramentas/recortar.py BiRefNet-general-epoch_244.onnx nitidas jeans
```

Se o estúdio tiver as fotos no tamanho original da edição (enviadas como arquivo, não como foto de
WhatsApp), elas substituem a ampliação por IA com ainda mais detalhe.

## Marca

- **"GESTANTE"** (`assets/marca/gestante-wordmark*.png`): recortado da capa do PDF em 600 dpi (versão clara e escura).
- **Etiqueta Black Friday** (`assets/marca/etiqueta-black-friday.png`): PNG do PDF, com o barbante prolongado.
- **Cores** do PDF: grafite `#31312f`, papel `#f4f4f4`, vinho `#7a010f`, marfim `#f6f3ee`.
- **Fontes**: Montserrat (a mesma do PDF). No lugar das fontes pagas do Canva: Gilda Display ≈ TAN Pearl
  e Bellefair ≈ Kief Montaser Light.

As regras de observação legal do `CLAUDE.md` são de plano de saúde e não se aplicam a este cliente.
