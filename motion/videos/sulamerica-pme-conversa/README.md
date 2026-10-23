# SulAmérica PME — variação "conversa em áudios" (45,6 s)

Segunda versão do anúncio SulAmérica PME para 3 vidas (R$ 1.770,30/mês com IOF), para testar
contra `../sulamerica-pme-3vidas`. A peça inteira é uma conversa: a cliente manda áudios
perguntando e o consultor responde por áudio, com a mesma voz da versão 1. Dois formatos com o
mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Cabeçalho da conversa a partir de 260 px,
  legendas em 1334–1482 px; nada importante nos 230 px de cima nem abaixo de 1536 px (só a barra
  "Mensagem", decorativa).
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (legendas em 862–986 px).

Feito com HyperFrames + GSAP a partir da cotação enviada (`assets/ref/cotacao-sulamerica.jpg`).
Vozes, transcrição e efeitos pelo ElevenLabs (flow "SulAmérica PME — variação conversa em áudios").

**CTA para formulário**: os anúncios rodam com formulário de cadastro, então a última resposta do
consultor manda tocar no botão do anúncio e preencher o formulário (não há mais menção a WhatsApp).

## Roteiro

| Tempo | Quem | Fala | Na tela |
|---|---|---|---|
| 0,5–8,2 s | Cliente | "Oi! Tudo bem? Eu tenho CNPJ… será que eu consigo um plano de saúde empresarial pra minha família?" | conversa com o "Consultor SulAmérica PME"; o áudio dela toca (onda verde avançando); selo "Tem CNPJ? Ouve essa conversa" |
| 8,7–21,1 s | Consultor | "Oi! Consegue sim! Olha só a cotação que eu fiz pra você: SulAmérica PME, três vidas, por R$ 1.770,30 por mês… já com IOF!" | "gravando áudio…" no cabeçalho; áudio dele (onda laranja); chega o anexo da cotação, que abre em zoom: logo, PME + Capital/03 a 04 vidas, 3 pessoas, preço rolando dígito a dígito no ritmo da fala, carimbo "JÁ COM IOF" |
| 21,4–23,9 s | Cliente | "Sério?! Pra três pessoas?!" | reação de surpresa no anexo, a conversa dá um soquinho |
| 24,4–33,1 s | Consultor | *(risada)* "Sério! Pra essas idades aqui, ó. Abrangência nacional, apartamento, coparticipação, reembolso… e sem taxa de inscrição!" | a cotação abre de novo: faixas 0 a 18, 29 a 33 e 34 a 38 com os valores, circuladas a caneta no "essas idades aqui, ó"; total com IOF; cada benefício entra quando é dito |
| 33,4–35,4 s | Cliente | "Amei! E como é que eu faço?" | coração no áudio do consultor |
| 35,9–43,0 s | Consultor | "Preenche o formulário que eu te ajudo a ver as condições pra você e pra sua família. Toca no botão aqui embaixo e faz a sua cotação!" | chega o cartão "Formulário de cotação" (Nome, Telefone, E-mail), os campos acendem enquanto ele fala e o dedo toca "Preencher formulário"; no "Toca no botão" entra o cartão final: logo, "Tem CNPJ? Faça sua cotação", preço, botão "Preencha o formulário" e, no "aqui embaixo", setas "Toque no botão abaixo" descendo para o botão do anúncio; texto legal |

Legendas palavra a palavra em todo o vídeo, com etiqueta de quem fala (CLIENTE em verde,
CONSULTOR em laranja), para quem assiste sem som. As barras de cada bolha de áudio são a forma de
onda real daquela fala.

### De onde vem cada informação

Da cotação: SulAmérica PME | Capital – 03 a 04 vidas – Apólice 12 meses; Especial Vital QP R1,
compulsório, 30% de coparticipação, reembolso; acomodação apartamento; abrangência nacional;
sem taxa de inscrição; IOF de 2,38%; 0 a 18 R$ 379,08, 29 a 33 R$ 652,21, 34 a 38 R$ 697,86;
total R$ 1.729,15; total + IOF R$ 1.770,30. O número de registro na ANS não foi incluído
(confirme qual operadora do grupo emite esse produto antes de acrescentar). Nomes e horários da
conversa e os campos do formulário na tela são ilustrativos.

## Gerar de novo

```bash
python3 -I tools/prep_voice.py      # corta as falas das tomadas, nivela as vozes, monta a conversa
python3 -I tools/synth_audio.py     # efeitos do ElevenLabs cortados no golpe + trilha (~97 BPM)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/sulamerica-conversa-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/sulamerica-conversa-feed.mp4)
```

Os cortes das falas ficam em `LINES` de `tools/prep_voice.py` (caem nos silêncios de cada tomada) e
os respiros entre um áudio e outro em `GAP`. Geometria por formato nas chamadas `pick(story, feed)`
de `tools/build.mjs`; ordem e altura das bolhas em `MSG`/`HG` (a rolagem da conversa é calculada a
partir delas); grupos de legenda na lista `CAP`. Masterização (−14 LUFS):
`ffmpeg -i renders/sulamerica-conversa-story.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Áudio (ElevenLabs)

- **Vozes** (Eleven v4, duas tomadas de cada, ficou a A nas duas):
  - cliente: "Adriane" (pt-BR, calorosa e natural), com `[curious]`, `[hesitant]`, `[surprised]`,
    `[excited]`;
  - consultor: "Kaique – VSL Conversational & Persuasive", com `[warmly]`, `[cheerful]`,
    `[impressed]`, `[laughs]`, `[confident]`.
  Originais em `assets/voice/takes/`. A última resposta (CTA do formulário) junta duas frases da
  tomada `cta-formulario`, gravada com a mesma voz para a versão 1 (os créditos do ElevenLabs
  acabaram antes de uma tomada própria).
- **Tempos**: Scribe v1 sem texto de referência (`takes/*.words.json`), conferindo
  "mil setecentos e setenta reais e trinta centavos"; os da tomada do CTA vêm do alinhamento em
  `../sulamerica-pme-3vidas/tools/align_words.py` (DTW contra a locução original + marcação manual).
- **Efeitos** (Sound Effects v2): os das versões anteriores (bolha, toque, cartão, contador,
  carimbo, checks, whoosh, brilho, impacto, reação) mais um novo: notificação de mensagem
  recebida (`chime`), a cada áudio do consultor.
- **Trilha**: sintetizada em `tools/synth_audio.py` (a conexão do ElevenLabs deste ambiente não
  gera música), lo-fi leve: piano sozinho na pergunta da cliente, groove a partir da primeira
  resposta, respiro no "Amei! E como é que eu faço?", refrão na resposta do formulário (contido
  enquanto ele fala, cresce quando termina).

## Assets

- `assets/img/logo-wave.png`, `logo-text.png`: logo oficial da SulAmérica (do projeto
  `sulamerica-reels-15s`), onda laranja + nome em branco; a onda também é a foto de perfil do
  consultor.
- Tipografia: Montserrat (500–900) e Poppins.
