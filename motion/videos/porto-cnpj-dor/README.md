# Porto — Plano de Saúde para CNPJ (dor → desejo → solução)

Motion graphic de 24,5 s, 30 fps, com locução contínua, em dois formatos (mesmo roteiro e áudio):

- **Story 9:16 (1080×1920)** — este projeto (`index.html`). Termina na peça
  "AD - Dr. Beda Preço Porto STORY", com tudo dentro das zonas seguras.
- **Feed 1:1 (1080×1080)** — projeto em `feed/` (assets compartilhados por link). Termina na
  peça de feed "AD - Dr. Beda Preço Porto", nas posições dela; a faixa do CTA traz texto e
  botão lado a lado.

Feito com HyperFrames. As referências estão em `assets/ref/`.

| Tempo | Ato | O que acontece | Som |
|---|---|---|---|
| 0–2,6 s | Dor | Fundo escuro, notificação "Sua fatura chegou: o valor subiu de novo.", "Você pode estar PAGANDO CARO no seu plano de saúde?" com glitch e gráfico vermelho subindo | sino de notificação, impacto + glitch, batimento e relógio na trilha |
| 2,7–4,3 s | Virada | "Muita gente já descobriu:" + interruptor CPF → CNPJ; no "CNPJ" a tela vira azul (quebra de padrão) | 80 ms de silêncio, clique, impacto, trilha vira positiva |
| 4,3–8 s | Desejo | "a mensalidade pode cair bastante" (linha caindo) e o Hospital Dr. Beda em cartão: "com a mesma qualidade" | assobio descendente, brilho |
| 8–13,3 s | Solução | A foto abre em tela cheia, bloco "Plano de Saúde para CNPJ", logo da Porto, "3 vidas a partir de R$ 942,80*" (contador trava no compasso) | pop + chime, tiques, impacto |
| 13,3–18,4 s | Benefícios | Plano odontológico, seguro de vida, serviços ocupacionais, proteção antiácaro, um por vez com ícone | pops |
| 18,4–24,5 s | CTA | Faixa "Simulação Gratuita 100% Online" + botão "Simule agora" pulsando; último segundo parado | pop, toques |

Textos de dor/virada vêm da copy do anúncio no Facebook ("Você pode estar pagando caro no seu
plano de saúde?", "usar o CNPJ pode reduzir bastante o valor da mensalidade mantendo a mesma
qualidade", "descubra quanto você pode economizar"). Preço, benefícios e rodapé são os da peça.

## Gerar de novo

```bash
python3 -I tools/prep_assets.py     # foto do Dr. Beda em tela cheia, recortada na curva da arte
python3 -I tools/voice.py           # locução HeyGen em uma tomada, pausas encurtadas (opcional; cache em assets/voice/vo.json)
python3 -I tools/synth_audio.py     # trilha tensa -> positiva + efeitos (numpy, scipy, soundfile)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/porto-cnpj-dor.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/porto-cnpj-dor-feed.mp4)
```

A geometria de cada formato fica no objeto `GEO` de `tools/build.mjs`.

Os tempos de todas as animações saem de `assets/voice/vo.words.json`: se a locução mudar,
basta rodar `assemble.sh` de novo. Neste container o Chrome vem de `HYPERFRAMES_BROWSER_PATH`
e o GSAP de `assets/vendor/`. Masterização (−14 LUFS):
`ffmpeg -i renders/porto-cnpj-dor.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Assets

- `assets/ref/`: peças da Porto no Drive (story, feed e "3 vidas"), em alta.
- `assets/img/plate.png`: foto do Hospital Dr. Beda tirada da story (10 px abaixo para a placa
  ficar fora da faixa de cima), recortada pela curva vetorial da arte.
- `assets/img/plate-feed.png`: a foto da peça de feed; abaixo da faixa de foto entra a story
  alinhada por ORB (mesma foto, escala 0,742) para o cartão do ato 2 mostrar placa e banner.
- `assets/img/porto-logo.svg`: logo oficial da Porto (vetor do site portoseguro.com.br).
- Fonte Poppins (Google Fonts), a mesma da peça.
- Locução: HeyGen "Sofia Brazil - Friendly" (pt-BR), uma fala só, silêncios limitados a 0,09 s
  dentro da frase e 0,2 s entre frases.
- O azul-claro dos blocos é #3A90EE (a peça usa #4A9FF9): um tom abaixo para o texto branco
  passar no contraste mínimo de leitura.
