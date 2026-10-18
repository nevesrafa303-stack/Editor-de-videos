# Porto — Plano de Saúde para CNPJ: "A conta que ninguém revisa" (47 s)

Anúncio de 47 s, 30 fps, locução contínua, em dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Nada importante nos 230 px de cima
  nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (assets e node_modules por link).

Feito com HyperFrames + GSAP. Storyboard e key art no Figma:
https://www.figma.com/design/k3kqdkn871yjCAVEcaAuCg

## Roteiro

| Tempo | Cena | Locução | Motion | Som |
|---|---|---|---|---|
| 0–3,6 s | 01 · A conta (gancho) | "Quanto você pagou de plano de saúde este mês?" | Foto noturna com push-in, título palavra a palavra, contador da mensalidade sorteando até virar "?.???,??" em coral | impacto + embaralhado, drone tenso |
| 3,3–7,7 s | 02 · Vezes doze | "Agora multiplica por doze. Você sabe se esse valor é justo?" | 12 boletos JAN–DEZ, carimbos PAGO, "×12" gigante, linha de leitura | carimbos, impacto no "doze" |
| 7,4–12,6 s | 03 · Decisão | "Plano de saúde não é gasto. É decisão financeira inteligente." | Quebra para papel claro, "GASTO." riscado, virada azul com linha subindo | 80 ms de silêncio, trilha vira positiva |
| 12,3–20 s | 04 · O caminho | "E muita gente já descobriu: com o CNPJ, a mensalidade pode cair bastante, mantendo a mesma qualidade." | Cartão CNPJ de vidro, gráfico caindo, Hospital Dr. Beda + check | impacto no "CNPJ", queda, brilho |
| 19,6–26,8 s | 05 · A solução | "Na Porto, o plano para CNPJ começa em três vidas, a partir de 942,80." | Logo Porto, família com etiquetas (2 adultos + 1 jovem), contador trava em 942,80 | chime, tiques, contador, impacto |
| 26,4–32,5 s | 06 · Benefícios | "Com plano odontológico, seguro de vida, serviços ocupacionais e proteção antiácaro." | Bento grid, um benefício por palavra | pops |
| 32,1–38,3 s | 07 · Comparativo | "A gente compara o seu plano atual com o mercado e mostra, com números, quanto você pode economizar." | Painel "Análise comparativa", números embaralhados que terminam em "R$ ?", chip "Sua economia: descubra na simulação" | tiques, embaralhado, chime |
| 37,9–47 s | 08 · Ação | "Faça sua simulação gratuita, cem por cento online. Toque no botão e fale com um especialista." | A peça da Porto se monta, faixa CTA, mão toca o botão, pulsos; último 1,4 s parado | pop, toques |

Só textos aprovados: o preço, as vidas, os benefícios e o rodapé vêm das peças da Porto; os
textos de dor e virada vêm da copy do anúncio ("Plano de saúde não é gasto. É decisão
financeira inteligente.", "usar o CNPJ pode reduzir bastante o valor da mensalidade mantendo a
mesma qualidade", "a gente compara seu plano atual com o mercado e mostra, com números…").
Nenhum valor de economia é inventado: os números do comparativo são sorteados e terminam em "?".

## Gerar de novo

```bash
python3 -I tools/voice.py           # locução HeyGen numa tomada só, pausas ajustadas (cache em assets/voice/vo.json)
python3 -I tools/synth_audio.py     # trilha tensa -> positiva + efeitos (numpy, scipy, soundfile)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/porto-cnpj-47s-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/porto-cnpj-47s-feed.mp4)
```

A geometria de cada formato fica nas chamadas `pick(story, feed)` de `tools/build.mjs`. Os
tempos das animações saem de `assets/voice/vo.words.json`: se a locução mudar, basta rodar
`assemble.sh` de novo. Neste container o Chrome vem de `HYPERFRAMES_BROWSER_PATH` e o GSAP de
`assets/vendor/`. Masterização (−14 LUFS):
`ffmpeg -i renders/porto-cnpj-47s-story.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Assets e conectores

- `assets/img/ai-hook.png`, `ai-consult.png`, `ai-doctor.png`, `ai-family-cutout.png`: geradas
  com Figma AI (arquivo do storyboard, página "01 · Key art") e tratadas na Adobe (presets
  "Cool Shadows & Warm Highlights" e "Cool Light"; fundo da família removido na Adobe).
- `assets/img/plate.png` / `plate-feed.png`: foto do Hospital Dr. Beda das peças da Porto no
  Google Drive (as mesmas do filme `porto-cnpj-dor`), em `assets/ref/`.
- `assets/img/porto-logo.svg`: logo oficial da Porto.
- Tipografia: paleta sugerida pela Adobe (Montserrat + Alternate Gothic); usamos League Gothic
  (versão aberta da Alternate Gothic) nos títulos e Poppins (a fonte das peças) no resto.
- Locução: HeyGen "Sofia Brazil – Friendly" (pt-BR), velocidade 1,05, pausas de impacto depois
  das perguntas e das frases de virada.
- Trilha e efeitos: sintetizados em `tools/synth_audio.py` (acordes D–A–Bm–G no compasso da
  locução, drone e pulso tensos até 7,6 s).
