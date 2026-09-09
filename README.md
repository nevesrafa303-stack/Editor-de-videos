# Editor de vídeo — talking head → Reels/TikTok 9:16

Pipeline **100% local e reproduzível** que transforma uma gravação crua de
talking head (câmera, geralmente 4K, com múltiplos takes e conversa de
bastidor) num vídeo final **1080×1920, 30fps, 45–90s**, pronto para Instagram
Reels e TikTok.

**Stack:** FFmpeg (análise e áudio) + Whisper (transcrição com word timestamps)
+ Remotion (toda a montagem visual e o render). Sem editor de GUI, sem serviço
externo. Mesmo bruto → mesmo vídeo.

O pipeline é **universal**: serve para qualquer nicho (advogado, médico,
psicólogo, mentor, produtora, criador). Tudo que é específico do vídeo —
palavras-chave, listas, estrutura do roteiro — é extraído da própria
transcrição. A identidade visual vem do **theme**.

---

## Como usar

```bash
npm install
node scripts/00_fonts.mjs          # uma vez por máquina: baixa as fontes p/ public/fonts

cp SEU_VIDEO.mov assets/raw/
npm run all                        # pipeline completo, do bruto ao QC
```

`npm run all` para uma vez depois da transcrição para você escrever as
correções (Etapa 1.6). O resultado sai em **`out/final.mp4`** e o relatório em
**`out/relatorio.json`**.

### Etapas isoladas

| Comando | Etapa | O que faz |
|---|---|---|
| `npm run fonts` | 0 | Baixa Montserrat/Playfair/Lora para `public/fonts` (uma vez) |
| `npm run analyze` | 1 | `ffprobe` (incl. **rotação**), áudio 16k, folhas de contato, `silencedetect` |
| `npm run transcribe` | 1.3 | Whisper `small`, pt, **word timestamps** → `data/transcript.json` |
| `npm run mezzanine` | 4.1 | Rotação normalizada + **color grade embutido**, 1620×2880 |
| `npm run edl` | 2 | Decupagem → `data/edl.json` + `src/generated/data.json` |
| `npm run audio` | 3 | Corte sample-accurate, cadeia de voz, **−14 LUFS**, trilha |
| `npm run sfx` | 3.4 | Sintetiza a paleta e **calibra os ganhos contra a voz** |
| `npm run render` | 5.1 | Render Remotion + limiter de true peak com re-mux |
| `npm run qc` | 5.2 | QC obrigatório, **com prova medida dos SFX** |
| `npm run studio` | — | Preview interativo (`remotion studio`) |
| `npm run verify` | — | Regressão ponta a ponta com bruto sintético |

**A ordem importa.** A calibragem dos SFX é *relativa à voz já tratada*, então
`06_sfx` roda depois de `05_audio`; e a EDL roda duas vezes — a primeira gera o
plano de áudio, a segunda incorpora os ganhos calibrados e a faixa final.
`run_all.sh` já faz isso.

---

## Requisitos

- **FFmpeg/ffprobe** — `brew install ffmpeg` (macOS) ou `apt install ffmpeg`
- **Node 18+**
- **Whisper** — `pip install -U openai-whisper` (só para `npm run transcribe`).
  Na primeira execução ele baixa os pesos do modelo. Se a sua rede bloquear
  esse download, baixe numa máquina com acesso e aponte a pasta:
  `WHISPER_MODEL_DIR=~/.cache/whisper npm run transcribe`
- **Chrome/Chromium** para o render. O Remotion baixa o seu; se a rede
  bloquear, aponte um binário existente:
  `REMOTION_BROWSER=/caminho/para/chrome npm run render`

---

## Arquivos que você fornece

| Onde | O quê | Se faltar |
|---|---|---|
| `assets/raw/` | o vídeo bruto | **obrigatório** |
| `assets/music/` | trilha instrumental | segue sem música, e o relatório registra a pendência |
| `public/broll/` | B-roll próprio (`.mp4`) | cai para painel de lista / tipografia (hierarquia da Etapa 4.6) |
| `public/logo.png` | logo do apresentador | end card usa nome + título em tipografia |
| `data/corrections.json` | correções da transcrição | nenhuma correção é aplicada |
| `data/overrides.json` | decisões editoriais manuais | tudo é decidido automaticamente |

