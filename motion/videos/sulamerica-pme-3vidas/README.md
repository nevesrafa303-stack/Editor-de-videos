# SulAmérica PME — 3 vidas por R$ 1.770,30/mês com IOF, na voz do corretor (44 s)

Anúncio de 44 s, 30 fps, em dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Conteúdo entre 260 e 1340 px,
  legendas em 1390–1500 px; nada importante nos 230 px de cima nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (legendas em 950–1040 px).

Feito com HyperFrames + GSAP a partir da cotação enviada (`assets/ref/cotacao-sulamerica.jpg`) e
do roteiro do cliente (usados só como fonte de informação). Voz, transcrição e efeitos pelo
ElevenLabs (flow "SulAmérica PME 3 vidas — locução humana").

## Roteiro (fala em 1ª pessoa, com reações)

| Tempo | Cena | Fala | Motion |
|---|---|---|---|
| 0–8,7 s | Gancho | "Ei… você tem CNPJ? E ainda não tem plano de saúde empresarial? Sério?! *(risada)* Então presta atenção." | cartão CNPJ sobe e ganha check; cartão "Plano de saúde empresarial" chega com a caixa vazia e um "?"; balão "Sério?!" e rosto surpreso; a risada sacode o balão e solta "haha" |
| 8,6–18,0 s | Oferta | "Olha só: SulAmérica PME pra três vidas por R$ 1.770,30 por mês… já com IOF, hein!" | onda do logo se desenha; PME + selo "Capital / 03 a 04 vidas", "Apólice 12 meses"; 3 pessoas; cada dígito do preço rola e para quando é dito; carimbo "JÁ COM IOF" |
| 17,8–24,5 s | Cotação | "É pra uma pessoa de 0 a 18 anos, uma de 29 a 33 e outra de 34 a 38." | recibo "Sua cotação": as faixas entram quando são ditas, com o valor de cada uma; Total R$ 1.729,15, IOF 2,38% (+ R$ 41,15), Total com IOF R$ 1.770,30; sem taxa de inscrição |
| 24,3–31,1 s | Benefícios | "Tem abrangência nacional, apartamento, coparticipação, reembolso… e sem taxa de inscrição." | "Especial Vital QP R1 — E ainda tem:", cinco linhas com check verde no instante de cada uma |
| 31,0–33,0 s | Pergunta | "Quer saber se você pode contratar?" | lupa passando sobre o cartão CNPJ; "Você pode contratar?" |
| 32,8–37,1 s | WhatsApp | "Me chama no WhatsApp que eu te ajudo a ver as condições pra você e pra sua família." | celular com a conversa: mensagem do cliente, "digitando…", resposta do consultor |
| 36,9–44 s | CTA | "Não deixa pra pensar na saúde só quando precisar, tá? Clica no botão e fala comigo!" | logo, "Cuide da saúde antes de precisar", cartão do preço, botão verde "Fale comigo no WhatsApp" com toque e pulsos, texto legal |

Legendas palavra a palavra em todo o vídeo (palavra falada em laranja), para quem assiste sem som.

### De onde vem cada informação

Da cotação: SulAmérica PME | Capital – 03 a 04 vidas – Apólice 12 meses; Especial Vital QP R1,
compulsório, 30% de coparticipação, reembolso; acomodação apartamento; abrangência nacional;
sem taxa de inscrição; IOF de 2,38%; 0 a 18 R$ 379,08, 29 a 33 R$ 652,21, 34 a 38 R$ 697,86;
total R$ 1.729,15; total + IOF R$ 1.770,30. O IOF em reais (R$ 41,15) é a diferença entre os
dois totais. Do roteiro: gancho, CTA de WhatsApp e "verificar as condições de contratação".
O número de registro na ANS não foi incluído (confirme qual operadora do grupo emite esse
produto antes de acrescentar).

## Gerar de novo

```bash
bash tools/prep_voice.sh            # locução: passa-altas, compressão leve, presença
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
  `[chuckles]`, `[softly]`, `[cheerful]`. Primeira versão do texto saiu com 47 s; o texto foi
  enxugado e regravado (41,9 s, ritmo natural, sem acelerar). Ficou a tomada com mais variação
  de tom no gancho. Original em `assets/voice/vo.raw.mp3`.
- **Tempos**: Scribe v1 sem texto de referência (confirma "mil setecentos e setenta reais e
  trinta centavos" e as faixas etárias).
- **Efeitos** (Sound Effects v2): os dos anúncios anteriores mais dois novos: bolha de
  mensagem (`pop`) e reação de surpresa (`boing`).
- **Trilha**: sintetizada em `tools/synth_audio.py`, leve: pad claro no gancho, drop no logo,
  respiro na pergunta, refrão no WhatsApp.

## Assets

- `assets/img/logo-wave.png`, `logo-text.png`: logo oficial da SulAmérica (do projeto
  `sulamerica-reels-15s`), onda laranja + nome em branco.
- Tipografia: Montserrat (500–900) e Poppins.
