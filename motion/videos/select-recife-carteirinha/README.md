# Select Recife — variação 3, "Você tinha Select?" (42 s)

Terceira variação do motion da saída da Select de Recife, para testar contra
`../select-recife-hospitais` (narrativa dor → virada) e `../select-recife-mito-verdade` (quiz). Esta
fala direto com quem tinha o plano e mostra a troca de carteirinha: a do plano anterior sai, e a do
novo plano entra com a rede hospitalar se preenchendo. Dois formatos com o mesmo roteiro e o mesmo
áudio:

- **Story 9:16 (1080×1920)**: este projeto (`index.html`). Conteúdo entre 266 e 1440 px; nada nos
  230 px de cima nem abaixo de 1536 px.
- **Feed 1:1 (1080×1080)**: projeto em `feed/`.

## Roteiro

| Tempo | Fala | Na tela |
|---|---|---|
| 0–3,4 s | "Você tinha Select em Recife? Presta atenção." | "Você tinha" já no quadro 0, "Select em Recife?" bate quando é dito; carteirinha genérica "PLANO ANTERIOR"; selo "Presta atenção" |
| 3,4–15,1 s | "A Select saiu, mas trocar de plano não significa trocar de hospital. Existem planos com atendimento no Real Hospital Português, no Santa Joana e em outros hospitais de referência do Recife." | "A Select saiu," é riscado e a carteirinha antiga sai; no "mas" (drop da trilha) entra a do "NOVO PLANO"; "Trocar de plano não significa trocar de hospital."; "Existem planos com atendimento no:" e a "REDE HOSPITALAR" da carteirinha se preenche com cada hospital quando é dito |
| 15,1–27,2 s | "E você não precisa fazer essa busca por conta própria: o consultor compara as operadoras e encontra o plano que mantém os seus hospitais de confiança, pro perfil da sua família ou da sua empresa." | "Não precisa fazer essa busca por conta própria:"; tabela Hospital × Plano A/B/C; no "compara as operadoras" cada coluna acende e marca os hospitais; no "mantém" a coluna do plano B (os dois hospitais) ganha o contorno dourado; "família" ou "empresa" |
| 27,2–32,2 s | "Só não deixa pra depois: cada dia sem plano é um dia de risco pra família." | respiro: texto e um eletrocardiograma se desenhando; a trilha cai para piano e batida de coração |
| 32,2–42 s | "Troque de plano, não de hospital. Toca no botão aqui embaixo, preenche o formulário e fala com um consultor." | o cartão final da versão 1: "~~A Select saiu.~~ O Português fica. Troque de plano, não de hospital."; fotos; botão "Fale com um consultor / Preencha o formulário"; setas "Toque no botão abaixo"; texto legal |

### Cuidados na comunicação (do brief)

- **Sem promessa de preço**: o vídeo não cita valor, nem "mesmo preço", nem "mais barato".
- **Sem identidade da Select**: o nome aparece só em texto simples, sem logo. As carteirinhas são
  genéricas ("PLANO ANTERIOR" / "NOVO PLANO"), sem marca de nenhuma operadora. A paleta é própria.
- **Observação obrigatória do brief**: "Consulte a disponibilidade da rede hospitalar. A rede
  credenciada pode variar conforme plano contratado." entra por escrito na cena da rede hospitalar
  e no cartão final. Como manda o CLAUDE.md da raiz, as observações não vão para a locução.
- Os planos A, B e C da tabela são genéricos e não representam operadoras reais.

### Observações obrigatórias de segurança comercial (CLAUDE.md da raiz)

Só por escrito, com o texto exato, em letra pequena (20 px no story, 16 px no feed):

| Cena | Observações |
|---|---|
| Carteirinha nova com a rede (hospitais, fotos) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Tabela do consultor (operadoras, família ou empresa, fotos) | Consulte condições e elegibilidade. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Cartão final | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Imagem meramente ilustrativa. |

### De onde vem cada informação

Todo o texto, na tela e na fala, vem do brief "A saída da Select de Recife". A fala só foi ajustada
para falar com a pessoa ("Você tinha Select em Recife?", "não precisa fazer essa busca por conta
própria"), sem afirmações novas. A saída da Select de Recife é uma informação do cliente: em
25/10/2026 não encontrei comunicado oficial (ver `../select-recife-hospitais/README.md`). Confirme
antes de veicular.

## Gerar de novo

```bash
python3 -I tools/voice.py           # locução HeyGen numa tomada (cache em assets/voice/vo.json)
python3 -I tools/synth_audio.py     # efeitos + trilha presa à locução; grava tools/grid.json
bash tools/assemble.sh              # story (index.html) + feed (feed/index.html) + carve da trilha
npx hyperframes check && (cd feed && npx hyperframes check)
npx hyperframes render --quality high --fps 30 --output renders/select-carteirinha-story.mp4
(cd feed && npx hyperframes render --quality high --fps 30 --output renders/select-carteirinha-feed.mp4)
```

`tools/build.mjs` reaproveita o fundo, as observações e o cartão final da versão 1. Os tempos vêm
de `at()`/`seq()` sobre `assets/voice/vo.words.json`, e a duração e as âncoras da trilha de
`tools/grid.json`. Masterização em −14 LUFS, com loudnorm em duas passadas, AAC 256k e faststart.

## Áudio

- **Locução**: HeyGen, voz "Sofia Brazil – Friendly" (pt-BR), velocidade 1,05, numa tomada só, com
  pausas nas viradas (`GAP_AFTER`). O ElevenLabs estava sem créditos.
- **Trilha** sintetizada em `tools/synth_audio.py` (~96 BPM):
  - tensão em Lá menor no gancho;
  - subida em Sol;
  - drop em Dó maior no "mas trocar de plano…";
  - groove leve na rede e no consultor;
  - respiro com piano e batida de coração no "cada dia sem plano é um dia de risco";
  - nova subida, refrão no "Troque de plano" e acorde final em Dó.
- **Carve** com força 0,35 sob a voz.
- **Efeitos** (ElevenLabs Sound Effects v2, da versão 1): impacto, cartão, whoosh, checks, pop,
  brilho e chime.

## Assets

As fotos dos hospitais da versão 1 (`assets/img/`), só com enquadramento e zoom lento, sem
tratamento de cor. Tipografia: Montserrat e Poppins.
