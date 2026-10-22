# Amil — "Só em outubro": Plano Empresarial com 50% nas duas primeiras mensalidades (32,5 s)

Anúncio de 32,5 s, 30 fps, locução contínua, em dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Nada importante nos 230 px de cima
  nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (assets e node_modules por link).

Feito com HyperFrames + GSAP a partir da peça de outubro (`assets/ref/amil-outubro-story.png`).
Locução, transcrição e efeitos sonoros pelo ElevenLabs (flow "Amil PME 3 vidas — locução e
efeitos", o mesmo do anúncio anterior).

## Roteiro

| Tempo | Cena | Locução (tom) | Motion | Som |
|---|---|---|---|---|
| 0–2,6 s | Gancho | "Atenção: isso aqui só vale em outubro!" (urgente) | selo âmbar ATENÇÃO; frase palavra a palavra; a folha de OUTUBRO 2026 cai virando, "SÓ ESTE MÊS" | alerta, folhas, impacto |
| 2,5–7,9 s | Desconto | "O Plano Empresarial Amil está com 50% de desconto nas duas primeiras mensalidades." (animado) | título, logo; 50% conta e explode em raios; "DE DESCONTO"; cartões 1ª e 2ª mensalidade com carimbo −50% | riser + impacto (drop da trilha), contador, cartas, carimbos |
| 7,8–14,0 s | Preço | "Plano para três vidas, com coparticipação, a partir de R$ 1.123,17." (confiante) | pílula de 2 linhas como na peça; "A PARTIR DE"; cada dígito do preço rola e para quando é dito; chip "50% OFF nas 2 primeiras mensalidades" | whoosh, impacto, contador, brilho |
| 13,9–19,7 s | Composição | "Esse valor é pra uma vida de 18 anos, um adulto de 33 e mais um de até 38." (caloroso) | chip "3 vidas · R$ 1.123,17"; cartões VIDA de 18, ADULTO de 33, ADULTO até 38 com as idades contando | cartas |
| 19,7–21,9 s | CNPJ | "Exclusivo para CNPJ." (sério) | carimbo "EXCLUSIVO PARA CNPJ" | carimbo, respiro da trilha |
| 21,8–25,0 s | Urgência | "Mas corre, porque a promoção termina em 31 de outubro." (urgente) | "Mas corre!"; calendário de outubro/2026 com os dias passando até o 30; o 31 acende em âmbar, "ÚLTIMO DIA"; "A promoção termina em 31/10" | relógio, impacto, carimbo |
| 24,9–32,5 s | CTA | "Toque em Solicite uma cotação personalizada e aproveite os 50% ainda este mês." (animado) | a peça de outubro se monta (topo marinho, pílula, caixa do 50%, EXCLUSIVO PARA CNPJ, textos legais, botão); o dedo toca o botão; selo "SÓ ATÉ 31/10"; pulsos | riser + impacto, refrão, toque |

### De onde vem cada informação

Tudo da peça de outubro: Plano Empresarial a partir de R$ 1.123,17, plano para 3 vidas com
coparticipação, 50% de desconto nas primeiras duas mensalidades, promoção para outubro,
exclusivo para CNPJ, valor referente a uma vida de 18 anos, um adulto de 33 e mais um até 38,
"Cobertura e rede sujeitas à modalidade contratada", "Solicite uma cotação personalizada!".
Acrescentado: o fim da promoção como 31/10 (último dia de outubro) e o registro da Amil na ANS
(nº 326305). Outubro de 2026 começa numa quinta-feira (o calendário segue isso).

## Gerar de novo

```bash
bash tools/prep_voice.sh            # locução: passa-altas, compressão leve, presença
python3 -I tools/synth_audio.py     # efeitos do ElevenLabs cortados no golpe + trilha (~116 BPM)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/amil-outubro-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/amil-outubro-feed.mp4)
```

A geometria de cada formato fica nas chamadas `pick(story, feed)` de `tools/build.mjs`; os
tempos saem de `assets/voice/vo.words.json`. Neste container o Chrome vem de
`HYPERFRAMES_BROWSER_PATH` e o GSAP de `assets/vendor/`. Masterização (−14 LUFS):
`ffmpeg -i renders/amil-outubro-story.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Áudio (ElevenLabs)

- **Locução**: Eleven v4, voz "Nassif – Persuasive Sales & Ads" (pt-BR), com tags de tom:
  `[urgent]` no gancho e no "Mas corre", `[excited]` no desconto e no CTA, `[confident]` no
  preço, `[warmly]` na composição, `[serious]` no CNPJ. Duas tomadas; ficou a B (30,3 s, mais
  energia no CTA). Original em `assets/voice/vo.raw.mp3`.
- **Tempos**: Scribe v1 numa transcrição sem texto de referência (confirma "mil cento e vinte e
  três reais e dezessete centavos" e "31 de outubro").
- **Efeitos** (Sound Effects v2, `assets/audio/src/`): os do anúncio anterior (impacto, whoosh,
  riser, contador, check, brilho, carimbo, toque, cartão) e três novos: alerta, folhas de
  calendário e relógio.
- **Trilha**: sintetizada em `tools/synth_audio.py` (a conexão do ElevenLabs deste ambiente não
  gera música): pré logo após o "Atenção", drop nos 50%, respiro no CNPJ, refrão no CTA.

## Assets

- `assets/img/amil-logo.png`: logo Amil (alfa), usado como máscara branca.
- Tipografia: Montserrat 800/900 (títulos, preço, a mais próxima da peça) e Poppins (texto).