Veja `data/corrections.example.json` e `data/overrides.example.json`.

---

## Etapa 0 — Theme

`src/theme.ts` parametriza toda a estética. O preset é deduzido do vocabulário
da transcrição (`detectarPreset`) ou fixado em `overrides.themePreset`.

| | `autoridade` (default) | `editorial` | `acolhedor` |
|---|---|---|---|
| Nicho | advogado, médico, financeiro | produtora, criador, lifestyle | psicólogo, terapeuta, educador |
| Fonte da legenda | Montserrat Medium | Playfair Display | Lora **itálico** |
| Caixa | minúsculas, sem pontuação final | frase normal com pontuação | minúsculas |
| Keyword | CAPS **branco com glow** | CAPS na cor da marca | CAPS branco simples |
| Cor de destaque | `#FFFFFF` | `#E53935` | `#FFFFFF` |
| Fundo de insert | `#0E0E10` | `#F4F2ED` | `#F4F2ED` |

O padrão dominante de keyword em vídeo de autoridade é **branco com glow**, não
vermelho neon — vermelho é opção de marca ou ênfase pontual.

---

## Etapa 2 — Decupagem

`scripts/lib/decupagem.mjs` + `scripts/lib/text.mjs`. O que o motor decide:

- **Bastidor removido** — metafala ("deixa eu repetir", "tá muito lento",
  "testando"), interjeição isolada, tosse.
- **Takes colados separados** — quando o bastidor está grudado no take refeito
  (o caso normal), o corte real é procurado *primeiro na fronteira de silêncio*
  da Etapa 1.5, depois na maior pausa entre palavras. Jogar a fala inteira fora
  levaria junto o melhor take.
- **Takes repetidos** — similaridade de bag-of-words ≥ 0,7 entre falas
  próximas; fica o mais completo, e no empate o último.
- **Frases quebradas** — fala que termina em conectivo/preposição não entra.
- **Pausas apertadas** — corte acima de ~0,4 s, com **3 frames de folga** em
  cada ponta para não comer ataque nem cauda.
- **Ritmo 2–5 s por corte** — falas curtas contíguas são unidas; falas longas
  viram cortes secos *contíguos* (sem remover áudio), só para o ritmo visual.
- **Meta de duração 45–90 s** — o aperto remove primeiro as falas de menor
  densidade de informação, nunca gancho, ressalva, CTA ou afirmação categórica.

Cada fala é classificada (`gancho`, `ressalva`, `cta`, `enumeracao`,
`conceitual`, `comando`, `categorica`, `pergunta`) e é essa classificação que
decide onde entram zoom de ênfase, B-roll, motion e pilhas de keyword.

Revise sempre `data/edl.json` — é a EDL em formato legível — e o
`data/report.json`, que lista **cada trecho descartado com o motivo**.

---

## Etapa 3 — Áudio

1. Corte e concatenação **sample-accurate** (`atrim`, não seek por keyframe).
2. Voz: `highpass=80` → de-esser (−3 dB em 6,5 kHz) → `acompressor
   threshold=-18dB:ratio=3:attack=5:release=120` → **`loudnorm I=-14 TP=-1.5
   LRA=7` em duas passadas** (mede, depois aplica com os valores medidos).
3. Trilha ~20 dB abaixo da voz, com fade-in, **subindo 8 dB no end card** (onde
   não há fala) e fade-out final.
4. **SFX calibrados por medição** — veja abaixo.
5. True peak: se o render passar de −1,0 dBTP, `alimiter` + **re-mux
   (`-c:v copy`)**, sem re-render.

### SFX: calibrar e provar têm de medir a mesma coisa

Esta foi a lição mais cara do pipeline. Calibrar o ganho por RMS de **banda
larga** e depois provar por RMS de **banda estreita** mede duas grandezas
diferentes: o efeito passa na calibragem e **some no render**.

Por isso banda, janela e alvo vivem num único lugar —
`scripts/lib/sfx_spec.mjs` — usado tanto por `06_sfx.mjs` (calibragem) quanto
por `08_qc.mjs` (prova). E o alvo é **relativo à voz daquele vídeo**, porque
"perceptível mas abaixo da voz" não significa nada em valor absoluto.

