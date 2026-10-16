# Aport Seguros — Plano de Saúde para CNPJ (HyperFrames)

Filme de motion graphics cinematográfico, 1080×1920 (Reels/Stories), 50,4 s, 30 fps, com locução.
Feito com o HyperFrames (HeyGen), workflow `product-launch-video`.

| Cena | Tempo | Conteúdo |
|---|---|---|
| 01-hook | 0–4,8 s | "Sua empresa merece um plano de saúde à altura." |
| 02-aport | 4,8–12 s | Marca APORT SEGUROS, "Plano de Saúde para CNPJ", a partir de 3 vidas |
| 03-bradesco | 12–21,6 s | Bradesco Saúde, 3 benefícios, R$ 1.697,90 (trava em 19,2 s) |
| 04-sulamerica | 21,6–31,2 s | SulAmérica, 2 benefícios, R$ 1.014,97 (trava em 28,8 s) |
| 05-porto | 31,2–40,8 s | Porto, 4 benefícios, R$ 942,80 (trava em 38,4 s) |
| 06-cta | 40,8–50,4 s | "Simulação Gratuita 100% Online" + rodapé legal |

## Gerar de novo

```bash
python tools/synth_audio.py          # trilha 100 BPM + efeitos -> assets/audio (numpy, scipy, soundfile)
bash tools/assemble.sh               # cenas -> index.html -> transições
npx hyperframes check
npx hyperframes render --quality high --output renders/aport-seguros-cnpj.mp4
```

Neste container o Chrome vem de `HYPERFRAMES_BROWSER_PATH` e o GSAP de `assets/vendor/`.

## Áudio

- Trilha e efeitos 100% sintetizados (`tools/synth_audio.py`), na mesma grade de compassos dos cortes
  (2,4 s por compasso): whoosh nas transições, riser + impacto em cada preço, ticks nos checks,
  brilho na marca, crash na chegada do CTA.
- Locução: ver abaixo.

## Locução

Voz HeyGen "Sofia Brazil - Friendly" (pt-BR, feminina), uma fala por cena, gerada por
`python3 tools/voice.py` (cache em `assets/voice/0N.json`; só gera de novo se o texto mudar).
Precisa de `api.heygen.com` e `*.heygen.ai` liberados e do segredo de rede `X-Api-Key` para
`api.heygen.com`. Cenas e animações seguem os word_timestamps das falas; a trilha (volume 0,55)
recebe o carve do hyperframes-audio (força 0,5) sob a voz. Duração final: 50,4 s.

## Pendências

- Logos oficiais (Bradesco, SulAmérica, Porto, Aport) — hoje são marcas em texto.
- Fotos dos hospitais em baixa resolução (vieram coladas no briefing); usadas desfocadas como fundo.
