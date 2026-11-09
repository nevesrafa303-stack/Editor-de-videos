# Ana Claudia Clicks — Ensaio de Natal 2026

Criativos estáticos do Ensaio de Natal do estúdio Ana Claudia Clicks (cliente da LAKS).

- **Peças:** 6 criativos, cada um em **Story 9:16** e **Feed 4:5**.
- **Arquivos:** PNG em 2x (2160×3840 e 2160×2700) em `final/`. A visão geral das 12 imagens está em
  `final/_visao-geral.jpg`.
- **Textos dos anúncios:** em `textos-meta-ads.md`.

## Versão 2: a foto em tela cheia

Pedidos da LAKS em 09/11/2026 sobre a versão 1 (fundo liso com as fotos em quadros):

- **"Está muito genérico, use as imagens em destaque, em todo o criativo":**
  - a foto agora ocupa a peça inteira;
  - na Neve e nos Dois cenários, são 2 ou 3 fotos empilhadas, separadas por um filete marfim;
  - o texto fica direto sobre o cenário (cortina, árvore, parede da casinha), nunca sobre as pessoas.
- **"Destaque mais a frase Ensaio de Natal 2026":** a frase virou uma faixa dourada grande, como uma fita com as
  pontas recortadas e letra vinho. É o primeiro elemento de todas as peças.
- **Menos texto na imagem, para a foto aparecer mais:**
  - a imagem leva só a faixa e o título;
  - a frase de apoio e o "Agende seu ensaio de Natal" foram para o texto do anúncio e para o botão "Enviar mensagem"
    do Meta, que aparece embaixo de toda peça.

A versão 1 está no histórico do git (commit `56ff63a`).

## Pedidos da cliente (WhatsApp, 09/11/2026)

- **Fotos sem alteração:** "não quero nada alterado, nada manipulado, quero bastante cenário aparecendo".
- **Sem valores:** "Não quero valores / Porque estamos trocando os lotes". Nenhuma peça tem preço.
- **Sem logo**, em Story e Feed (LAKS, 09/11/2026).
- **Botão do anúncio:** "Enviar mensagem", para o WhatsApp.
- **Autorização de imagem:** as famílias autorizaram o uso das fotos em anúncio (confirmado pela LAKS em 09/11/2026).

## Fotos: só corte e redução

Regra da cliente, também no `CLAUDE.md`.

**O que pode e o que não pode:**
- Pode: enquadrar (cortar) e reduzir.
- Não pode: recorte ou troca de fundo, IA, nitidez, filtro, ajuste de cor, retoque ou degradê.
- O texto não passa por cima de nenhuma pessoa. A sombra suave em volta das letras é da própria letra: não
  escurece a foto.

**Os arquivos:**
- **Originais:** JPG de 11 a 30 MB, até 7360 px, na pasta de Natal da cliente no Google Drive. Ficam fora do git.
- **Cópias do projeto:** em `assets/fotos/`, geradas por `ferramentas/preparar-fotos.py`. Elas só são reduzidas
  (lado maior de 4000 px, o necessário para a tela cheia do Story sem ampliar; Lanczos) e mantêm o perfil de cor
  sRGB original.

**Quanto da foto aparece:** o conferidor mede, para cada foto, a escala de exportação (sempre ≤ 1, nunca amplia) e
quanto dela aparece. A tela cheia corta um pouco:
- **Fotos verticais no Story (9:16):** aparecem com a altura inteira; perdem só as laterais. Mostram de 75% a 87%
  da largura.
- **Fotos verticais no Feed (4:5):** aparecem com a largura inteira; perdem o alto da cortina ou o chão. Mostram de
  81% a 93% da altura.
- **Fotos horizontais empilhadas (Neve e Dois cenários):** mostram de 72% a 100%.

## Peças

| Peça | Título (*itálico* = Great Vibes) | Story | Feed |
|---|---|---|---|
| `n1-veludo` | O Natal da sua família, *eternizado* | ANA_9127; título na cortina, à direita, acima do pai | ANA_9127 |
| `n2-casinha` | Bem-vindos à *Casinha do Papai Noel* | ANA_9214; título na parede da casinha, acima da família | ANA_9214 |
| `n3-cartinha` | *A cartinha para o Papai Noel* vira lembrança para a vida toda | ANA_9178; título na árvore, acima da menina | ANA_9363 |
| `n4-neve` | *Neve caindo* e sorrisos de verdade | ANA_9209, ANA_9265 e ANA_9215 empilhadas; título nas árvores nevadas, ao lado da menina | ANA_9265 + ANA_9209 |
| `n5-familia` | O melhor presente *é estar na foto* | ANA_9320; título na cortina e na guirlanda | ANA_9320 |
| `n6-cenarios` | *Dois cenários de Natal*: escolha o seu | ANA_9359 (rótulo "Veludo vermelho") + ANA_9390 (rótulo "Casinha do Papai Noel") | idem |

### Fotos usadas e deixadas de fora

- **ANA_9390 no lugar do PNG "Retrato Familiar Natalino com Janela Iluminada":** o PNG parece uma versão editada
  dela (janela acesa), então entrou a original.
- **`vss.png` ficou de fora:** tem só 1502×1047 px e precisaria ser ampliada.
- **ANA_9214 na Casinha:** tem parede livre acima da família, onde o título cabe sem cobrir ninguém.
- **Não usadas nesta versão:** ANA_9135, ANA_9355, ANA_9405, ANA_9464 e ANA_9466. Nelas não sobra cenário livre
  para o texto em tela cheia.

## Visual

- **Fontes** (opção 1 da prancha, escolhida em 09/11/2026), do Google Fonts e livres para uso comercial:
  - **Great Vibes** na parte em caligrafia do título;
  - **Cinzel** (700) nas capitais, na faixa e nos rótulos.
- **Faixa "Ensaio de Natal 2026":** dourado `#f3dc9f` → `#c29545`, letra vinho `#4a040c`.
  - Story: 40 px (28–32 px quando divide espaço).
  - Feed: 32 px (26 px quando divide espaço).
- **Texto sobre cenário escuro** (veludo, árvore): marfim `#fff8ec` e dourado `#f6dc9c`, com sombra escura suave.
- **Texto sobre cenário claro** (parede branca, neve): vinho `#5a0610` / `#7a010f`, com brilho branco suave.
- **Story:** todo o texto fica entre y=230 e y=1536, fora das barras do Story.

## Gerar de novo

```bash
cd criativos/anaclaudia-natal
python3 -I ferramentas/preparar-fotos.py      # baixa as originais do Drive e grava as cópias reduzidas
node render.mjs                               # as 12 imagens (ou: node render.mjs n3)
node ferramentas/conferir.mjs                 # escala ≤ 1, quanto da foto aparece, zona do Story, fonte mínima, contraste
python3 -I ferramentas/visao-geral.py         # final/_visao-geral.jpg
```

- **Onde as peças são definidas:** `pecas/dados.js` (fotos, faixa, posições e textos de cada formato) e
  `pecas/peca.html` (montagem).
- **Resultado do conferidor:** passa nas 12 imagens.
  - Fonte mínima: 28 px no Story e 24 px no Feed.
  - Contraste: ≥ 6,3:1, medido contra a foto atrás das letras.