| Efeito | Banda de assinatura | Por quê |
|---|---|---|
| `hit` | 40–85 Hz | a voz leva highpass em 80 Hz; essa faixa fica livre |
| `whoosh` | 1,2–4,5 kHz | ruído em movimento, acima do corpo da voz |
| `pop` | 2,2–3,2 kHz | um tick é *brilhante*; em 900 Hz ele some no miolo da voz |
| `riser` | 4–9 kHz | "ar" agudo; em 150–900 Hz fica enterrado na fala |

O ganho é o que leva a contribuição do efeito a ~+10 dB sobre a voz *naquela
banda*, limitado por dois tetos: o efeito nunca passa de 6 dB abaixo da voz em
banda larga, e o pico nunca passa de −3 dBFS. Se um teto impedir os +6 dB
exigidos pelo QC, `06_sfx.mjs` avisa **antes** do render.

Todo texto que aparece na tela tem SFX no frame exato: hit por keyword, pop por
item de lista, whoosh na entrada de insert/motion e nos zooms de ênfase, riser
sob o gancho.

---

## Etapa 4 — Montagem (Remotion)

```
src/
  Reel.tsx                     composição principal, ordem de empilhamento
  theme.ts                     Etapa 0
  types.ts                     contrato entre os scripts Node e o Remotion
  fonts.ts                     registro das fontes locais (sem rede no render)
  components/
    VideoLayer.tsx             reframe 9:16, trimBefore, punch-in, creep
    Captions.tsx               4.4
    KeywordStack.tsx           4.5 gancho e listas de comando
    Inserts.tsx                4.6 B-roll, mockup, painel de lista
    MotionGraphics.tsx         4.7 cinética, pictogramas, contador, colunas, checklist
    QuestionCard.tsx           4.8
    EndCard.tsx                4.9
    Effects.tsx                flash branco e fade to black
```

- **Reframe** — o mezzanine já chega vertical, com grade embutido, a 1620×2880
  (1,5× do final) para o zoom máximo de 135% não perder qualidade.
- **Punch-in** — alterna 100% ↔ 118%, **nunca dois segmentos seguidos na mesma
  escala**, com micro-`translateX` de ±1,5–2,5% e creep zoom em segmentos > 6 s.
- **Zoom de ênfase** — corte seco para ~128% na afirmação categórica, na
  ressalva ou na virada, 2 a 4 vezes por vídeo, com whoosh. Dois zooms colados
  são desfeitos automaticamente.
- **Legendas** — 40 px, 2–5 palavras, **55% da altura**, fade de 3 frames.
  Ocultas quando outro elemento já mostra o texto falado (insert tipográfico,
  painel, motion, pilha de comandos). No gancho elas convivem com as keywords,
  que ficam num trilho vertical separado (38%).
- **Inserts e motion entram junto com o conteúdo** — ancorados 4 frames antes do
  primeiro item, nunca com o fundo vazio no ar.

---

## Etapa 5 — QC

`npm run qc` mede o arquivo renderizado e **falha com exit 1** se algo não
passar. Nada aqui é "confia no código":

| Check | Critério |
|---|---|
| QC1 | 1080×1920, 30 fps, duração 45–90 s |
| QC2 | −14 LUFS ±1, **true peak ≤ −1,0 dBTP**, LRA ≤ 9 |
| QC3 | **SFX provados por medição**: RMS na banda do efeito no render vs. o mesmo trecho da voz pura, **≥ +6 dB** |
| QC4 | Nenhuma palavra corrigida vazando na legenda; sincronia em 3 pontos; blocos de até 5 palavras |
| QC5 | Ritmo 2–5 s; punch-in alternando; 2–4 zooms de ênfase; motion presente; end card ≥ 3 s; keywords no gancho |

O QC também escreve `out/qc/contact_*.png` — a folha de contato do resultado,
para a inspeção visual que nenhuma medição substitui.

---

## Verificação

`npm run verify` roda o pipeline inteiro sobre um bruto **sintético** gerado por
`scripts/dev/make_fixture.mjs` — 4K com `rotation 90`, áudio com energia nos
tempos de fala, e um roteiro que cobre de propósito bastidor, take repetido,
frase quebrada, gancho com palavras de impacto, enumeração, trecho conceitual,
lista de comandos e CTA. Não precisa de gravação real nem do Whisper.

É assim que se checa uma mudança no motor de decupagem sem esperar um render de
vídeo real.
