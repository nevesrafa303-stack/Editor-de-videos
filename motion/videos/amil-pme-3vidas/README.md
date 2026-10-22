# Amil — Plano de Saúde Empresarial, 3 vidas a partir de R$ 1.166,21 (36,5 s)

Anúncio de 36,5 s, 30 fps, locução contínua, em dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Nada importante nos 230 px de cima
  nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (assets e node_modules por link).

Feito com HyperFrames + GSAP a partir da peça enviada (`assets/ref/amil-gloria-story.png`).
Locução, transcrição e efeitos sonoros pelo ElevenLabs (flow "Amil PME 3 vidas — locução e
efeitos").

## Roteiro

| Tempo | Cena | Locução (tom) | Motion | Som |
|---|---|---|---|---|
| 0–2,8 s | Gancho | "Psiu… você que tem CNPJ." (sussurro) | "psiu…" entra desfocado; "CNPJ" bate com anel e riscos de luz, tremida, e atravessa a câmera | drone, impacto |
| 2,6–10,2 s | Oferta | "Sabia que no Plano de Saúde Empresarial Amil… três vidas saem a partir de… R$ 1.166,21?" (curioso → confiante) | a foto da fachada abre do centro; o cartão branco da peça sobe; título palavra a palavra; 3 pessoas; "a partir de"; cada dígito do preço rola e para no instante em que é dito | whoosh, brilho, cartas, riser + impacto no drop, contador |
| 10,1–14,9 s | Composição | "Esse valor é pra dois adultos de até 38 anos e um jovem de até 18." (caloroso) | chip do preço; cartões ADULTO/ADULTO/JOVEM com as idades contando até 38 e 18; chave "= 3 vidas" | cartas, check |
| 14,8–21,6 s | Benefícios | "E olha o que vem junto: acesso ao Norte D'Or, da Rede D'Or… acomodação em quarto… e cobertura nacional." (animado) | pílula "BENEFÍCIOS EXCLUSIVOS"; três linhas entram no instante de cada benefício e ganham o check quando ele termina; pino cai no mapa do Norte D'Or (Cascadura, RJ) | cartas, pino, checks |
| 21,5–27,6 s | Detalhe | "Só um detalhe: é exclusivo para CNPJ. E os valores mudam conforme a faixa etária e a região." (sério) | carimbo "EXCLUSIVO PARA CNPJ"; chip do preço com setas; cursor de faixa etária e pino de região andando; "Valores sujeitos à faixa etária e região." | carimbo, respiro da trilha |
| 27,6–29,3 s | Virada | "Então não fica no achismo." (caloroso) | "achismo." riscado, interrogações somem | carimbo leve |
| 29,1–36,5 s | CTA | "Toque em Solicite sua cotação e descubra quanto fica pra sua empresa." (animado) | a peça se monta (foto, cartão do preço, EXCLUSIVO PARA CNPJ, benefícios, valores sujeitos, botão); o dedo toca o botão; pulsos; 1,2 s final parado | riser + impacto, refrão, toque |

### De onde vem cada informação

Tudo da peça: Plano de Saúde Empresarial, 3 vidas a partir de R$ 1.166,21 (2 adultos até 38
anos e 1 jovem até 18), exclusivo para CNPJ, benefícios (acesso ao Norte D'Or, acomodação
quarto, cobertura nacional), valores sujeitos à faixa etária e região, "Solicite sua cotação".
Acrescentado: a localização do Hospital Norte D'Or (Rua Carolina Machado, 38, Cascadura, Rio de
Janeiro, Rede D'Or) e o registro da Amil na ANS (nº 326305).

**Atenção à foto**: a fachada da peça é do Hospital Glória D'Or (Glória, RJ), não do Norte
D'Or. No vídeo o Norte D'Or aparece só no mapa com a localização, e o cartão final traz
"Imagem ilustrativa". Se o Glória D'Or não estiver na rede do plano anunciado, troque a foto.

## Gerar de novo

```bash
python3 -I tools/prep_assets.py     # foto da fachada sem a aba do logo (hospital.jpg / hospital-wide.jpg)
bash tools/prep_voice.sh            # locução: passa-altas, sussurro +5 dB, compressão leve
python3 -I tools/synth_audio.py     # efeitos do ElevenLabs cortados no golpe + trilha (~121 BPM)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/amil-3vidas-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/amil-3vidas-feed.mp4)
```

A geometria de cada formato fica nas chamadas `pick(story, feed)` de `tools/build.mjs`; os
tempos saem de `assets/voice/vo.words.json`. Neste container o Chrome vem de
`HYPERFRAMES_BROWSER_PATH` e o GSAP de `assets/vendor/`. Masterização (−14 LUFS):
`ffmpeg -i renders/amil-3vidas-story.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Áudio (ElevenLabs)

- **Locução**: Eleven v4, voz "Nassif – Persuasive Sales & Ads" (pt-BR), com tags de tom no
  texto: `[whispers]` no gancho, `[curious]`, `[confident]` no preço, `[warmly]`, `[excited]`
  nos benefícios e no CTA, `[serious]` no "Só um detalhe". Duas tomadas; ficou a A (33,2 s,
  mais variação de altura). Original em `assets/voice/vo.raw.mp3`; `vo.wav` leva passa-altas,
  compressão leve, presença e +5 dB no sussurro do gancho (`tools/prep_voice.sh`).
- **Tempos**: Scribe v1 numa transcrição sem texto de referência (confirma a pronúncia de
  "mil cento e sessenta e seis reais e vinte e um centavos" e "Norte D'Or, da Rede D'Or").
- **Efeitos** (Sound Effects v2, `assets/audio/src/`): impacto grave, whoosh, riser,
  contador de dígitos, check de interface, brilho, carimbo, toque na tela, cartão deslizando,
  pino de mapa e drone de abertura.
- **Trilha**: sintetizada em `tools/synth_audio.py` (a conexão do ElevenLabs deste ambiente não
  gera música): Lá maior, drop no "mil" do preço, respiro no "Só um detalhe", refrão no CTA.

## Assets

- `assets/img/hospital.jpg` / `hospital-wide.jpg`: foto da fachada recortada da peça; a aba do
  logo foi trocada por céu e fachada desfocados, e no vídeo esse canto fica sob a aba nova.
- `assets/img/amil-logo.png`: logo Amil (alfa), usado como máscara índigo.
- Tipografia: Saira Semi Condensed (títulos, preço) e Poppins (texto), as mesmas da peça.
