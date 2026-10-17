# SulAmérica — Plano de Saúde para CNPJ (Reels/Stories 15 s)

Motion graphic publicitário 1080×1920, 15 s, 30 fps, fiel à peça
"AD - Nursing Care Preço SulAmérica STORY" (em `assets/ref/`). Feito com HyperFrames.

| Tempo | O que acontece | Som |
|---|---|---|
| 0–1,5 s | Hospital Nursing Care ao entardecer em tela cheia, câmera avança para a entrada, parallax no totem; bloco laranja desliza da esquerda; "Plano de Saúde para CNPJ" palavra por palavra | whoosh |
| 1,5–4,5 s | "3 vidas a partir de"; preço sobe de R$ 0 até R$ 1.014,97* e trava em 4,4 s com leve impacto e brilho; rodapé legal entra e fica até o fim | tiques, impacto |
| 4,5–8,5 s | Cartão branco sobe; "Atendimento Rede D'Or" e "Plano odontológico", um de cada vez, com check | pop + clique |
| 8,5–11 s | Curva azul-marinho varre a lateral direita; onda laranja do logo se desenha e "SulAmérica" aparece | whoosh, chime |
| 11–15 s | Faixa laranja "Simulação Gratuita 100% Online" + botão "Simule agora" pulsando; de 14 s a 15 s tudo parado na composição final | whoosh, pop, toques |

## Zonas seguras

Toda a arte da referência subiu 120 px e a faixa do CTA ficou entre 1395 e 1533 px:
nada importante nos 12% de cima (0–230 px) nem nos 20% de baixo (1536–1920 px).
O rodapé legal tem 20 px (na referência são 14 px) para ser lido no celular.

## Gerar de novo

```bash
python3 tools/prep_assets.py        # foto em tela cheia, recorte do totem, logo (numpy, opencv, pillow)
python3 tools/synth_audio.py        # trilha 109 BPM + efeitos (numpy, scipy, soundfile)
python3 tools/voice.py              # locução HeyGen (opcional; cache em assets/voice/0N.json)
bash tools/assemble.sh              # compositions/anuncio.html + index.html + carve da trilha
npx hyperframes check
npx hyperframes render --quality high --fps 30 --output renders/sulamerica-reels-15s.mp4
```

Neste container o Chrome vem de `HYPERFRAMES_BROWSER_PATH` e o GSAP de `assets/vendor/`.
Masterização para redes (−14 LUFS):
`ffmpeg -i renders/sulamerica-reels-15s.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Assets

- `assets/img/plate.png`: a foto da story, completada com a área extra da versão feed
  (alinhadas por ORB). Abaixo do gramado não há foto: o trecho é textura do próprio gramado
  escurecendo até o azul-marinho (fica atrás do bloco laranja e da base).
- `assets/img/totem.png`: totem "Hospital Nursing Care" recortado para o parallax.
- `assets/img/logo-wave.png` e `logo-text.png`: logo oficial da SulAmérica (lockup do site),
  só a parte "SulAmérica" + onda, sem distorção; o texto em branco, como na peça.
- Locução: voz HeyGen "Sofia Brazil" (pt-BR), 4 falas com o texto do briefing.
- Trilha e efeitos: 100% sintetizados (`tools/synth_audio.py`), sem licença de terceiros.
