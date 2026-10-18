# Porto — Plano de Saúde para CNPJ: "Para de rolar" (50 s)

Anúncio de 50 s, 30 fps, locução contínua, em dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Nada importante nos 230 px de cima
  nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (assets e node_modules por link).

## A ideia: rolagem de verdade

O filme é uma página só que rola. O gancho é um feed passando rápido (com desfoque de movimento)
que **para no toque do dedo** em "Para de rolar."; o post se abre e vira a página. A partir daí
as seções ficam empilhadas numa página alta (15.980 px na story, 9.600 px no feed) e a posição
de rolagem sai de uma lista de gestos em `tools/build.mjs` (`PAGE`):

- **arremesso (flick)**: o dedo arrasta (`power1.in`) e solta; a inércia (`power4.out`) começa
  com a mesma velocidade da soltura (2·d1/td = 5·d2/tm), como no celular;
- **arrasto lento (drag)**: rolagem de leitura com o dedo encostado; o gráfico da mensalidade é
  desenhado pela própria rolagem (mesma curva e duração);
- **retorno elástico**: no fim do extrato e no fim da página (em "Agora pode rolar") o conteúdo
  passa do limite e volta.

Cada cena desenha a sua seção em (topo da seção − Y(t)) com as mesmas curvas, então cenas
vizinhas andam coladas. Dentro das seções há rolagem aninhada (extrato de boletos com cabeçalho
de ano fixo, que troca quando o separador chega ao topo, e barra de rolagem própria) e um
carrossel horizontal com snap e paralaxe nas fotos. O dedo (círculo de toque), a barra de
rolagem da página e o desfoque vertical (proporcional à velocidade, filtro SVG) saem dos mesmos
gestos.

## Roteiro

| Tempo | Seção | Locução | Movimento |
|---|---|---|---|
| 0–3,6 s | Feed | "Para de rolar. Isso aqui é pra quem tem CNPJ." | feed voando, toque que para, "rolar." trava, selo CNPJ; o post se abre |
| 3,3–11 s | Extrato | "Todo mês o boleto do plano de saúde chega, você paga e segue rolando. Mas quando foi a última vez que você comparou?" | boleto novo entra e empurra a lista, PENDENTE → PAGO, arremesso até 2023 com retorno elástico, folha de baixo com a pergunta |
| 10–13 s | Alerta | "Você pode estar pagando caro." | recibo com paralaxe, total "R$ ?.???,??" |
| 12–20 s | CNPJ | "E muita gente já descobriu: usar o CNPJ pode reduzir bastante o valor da mensalidade, mantendo a mesma qualidade." | cartão CNPJ gira, gráfico desenhado pela rolagem, Hospital Dr. Beda com paralaxe |
| 19,4–27 s | Oferta | "Na Porto, o plano de saúde para CNPJ começa com três vidas, a partir de 942,80." | logo, família com etiquetas, contador trava em 942,80 |
| 26,6–33 s | Benefícios | "Com plano odontológico, seguro de vida, serviços ocupacionais e proteção antiácaro." | carrossel com arrasto e snap, um cartão por benefício |
| 32–39 s | Comparativo | "A gente compara o seu plano atual com o mercado e mostra, com números, quanto você pode economizar." | barras, números embaralhados que terminam em "R$ ?", "Sua economia: descubra na simulação" |
| 38,4–50 s | Ação | "Simulação gratuita, cem por cento online. Agora pode rolar. Mas antes, toque no botão e fale com um especialista." | a página rola até a peça da Porto e volta no limite; o dedo toca o botão; pulsos; 1,4 s final parado |

Só textos aprovados: preço, vidas, benefícios e rodapé vêm das peças da Porto; as frases de dor
e virada vêm da copy do anúncio. Nenhum valor de economia é inventado (os números do comparativo
são sorteados e terminam em "?"; os valores dos boletos aparecem mascarados).

## Gerar de novo

```bash
python3 -I tools/voice.py           # locução HeyGen numa tomada só (cache em assets/voice/vo.json)
python3 -I tools/synth_audio.py     # trilha (Dó# menor -> Mi maior) + efeitos de rolagem (numpy, scipy, soundfile)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/porto-cnpj-50s-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/porto-cnpj-50s-feed.mp4)
```

A geometria de cada formato fica nas chamadas `pick(story, feed)` de `tools/build.mjs`; os
tempos saem de `assets/voice/vo.words.json`. `tools/gestures-*.json` resume os gestos de cada
formato. Neste container o Chrome vem de `HYPERFRAMES_BROWSER_PATH` e o GSAP de `assets/vendor/`.
Masterização (−14 LUFS):
`ffmpeg -i renders/porto-cnpj-50s-story.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Assets

- `assets/img/b-odonto.jpg`, `b-vida.jpg`, `b-ocup.jpg`, `b-acaro.jpg`: fotos dos benefícios
  geradas com Figma AI (arquivo do storyboard, página "01 · Key art").
- `assets/img/feed-p*.jpg`: posts genéricos do feed do gancho (fotos do projeto, levemente
  desfocadas).
- `assets/img/ai-consult.png`, `ai-family-cutout.png`: do filme de 47 s (Figma AI + Adobe).
- `assets/img/plate.png` / `plate-feed.png`: foto do Hospital Dr. Beda das peças da Porto.
- Tipografia: Poppins (a fonte das peças) e Instrument Serif itálica nas palavras de destaque.
- Locução: HeyGen "Sofia Brazil – Friendly" (pt-BR), velocidade 1,15.
- Trilha e efeitos: sintetizados em `tools/synth_audio.py` (catraca do feed, lista correndo com
  tiques no ritmo da velocidade, arremesso, retorno elástico, toque no vidro, folha subindo).
