# Amil — 50% na 1ª e na 2ª mensalidade (PME): "Metade." (39 s)

Anúncio de 39 s, 30 fps, locução contínua, em dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Nada importante nos 230 px de cima
  nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/` (assets e node_modules por link).

Feito com HyperFrames + GSAP a partir das peças da campanha "Outubro 20/10 Amil 50%" (Drive) e
das regras da Amil para corretores (`assets/ref/`).

## Roteiro

| Tempo | Cena | Locução | Motion | Som |
|---|---|---|---|---|
| 0–6,4 s | Gancho | "Metade. É isso que você paga nas duas primeiras faturas do plano de saúde Amil para CNPJ." | fatura entra, corte a laser no "Metade.", metade sai voando, tremida; frase palavra a palavra com o logo | carimbo, laser, papel rasgando, impacto |
| 6,4–10,6 s | Desconto | "Cinquenta por cento de desconto na primeira e na segunda mensalidade." | anel neon + contador até 50%; faturas 1ª e 2ª: mensalidade 100% riscada, −50%, você paga 50%, selo 50% OFF | drop da trilha, tiques, cartões, carimbos |
| 10,5–14,7 s | Quem | "Para empresas de São Paulo e do Rio, de duas a noventa e nove vidas." | chips SP e RJ, contador 2 → 99 e grade de 99 pessoas acendendo | pops, tiques acelerando |
| 14,6–19,3 s | Linhas | "Nas linhas Bronze, Prata, Ouro, Platinum e Amil Black." | cartões metálicos entram um a um, o Black por cima | cartas |
| 19,2–24,6 s | Hospital | "E no Amil Black, você tem acesso ao Albert Einstein, ao Sírio-Libanês e ao Fleury." | o cartão Black cresce e se abre na fachada do Hospital Israelita Albert Einstein; chips Sírio-Libanês e Fleury; apartamento, cobertura nacional, assistência viagem internacional | brilho, pops |
| 24,6–29,3 s | Urgência | "Mas atenção: a oferta vale só para contratos fechados em outubro." | selo ATENÇÃO, calendário de outubro/2026 acendendo até o 31 (último dia) | alerta, tique dos dias, impacto |
| 29,1–39 s | CTA | "Faça agora sua simulação gratuita, cem por cento online. Toque no botão e fale com um especialista." | a peça ADS01 se monta (anel 50%, Planos de Saúde para CNPJ, a partir de 2 vidas, botão); o dedo toca o botão; pulsos; 1,4 s final parado | refrão, pop, toque |

### De onde vem cada informação

- 50% na 1ª e na 2ª mensalidade/fatura, a partir de 2 vidas, contratações em outubro, simulação
  gratuita 100% online e o rodapé: peças da campanha (ADS01, v3, e4, e6).
- PME de 2 a 99 vidas, linhas Amil Bronze, Prata, Ouro, Platinum e Amil Black I e II, SP e RJ,
  até 31/10: regras da Amil para corretores (`assets/ref/regras-corretor.jpg`).
- Acesso ao Albert Einstein, Sírio-Libanês e Fleury, apartamento, cobertura nacional e
  assistência viagem internacional: peças Amil Black do Drive (ADS03/ADS04). No vídeo aparecem
  marcadas como "Linha Amil Black · rede conforme o plano contratado".
- Nenhum preço é mostrado; os valores das faturas aparecem mascarados.

## Gerar de novo

```bash
python3 -I tools/prep_assets.py     # foto do Einstein sem o selo da corretora, fundo desfocado, logo Amil
python3 -I tools/voice.py           # locução HeyGen numa tomada só (cache em assets/voice/vo.json)
python3 -I tools/synth_audio.py     # trilha (Fá# menor -> Lá maior, drop no "Cinquenta") + efeitos
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/amil-50off-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/amil-50off-feed.mp4)
```

A geometria de cada formato fica nas chamadas `pick(story, feed)` de `tools/build.mjs`; os
tempos saem de `assets/voice/vo.words.json`. Neste container o Chrome vem de
`HYPERFRAMES_BROWSER_PATH` e o GSAP de `assets/vendor/`. Masterização (−14 LUFS):
`ffmpeg -i renders/amil-50off-story.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.6:LRA=9,aresample=48000" -c:a aac -b:a 256k -movflags +faststart saida.mp4`

## Assets

- `assets/img/einstein.png`: fachada do Hospital Israelita Albert Einstein, recortada da peça
  Amil Black do Drive abaixo do selo da corretora (o vídeo é sem marca de corretora).
- `assets/img/amil-logo.png`: logo Amil (alfa) extraído da peça ADS01; no vídeo é usado como
  máscara para aparecer branco ou índigo.
- Tipografia: Sora (geométrica, como a das peças) e Instrument Serif itálica nas palavras de
  destaque ("Metade.", "vidas", "Albert Einstein", "outubro.").
- Locução: HeyGen "Sofia Brazil – Friendly" (pt-BR), velocidade 1,1.
