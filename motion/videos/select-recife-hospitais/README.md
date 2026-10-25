# "A Select saiu. O Português fica." — motion graphics com locução (45,9 s)

Anúncio em motion graphics feito a partir do brief "A saída da Select de Recife" e de 4 fotos dos
hospitais (Real Hospital Português e Hospital Santa Joana). Tem locução em uma tomada só, e cada
texto entra na palavra falada. A primeira versão, sem locução (32,5 s, só texto, trilha e efeitos),
está no commit `03e062f`. Dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Conteúdo entre 260 e 1470 px; nada nos
  230 px de cima nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/`.

O CTA junta a chamada do brief ("Fale com um consultor") com o formulário de cadastro dos anúncios:
o botão diz "Fale com um consultor / Preencha o formulário", e as setas "Toque no botão abaixo"
apontam para o botão do anúncio.

## Roteiro

| Tempo | Fala | Na tela |
|---|---|---|
| 0–5 s | "A Select saiu de Recife. E muitas famílias e empresas ficaram sem plano." | "Recife · PE"; "A Select saiu" já no quadro 0, "de Recife." bate quando é dito; carteirinha genérica de plano de saúde leva o carimbo "SEM PLANO" no "sem plano" e fica cinza; "Famílias e empresas ficaram sem plano." |
| 5–14 s | "Mas, mais do que perder o plano, o medo é perder o hospital. Cada dia sem plano é um dia de risco pra família." | foto do Hospital Santa Joana escurecida; "Mais do que perder o plano, o medo é perder o hospital."; "Cada dia sem plano é um dia de risco pra família.", com um contador "DIAS SEM PLANO" subindo |
| 12,8–20,8 s | "Só que presta atenção: a Select saiu. O Português fica. Trocar de plano não significa trocar de hospital." | "A Select saiu." grande no meio, riscado; no drop da trilha (16,3 s) sobe para o topo e entram "O Português fica." e a foto do Real Hospital Português; depois o título vira "Trocar de plano não significa trocar de hospital." |
| 21–27,5 s | "Existem planos com atendimento no Real Hospital Português, no Santa Joana e em outros hospitais de referência do Recife." | "Existem planos com atendimento no:" e um cartão com check para cada hospital, no momento em que é dito |
| 27,9–36 s | "O consultor compara as operadoras e encontra o plano que mantém os seus hospitais de confiança, de acordo com o perfil da sua família ou da sua empresa." | "O consultor compara as operadoras": três planos genéricos (A, B, C) e uma lupa que marca quais têm cada hospital; no "mantém", o plano B (os dois) se destaca; "seus hospitais de confiança"; "família" ou "empresa" |
| 36,5–45,9 s | "Troque de plano, não de hospital. Toca no botão aqui embaixo, preenche o formulário e fala com um consultor." | "~~A Select saiu.~~ O Português fica. Troque de plano, não de hospital."; fotos dos dois hospitais; botão "Fale com um consultor / Preencha o formulário" no "Toca no botão"; setas "Toque no botão abaixo" no "aqui embaixo"; texto legal |

### Cuidados na comunicação (do brief)

- **Sem promessa de preço**: o vídeo não cita valor, nem "mesmo preço", nem "mais barato".
- **Sem identidade da Select**: o nome aparece só em texto simples, na tipografia e nas cores do
  vídeo; não há logo. A paleta é própria (azul-noite e dourado, com coral na parte da dor). O
  manual de marca da Select não foi encontrado, então as cores não puderam ser comparadas com as
  dela.
- **Observação obrigatória do brief**: "Consulte a disponibilidade da rede hospitalar. A rede
  credenciada pode variar conforme plano contratado." entra por escrito em todas as cenas com
  hospital e no cartão final. Como manda o CLAUDE.md da raiz, as observações não vão para a
  locução.
- Os planos A, B e C da cena do consultor são genéricos e não representam operadoras reais.

### Observações obrigatórias de segurança comercial (CLAUDE.md da raiz)

Só por escrito, com o texto exato, em letra pequena sob o conteúdo de cada cena (20 px no story,
16 px no feed):

| Cena | Observações |
|---|---|
| Dor (foto do Santa Joana) | Imagem meramente ilustrativa. · A rede credenciada pode variar conforme plano contratado. |
| Virada (foto do Real Hospital Português) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Saída (cartões dos hospitais) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Consultor (operadoras, família ou empresa) | Consulte condições e elegibilidade. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Cartão final (vale para o vídeo inteiro) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Imagem meramente ilustrativa. |

Não há valor, faixa etária, quantidade de vidas, cobertura nem promoção no vídeo, então as
observações de valor, cobertura e oferta não se aplicam.

### De onde vem cada informação

Todo o texto, na tela e na fala, vem do brief. As frases foram usadas como estão ou só ajustadas
para a fala ("pra família", "Toca no botão aqui embaixo, preenche o formulário"), sem nenhuma
afirmação nova. A saída da Select de Recife é uma informação do cliente. Em 25/10/2026
não encontrei comunicado oficial da Select nem da ANS. Só achei relatos de beneficiários no
Reclame Aqui (julho e agosto de 2026) sobre o Real Hospital Português e o Santa Joana deixarem de
atender o plano. Confirme antes de veicular.

## Gerar de novo

```bash
python3 -I tools/voice.py           # locução HeyGen numa tomada (cache em assets/voice/vo.json), pausas por cena
python3 -I tools/synth_audio.py     # efeitos cortados no golpe + trilha presa à locução (~95 BPM)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/select-recife-voz-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/select-recife-voz-feed.mp4)
```

Os tempos das animações saem de `assets/voice/vo.words.json`, nas chamadas `at()`/`seq()` de
`tools/build.mjs`. Se a locução mudar, tudo acompanha. A trilha usa as mesmas âncoras. A
geometria de cada formato está nas chamadas `pick(story, feed)`, e as observações em `OBS`.
Masterização em −14 LUFS, com loudnorm em duas passadas (medição + `linear=true`), AAC 256k e
faststart.

## Áudio

- **Locução**: HeyGen, voz "Sofia Brazil – Friendly" (pt-BR), velocidade 1,08, numa tomada só. Os
  silêncios entre palavras são encurtados, e as pausas maiores ficam onde a cena vira (`GAP_AFTER`
  em `tools/voice.py`). Os tempos de cada palavra vêm da própria HeyGen. O ElevenLabs (a voz do
  Kaique, dos anúncios SulAmérica) estava sem créditos: restavam 52 e a fala pedia 789.
- **Trilha** sintetizada em `tools/synth_audio.py` (a conexão do ElevenLabs deste ambiente não gera
  música), presa à locução:
  - Lá menor na dor (piano esparso, pad escuro e batida de coração);
  - subida em Sol com rufo no "Só que presta atenção: a Select saiu.";
  - drop em Dó maior no "O Português fica.";
  - groove leve nos hospitais e no consultor;
  - refrão no "Troque de plano";
  - acorde final em Dó depois do "fala com um consultor".
- **Carve** da trilha sob a voz com força 0,35. Com 0,65, a locução, que é contínua, abafava demais
  a música. A voz fica 13 a 21 dB acima do fundo (faixa de 200 a 4000 Hz).
- **Efeitos** (ElevenLabs Sound Effects v2): os mesmos dos anúncios SulAmérica (`assets/audio/src/`):
  impacto, carimbo, cartão, cliques do contador, whoosh, riser, brilho, checks, pop e chime.

## Assets

- `assets/img/real-hospital-portugues.jpg` (1080×783): fachada com o brasão; virada, saída e
  cartão final.
- `assets/img/real-hospital-portugues-2.jpg` (450×318): miniatura nos planos da cena do consultor.
- `assets/img/santa-joana-fachada.jpg` (1080×1440): fundo da dor, saída e cartão final.
- `assets/img/santa-joana-aerea.jpg` (650×409, noturna): miniatura nos planos da cena do
  consultor.
- As fotos de baixa resolução só aparecem pequenas. As fotos não têm tratamento de cor: só
  enquadramento, zoom lento e, na dor, um degradê escuro para o texto ficar legível.
- Tipografia: Montserrat (500–900) e Poppins.
