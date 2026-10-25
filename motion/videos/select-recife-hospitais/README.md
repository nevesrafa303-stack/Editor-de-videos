# "A Select saiu. O Português fica." — motion graphics (32,5 s, sem locução)

Anúncio em motion graphics feito a partir do brief "A saída da Select de Recife" e de 4 fotos dos
hospitais (Real Hospital Português e Hospital Santa Joana). É só texto na tela, trilha e efeitos,
sem narração: os créditos do ElevenLabs acabaram. O ritmo segue a trilha (96 BPM, compasso de
2,5 s). Dois formatos com o mesmo roteiro e o mesmo áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Conteúdo entre 260 e 1470 px; nada nos
  230 px de cima nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/`.

O CTA junta a chamada do brief ("Fale com um consultor") com o formulário de cadastro dos anúncios:
o botão diz "Fale com um consultor / Preencha o formulário", e as setas "Toque no botão abaixo"
apontam para o botão do anúncio.

## Roteiro

| Tempo | Cena | Na tela |
|---|---|---|
| 0–5 s | Gancho | "Recife · PE"; "A Select saiu de Recife." (a primeira linha já aparece no quadro 0); carteirinha genérica de plano de saúde leva o carimbo "SEM PLANO" e fica cinza; "Famílias e empresas perderam o plano."; "E agora?" |
| 5–10 s | Dor | foto do Hospital Santa Joana escurecida; "Mais do que perder o plano, o medo é perder o hospital."; "Cada dia sem plano é um dia de risco para a família.", com um contador "DIAS SEM PLANO" subindo de 1 a 9 |
| 10–15 s | Virada | "A Select saiu." é riscado; no drop da trilha (12,5 s), "O Português fica." e a foto do Real Hospital Português |
| 15–20 s | Saída | "Trocar de plano não significa trocar de hospital."; "Existem planos com atendimento no:" Real Hospital Português, Hospital Santa Joana, "E outros hospitais de referência do Recife", cada um com check |
| 20–25 s | Consultor | "Um consultor compara as operadoras": três planos genéricos (A, B, C), uma lupa marca quais têm cada hospital e o plano B, com os dois, se destaca; "e encontra o plano que mantém seus hospitais de confiança, de acordo com o perfil da sua família ou empresa" |
| 25–32,5 s | Cartão final | "~~A Select saiu.~~ O Português fica. Troque de plano, não de hospital."; fotos dos dois hospitais; botão "Fale com um consultor / Preencha o formulário"; setas "Toque no botão abaixo"; texto legal |

### Cuidados na comunicação (do brief)

- **Sem promessa de preço**: o vídeo não cita valor, nem "mesmo preço", nem "mais barato".
- **Sem identidade da Select**: o nome aparece só em texto simples, na tipografia e nas cores do
  vídeo; não há logo. A paleta é própria (azul-noite e dourado, com coral na parte da dor). O
  manual de marca da Select não foi encontrado, então as cores não puderam ser comparadas com as
  dela.
- **Observação obrigatória do brief**: "Consulte a disponibilidade da rede hospitalar. A rede
  credenciada pode variar conforme plano contratado." entra por escrito em todas as cenas com
  hospital e no cartão final.
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

Todo o texto vem do brief. As frases foram usadas como estão ou só encurtadas para caber na tela,
sem nenhuma afirmação nova. A saída da Select de Recife é uma informação do cliente. Em 25/10/2026
não encontrei comunicado oficial da Select nem da ANS. Só achei relatos de beneficiários no
Reclame Aqui (julho e agosto de 2026) sobre o Real Hospital Português e o Santa Joana deixarem de
atender o plano. Confirme antes de veicular.

## Gerar de novo

```bash
python3 -I tools/synth_audio.py     # efeitos cortados no golpe + trilha (96 BPM, 32,5 s)
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html)
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/select-recife-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/select-recife-feed.mp4)
```

A grade das cenas fica em `T` de `tools/build.mjs` e a da trilha em `PROG`/`at_bar` de
`tools/synth_audio.py`: as duas usam o compasso de 2,5 s. A geometria de cada formato está nas
chamadas `pick(story, feed)`, e as observações em `OBS`. Masterização em −14 LUFS, com loudnorm em
duas passadas (medição + `linear=true`), AAC 256k e faststart.

## Áudio

- **Sem locução.**
- **Trilha** sintetizada em `tools/synth_audio.py` (a conexão do ElevenLabs deste ambiente não gera
  música):
  - Lá menor na dor (piano esparso, pad escuro e batida de coração);
  - subida em Sol com rufo em "A Select saiu.";
  - drop em Dó maior em "O Português fica.";
  - groove leve nos hospitais e no consultor;
  - refrão no cartão final e acorde final em Dó aos 30 s.
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
