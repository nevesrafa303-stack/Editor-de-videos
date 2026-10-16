# Aport Seguros — Plano de Saúde para CNPJ (HyperFrames)

Filme de motion graphics cinematográfico, 1080×1920 (Reels/Stories), 38,4 s, 30 fps.
Feito com o HyperFrames (HeyGen), workflow `product-launch-video`.

| Cena | Tempo | Conteúdo |
|---|---|---|
| 01-hook | 0–4,8 s | "Sua empresa merece um plano de saúde à altura." |
| 02-aport | 4,8–9,6 s | Marca APORT SEGUROS, "Plano de Saúde para CNPJ", a partir de 3 vidas |
| 03-bradesco | 9,6–16,8 s | Bradesco Saúde, 3 benefícios, R$ 1.697,90 (trava em 14,4 s) |
| 04-sulamerica | 16,8–24 s | SulAmérica, 2 benefícios, R$ 1.014,97 (trava em 21,6 s) |
| 05-porto | 24–31,2 s | Porto, 4 benefícios, R$ 942,80 (trava em 28,8 s) |
| 06-cta | 31,2–38,4 s | "Simulação Gratuita 100% Online" + rodapé legal |

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
- Locução: o roteiro está em `SCRIPT.md` e as cenas já têm a duração dele. Para gravar com uma voz
  HeyGen: `npx hyperframes auth login`, depois
  `node ~/.claude/skills/product-launch-video/scripts/audio.mjs --script ./SCRIPT.md --storyboard ./STORYBOARD.md --hyperframes . --out ./audio_meta.json --provider heygen --voice <id>`
  (mantém os efeitos `source: host`), `bash tools/assemble.sh` e render.

## Locução feminina HeyGen (próxima sessão)

Pré-requisitos no ambiente: `api.heygen.com` liberado em Network access e a variável
`HEYGEN_API_KEY` configurada (as duas mudanças só valem em uma sessão nova).

```bash
cd motion && npm ci && npx hyperframes skills          # CLI + skills do HyperFrames
cd videos/aport-seguros-cnpj && npm i --no-save @hyperframes/core@0.8.165
export HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
node ~/.claude/skills/media-use/audio/scripts/heygen-tts.mjs --list   # escolher voz feminina pt-BR
```

Depois: gerar a voz pelo `audio.mjs` (provider `heygen`), recolocar os SFX `source: host` no
`audio_meta.json`, `bash tools/assemble.sh`, fazer o carve da trilha sob a voz e renderizar.

## Pendências

- Logos oficiais (Bradesco, SulAmérica, Porto, Aport) — hoje são marcas em texto.
- Fotos dos hospitais em baixa resolução (vieram coladas no briefing); usadas desfocadas como fundo.
