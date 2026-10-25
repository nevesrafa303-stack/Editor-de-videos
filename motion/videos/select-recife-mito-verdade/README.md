# Select Recife — variação 2, "Mito ou verdade" (42 s)

Segunda variação do motion da saída da Select de Recife, para testar contra
`../select-recife-hospitais` (narrativa dor → virada) e `../select-recife-carteirinha` (troca de
carteirinha). É um quiz com três afirmações. Cada uma entra num cartão de citação e leva o carimbo
MITO ou VERDADE na hora em que a palavra é falada. A resposta aparece embaixo. Dois formatos com o
mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Conteúdo entre 246 e 1350 px; nada nos
  230 px de cima nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/`.

## Roteiro

| Tempo | Fala | Na tela |
|---|---|---|
| 0–3,7 s | "A Select saiu de Recife. Mito ou verdade?" | "Recife · PE"; "A Select saiu" já no quadro 0, "de Recife." bate quando é dito; botões MITO e VERDADE? |
| 3,7–15,5 s | "Se a Select saiu, eu perdi o meu hospital. Mito! Existem planos com atendimento no Real Hospital Português, no Santa Joana e em outros hospitais de referência do Recife." | rodada 1/3: a afirmação entra palavra por palavra; carimbo MITO! (e drop da trilha); um cartão com check para cada hospital, no momento em que é dito |
| 15,5–28,1 s | "Todo plano tem os mesmos hospitais. Mito! A rede muda de um plano pro outro. Por isso o consultor compara as operadoras e encontra o plano que mantém os seus hospitais de confiança." | rodada 2/3: carimbo MITO!; três planos genéricos (A, B, C), cada um com uma rede diferente; a lupa passa por eles e o plano B (os dois hospitais) se destaca no "mantém" |
| 28,1–32,1 s | "Dá pra trocar de plano sem trocar de hospital? Verdade!" | rodada 3/3: carimbo VERDADE!; fotos dos dois hospitais com check |
| 32,1–42 s | "A Select saiu. O Português fica. Toca no botão aqui embaixo e preenche o formulário." | "~~A Select saiu.~~ O Português fica. Troque de plano, não de hospital."; fotos; botão "Fale com um consultor / Preencha o formulário"; setas "Toque no botão abaixo"; texto legal |

### Cuidados na comunicação (do brief)

- **Sem promessa de preço**: o vídeo não cita valor, nem "mesmo preço", nem "mais barato".
- **Sem identidade da Select**: o nome aparece só em texto simples; não há logo. A paleta é própria
  (azul-noite e dourado; vermelho no carimbo MITO, verde no VERDADE).
- **Observação obrigatória do brief**: "Consulte a disponibilidade da rede hospitalar. A rede
  credenciada pode variar conforme plano contratado." entra por escrito nas rodadas com hospitais e
  no cartão final. Como manda o CLAUDE.md da raiz, as observações não vão para a locução.
- O segundo "mito" ("Todo plano tem os mesmos hospitais.") vem da própria observação obrigatória:
  a rede credenciada pode variar conforme o plano. Os planos A, B e C são genéricos e não
  representam operadoras reais.

### Observações obrigatórias de segurança comercial (CLAUDE.md da raiz)

Só por escrito, com o texto exato, em letra pequena (20 px no story, 16 px no feed):

| Cena | Observações |
|---|---|
| Rodada 1 (hospitais, fotos) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Rodada 2 (operadoras, fotos) | Consulte condições e elegibilidade. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Rodada 3 (fotos dos hospitais) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Cartão final | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Imagem meramente ilustrativa. |

### De onde vem cada informação

Todo o texto, na tela e na fala, vem do brief "A saída da Select de Recife". A exceção é o segundo
"mito", que vem da observação obrigatória, como explicado acima. A saída da Select de Recife é uma
informação do cliente: em 25/10/2026 não encontrei comunicado oficial (ver
`../select-recife-hospitais/README.md`). Confirme antes de veicular.

## Gerar de novo

```bash
python3 -I tools/voice.py           # locução HeyGen numa tomada (cache em assets/voice/vo.json)
python3 -I tools/synth_audio.py     # efeitos + trilha presa à locução; grava tools/grid.json
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/select-mito-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/select-mito-feed.mp4)
```

`tools/build.mjs` reaproveita o fundo, as observações e o cartão final da versão 1. As três rodadas
saem de `roundScene()`, e os tempos de `at()`/`seq()` sobre `assets/voice/vo.words.json`. A
duração e as âncoras da trilha vêm de `tools/grid.json`. Masterização em −14 LUFS, com loudnorm em
duas passadas, AAC 256k e faststart.

## Áudio

- **Locução**: HeyGen, voz "Sofia Brazil – Excited" (pt-BR), velocidade 1,12, numa tomada só, com
  pausas nas viradas (`GAP_AFTER`). O ElevenLabs estava sem créditos.
- **Trilha** sintetizada em `tools/synth_audio.py` (~94 BPM):
  - tensão em Lá menor no gancho;
  - subida em Sol;
  - drop em Dó maior no primeiro "Mito!";
  - groove leve nas três rodadas;
  - refrão no "A Select saiu. O Português fica.";
  - acorde final depois do "preenche o formulário".
- **Carve** com força 0,35. A voz fica 15 a 23 dB acima do fundo (faixa de 200 a 4000 Hz).
- **Efeitos** (ElevenLabs Sound Effects v2, da versão 1): carimbo em cada MITO/VERDADE, impacto,
  cartão, checks, pop, whoosh, brilho e chime.

## Assets

As fotos dos hospitais da versão 1 (`assets/img/`), só com enquadramento e zoom lento, sem
tratamento de cor. Tipografia: Montserrat e Poppins.
