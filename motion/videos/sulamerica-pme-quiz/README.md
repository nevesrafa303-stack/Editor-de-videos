# SulAmérica PME — variação 3, "quiz de preço" (31,9 s)

Terceira versão do anúncio SulAmérica PME para 3 vidas (R$ 1.770,30/mês com IOF), para testar
contra `../sulamerica-pme-3vidas` (narração com motion) e `../sulamerica-pme-conversa` (conversa em
áudios). Esta é curta e interativa: um quiz de preço na tela, a revelação, a reação de uma cliente
e o CTA do formulário do anúncio. Dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Conteúdo entre 236 e 1340 px, legendas
  em 1390–1500 px; nada importante nos 230 px de cima nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (legendas em 950–1040 px).

Feito com HyperFrames + GSAP a partir da cotação enviada (`assets/ref/cotacao-sulamerica.jpg`).
**Sem gravação nova**: os créditos do ElevenLabs acabaram, então a locução é montada só com falas
já gravadas para as versões 1 e 2 (mesmas vozes: Kaique e Adriane).

## Roteiro

| Tempo | Quem | Fala | Na tela |
|---|---|---|---|
| 0,3–2,8 s | Consultor | "Ei… você tem CNPJ?" | tela laranja: "Ei…", "você tem", "CNPJ?" batendo |
| 2,8–6,4 s | — | *(sem fala; trilha em tensão e relógio)* | "QUIZ RÁPIDO — Quanto custa um plano de saúde empresarial pra 3 pessoas?"; opções A) Mais de R$ 2.500, B) Entre R$ 2.000 e R$ 2.500, C) Menos de R$ 1.800; contagem 3-2-1 com o anel esvaziando; a C fica verde |
| 6,4–14,9 s | Consultor | "SulAmérica PME, três vidas, por R$ 1.770,30 por mês… já com IOF!" | selo "Resposta C: menos de R$ 1.800"; logo, PME + Capital/03 a 04 vidas, 3 pessoas, preço rolando dígito a dígito no ritmo da fala, carimbo "JÁ COM IOF" |
| 15,1–17,6 s | Cliente | "Sério?! Pra três pessoas?!" | bolha de áudio da cliente tocando, rosto surpreso, "Sério?!" e "Pra três pessoas?!" |
| 18,0–26,7 s | Consultor | *(risada)* "Sério! Pra essas idades aqui, ó. Abrangência nacional, apartamento, coparticipação, reembolso… e sem taxa de inscrição!" | "Sério! Pra essas idades:", cartões 0 a 18 (R$ 379,08), 29 a 33 (R$ 652,21) e 34 a 38 (R$ 697,86) contornados no "aqui, ó"; cada benefício entra com check quando é dito |
| 27,1–31,9 s | Consultor | "Toca no botão aqui embaixo e faz a sua cotação!" | "Acertou? Faça sua cotação", preço, botão "Preencha o formulário" e, no "aqui embaixo", setas "Toque no botão abaixo"; texto legal |

Legendas palavra a palavra (consultor em laranja, cliente em verde), para quem assiste sem som.

### De onde vem cada informação

Tudo da cotação (ver `../sulamerica-pme-3vidas/README.md`). As opções A e B do quiz são só faixas de
resposta (não citam outro plano nem outra operadora); a C é verdadeira (R$ 1.770,30 < R$ 1.800).
O número de registro na ANS não foi incluído (confirme qual operadora do grupo emite esse produto).

## Gerar de novo

```bash
python3 -I tools/prep_voice.py      # corta os trechos das tomadas, nivela, monta a locução com o espaço do quiz
python3 -I tools/synth_audio.py     # efeitos do ElevenLabs cortados no golpe + trilha (~118 BPM)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/sulamerica-quiz-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/sulamerica-quiz-feed.mp4)
```

Os trechos ficam em `LINES` de `tools/prep_voice.py` e o tempo do quiz em `GAP_BEFORE`. Geometria
por formato nas chamadas `pick(story, feed)` de `tools/build.mjs`; grupos de legenda na lista `CAP`.
Masterização (−14 LUFS):
`ffmpeg -i renders/sulamerica-quiz-story.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Áudio (ElevenLabs)

- **Vozes** (Eleven v4), trechos de tomadas já gravadas (`assets/voice/takes/`):
  - "Ei… você tem CNPJ?": tomada 2A da versão 1 (Kaique);
  - revelação e "Sério! Pra essas idades…": consultor-A da versão 2 (Kaique);
  - "Sério?! Pra três pessoas?!": cliente-A da versão 2 (Adriane);
  - "Toca no botão aqui embaixo e faz a sua cotação!": tomada do CTA de formulário (Kaique).
- **Tempos**: Scribe v1 das tomadas originais; os da tomada do CTA vêm do alinhamento da versão 1
  (`../sulamerica-pme-3vidas/tools/align_words.py`).
- **Efeitos** (Sound Effects v2): os das versões anteriores, com relógio na contagem do quiz.
- **Trilha**: sintetizada em `tools/synth_audio.py` (a conexão do ElevenLabs deste ambiente não
  gera música): tensão no gancho e no quiz, drop na revelação, respiro na reação da cliente,
  virada até o CTA e acorde final no "faz a sua cotação".

## Assets

- `assets/img/logo-wave.png`, `logo-text.png`: logo oficial da SulAmérica (do projeto
  `sulamerica-reels-15s`), onda laranja + nome em branco.
- Tipografia: Montserrat (500–900) e Poppins.
