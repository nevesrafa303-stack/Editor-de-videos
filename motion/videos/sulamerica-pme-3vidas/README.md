# SulAmérica PME — 3 vidas por R$ 1.770,30/mês com IOF, na voz do corretor (45,7 s)

Anúncio de 45,7 s, 30 fps, em dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Conteúdo entre 260 e 1340 px,
  legendas em 1390–1500 px; nada importante nos 230 px de cima nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (legendas em 950–1040 px).

Feito com HyperFrames + GSAP a partir da cotação enviada (`assets/ref/cotacao-sulamerica.jpg`) e
do roteiro do cliente (usados só como fonte de informação). Voz e efeitos pelo ElevenLabs (flows
"SulAmérica PME 3 vidas — locução humana" e "SulAmérica PME — variação conversa em áudios").

**CTA para formulário**: os anúncios rodam com formulário de cadastro, então o fim do vídeo leva a
pessoa a tocar no botão do anúncio e preencher o formulário (não há mais menção a WhatsApp).

## Roteiro (fala em 1ª pessoa, com reações)

| Tempo | Cena | Fala | Motion |
|---|---|---|---|
| 0–8,7 s | Gancho | "Ei… você tem CNPJ? E ainda não tem plano de saúde empresarial? Sério?! *(risada)* Então presta atenção." | cartão CNPJ sobe e ganha check; cartão "Plano de saúde empresarial" chega com a caixa vazia e um "?"; balão "Sério?!" e rosto surpreso logo abaixo; a risada sacode o balão e solta "haha" |
| 8,6–18,0 s | Oferta | "Olha só: SulAmérica PME pra três vidas por R$ 1.770,30 por mês… já com IOF, hein!" | onda do logo se desenha; PME + selo "Capital / 03 a 04 vidas", "Apólice 12 meses"; 3 pessoas; cada dígito do preço rola e para quando é dito; carimbo "JÁ COM IOF" |
| 17,8–24,5 s | Cotação | "É pra uma pessoa de 0 a 18 anos, uma de 29 a 33 e outra de 34 a 38." | recibo "Sua cotação": as faixas entram quando são ditas, com o valor de cada uma; Total R$ 1.729,15, IOF 2,38% (+ R$ 41,15), Total com IOF R$ 1.770,30; sem taxa de inscrição |
| 24,3–31,1 s | Benefícios | "Tem abrangência nacional, apartamento, coparticipação, reembolso… e sem taxa de inscrição." | "Especial Vital QP R1 — E ainda tem:", cinco linhas com check verde no instante de cada uma |
| 31,0–33,2 s | Pergunta | "Quer saber se você pode contratar?" | lupa passando sobre o cartão CNPJ; "Você pode contratar?" |
| 33,1–37,8 s | Formulário | "Preenche o formulário que eu te ajudo a ver as condições pra você e pra sua família." | celular com o formulário "Solicite sua cotação": Nome, Telefone e E-mail se preenchem enquanto ele fala, o dedo toca "Enviar", "Recebido! Agora é comigo…" |
| 37,7–45,7 s | CTA | "Não deixa pra pensar na saúde só quando precisar, tá? Toca no botão aqui embaixo e faz a sua cotação!" | logo, "Cuide da saúde antes de precisar", cartão do preço, botão "Preencha o formulário"; no "aqui embaixo" entram setas "Toque no botão abaixo" descendo para o botão do anúncio; texto legal |

Legendas palavra a palavra em todo o vídeo (palavra falada em laranja), para quem assiste sem som.

### De onde vem cada informação

Da cotação: SulAmérica PME | Capital – 03 a 04 vidas – Apólice 12 meses; Especial Vital QP R1,
compulsório, 30% de coparticipação, reembolso; acomodação apartamento; abrangência nacional;
sem taxa de inscrição; IOF de 2,38%; 0 a 18 R$ 379,08, 29 a 33 R$ 652,21, 34 a 38 R$ 697,86;
total R$ 1.729,15; total + IOF R$ 1.770,30. O IOF em reais (R$ 41,15) é a diferença entre os
dois totais. Do roteiro: o gancho e "verificar as condições de contratação". Os campos do
formulário na tela (Nome, Telefone, E-mail) são ilustrativos; ajuste se o formulário do anúncio
pedir outros. O número de registro na ANS não foi incluído (confirme qual operadora do grupo
emite esse produto antes de acrescentar).

## Gerar de novo

```bash
python3 -I tools/align_words.py     # tempos por palavra da tomada do CTA (DTW contra a 2A + marcação manual)
python3 -I tools/prep_voice.py      # 2A até "inscrição" + tomada do CTA, tratamento, vo.wav e vo.words.json
python3 -I tools/synth_audio.py     # efeitos do ElevenLabs cortados no golpe + trilha (~124 BPM)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/sulamerica-pme-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/sulamerica-pme-feed.mp4)
```

Geometria por formato nas chamadas `pick(story, feed)` de `tools/build.mjs`; tempos de
`assets/voice/vo.words.json`; grupos de legenda na lista `CAP` (texto exibido + índices das
palavras). Masterização (−14 LUFS):
`ffmpeg -i renders/sulamerica-pme-story.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Áudio (ElevenLabs)

- **Voz**: Eleven v4, "Kaique – VSL Conversational & Persuasive" (pt-BR, conversacional e
  espontânea), com tags de reação no texto: `[curious]`, `[surprised]` no "Sério?!",
  `[laughs softly]`, `[excited]`, `[impressed]` no "já com IOF, hein!", `[warmly]`,
  `[chuckles]`, `[softly]`, `[cheerful]`. Até "…e sem taxa de inscrição" é a tomada 2A
  (`assets/voice/vo.raw.mp3`); dali em diante, a tomada do CTA de formulário
  (`assets/voice/takes/cta-formulario.mp3`), mesma voz e mesmas tags, emendada no silêncio que já
  existia (30,95 s), com o "Quer saber" no mesmo instante de antes.
- **Tempos**: Scribe v1 sem texto de referência na 2A (`assets/voice/takes/vo-2A.words.json`). A
  tomada do CTA foi gravada quando os créditos do ElevenLabs acabaram, sem Scribe: as frases que
  ela repete da 2A foram alinhadas a ela por DTW (MFCC) e herdaram os tempos; "Preenche o
  formulário" e "Toca no botão aqui embaixo e faz a sua cotação" foram marcados à mão no envelope
  (`tools/align_words.py`).
- **Efeitos** (Sound Effects v2): impacto, whoosh, riser, contador, checks, brilho, carimbo,
  toque, cartão, bolha (`pop`) e reação de surpresa (`boing`).
- **Trilha**: sintetizada em `tools/synth_audio.py`, leve: pad claro no gancho, drop no logo,
  respiro na pergunta, refrão a partir do formulário (contido enquanto ele fala) e acorde final no
  "faz a sua cotação".

## Assets

- `assets/img/logo-wave.png`, `logo-text.png`: logo oficial da SulAmérica (do projeto
  `sulamerica-reels-15s`), onda laranja + nome em branco.
- Tipografia: Montserrat (500–900) e Poppins.
