# Ana Claudia Clicks — Ensaio de Natal 2026

Criativos estáticos do Ensaio de Natal do estúdio Ana Claudia Clicks (cliente da LAKS).

- **Peças:** 6 criativos, cada um em **Story 9:16** e **Feed 4:5**.
- **Arquivos:** PNG em 2x (2160×3840 e 2160×2700) em `final/`. A visão geral das 12 imagens está em
  `final/_visao-geral.jpg`.
- **Textos dos anúncios:** em `textos-meta-ads.md`.

## Pedidos da cliente (WhatsApp, 09/11/2026)

- **Fotos sem alteração:** "não quero nada alterado, nada manipulado, quero bastante cenário aparecendo".
- **Sem valores:** "Não quero valores / Porque estamos trocando os lotes". Nenhuma peça tem preço.
- **Copy e formato:** copy de ensaio fotográfico de Natal, aprovada pela LAKS em 09/11/2026. Story e Feed, sem logo.
- **Botão do anúncio:** "Enviar mensagem", para o WhatsApp.
- **Autorização de imagem:** as famílias autorizaram o uso das fotos em anúncio (confirmado pela LAKS em 09/11/2026).

## Fotos: só corte e redução

Regra da cliente, também no `CLAUDE.md`.

**O que pode e o que não pode:**
- Pode: enquadrar (cortar) e reduzir.
- Não pode: recorte ou troca de fundo, IA, nitidez, filtro, ajuste de cor ou retoque.
- Nada vai por cima das fotos: nem texto, nem degradê, nem moldura. Elas ficam inteiras dentro de quadros, com o
  fundo da peça em volta.

**Os arquivos:**
- **Originais:** JPG de 11 a 30 MB, até 7360 px, na pasta de Natal da cliente no Google Drive. Ficam fora do git.
- **Cópias do projeto:** em `assets/fotos/`, geradas por `ferramentas/preparar-fotos.py`. Elas só são reduzidas
  (lado maior de 3200 px, Lanczos) e mantêm o perfil de cor sRGB original.

**Quanto da foto aparece:** o conferidor mede, para cada foto, a escala de exportação (sempre ≤ 1, nunca amplia) e
quanto dela aparece.
- 10 das 12 imagens mostram de 94% a 100% da foto.
- **N1 Feed:** a ANA_9320 aparece em 92% da largura.
- **N1 Story:** a ANA_9127 aparece em 80% da altura. Sai um pouco da cortina de cima e do chão; a família, a árvore e
  os presentes aparecem inteiros.

## Peças

Em todas:
- o selo "✦ ENSAIO DE NATAL 2026 ✦";
- o botão da imagem "AGENDE SEU ENSAIO DE NATAL →";
- uma moldura fina dourada.

| Peça | Tema | Título | Apoio | Story | Feed |
|---|---|---|---|---|---|
| `n1-veludo` | marfim | O Natal da sua família, *eternizado* | Cortina de veludo, árvore iluminada e a família toda reunida. | ANA_9127 grande | ANA_9127 + ANA_9320 lado a lado |
| `n2-casinha` | vinho | Bem-vindos à *Casinha do Papai Noel* | Um cenário inteiro de Natal esperando a sua família. | ANA_9390 inteira | ANA_9390 |
| `n3-cartinha` | verde | *A cartinha para o Papai Noel* vira lembrança para a vida toda | Ensaio de Natal para crianças e famílias. | ANA_9178 + ANA_9363 | ANA_9359 |
| `n4-neve` | vinho | *Neve caindo* e sorrisos de verdade | Ensaio de Natal com cenário de neve no estúdio. | ANA_9265 em cima, ANA_9215 embaixo | ANA_9209 |
| `n5-familia` | vinho | O melhor presente *é estar na foto* | Ensaio de Natal em família. | ANA_9135 e ANA_9405 como fotos impressas | ANA_9135 impressa |
| `n6-cenarios` | marfim | *Dois cenários de Natal*: escolha o seu | Veludo vermelho *ou* Casinha do Papai Noel (rótulos sob as fotos) | ANA_9355 + ANA_9214 em arco | idem |

*Itálico* = Great Vibes (caligrafia).

### Mudanças de foto em relação à proposta

- **ANA_9390 no lugar do PNG "Retrato Familiar Natalino com Janela Iluminada":** o PNG parece uma versão editada
  dela (janela acesa), então entrou a original.
- **`vss.png` ficou de fora:** tem só 1502×1047 px e precisaria ser ampliada.
- **N6:** usa ANA_9355 (veludo) e ANA_9214 (casinha). As duas são verticais e mostram o cenário inteiro, o que cabe
  melhor lado a lado.
- **ANA_9127 sem repetir:** aparece só no N1.
- **Não usadas:** ANA_9464 e ANA_9466.

## Visual

- **Fontes** (opção 1 da prancha, escolhida em 09/11/2026), todas do Google Fonts e livres para uso comercial:
  - **Great Vibes** na parte em caligrafia do título;
  - **Cinzel** nas capitais, no selo e no apoio;
  - **Montserrat** só no botão.
- **Cores de Natal:**
  - vinho `#6a0712`, verde `#133325` e marfim `#f8f2e7` nos fundos;
  - dourado `#c9a45c` e `#f1d38f` no selo, nas linhas e no título.
- **Story:** todo o texto fica entre y=230 e y=1536, fora das barras do Story. Embaixo de 1536 só há foto ou o
  enfeite dourado, que ficam sob o botão "Enviar mensagem".

## Gerar de novo

```bash
cd criativos/anaclaudia-natal
python3 -I ferramentas/preparar-fotos.py      # baixa as originais do Drive e grava as cópias reduzidas
node render.mjs                               # as 12 imagens (ou: node render.mjs n3)
node ferramentas/conferir.mjs                 # escala ≤ 1, quanto da foto aparece, zona do Story, fonte mínima, contraste
python3 -I ferramentas/visao-geral.py         # final/_visao-geral.jpg
```

- **Onde as peças são definidas:** `pecas/dados.js` (fotos, posições e textos de cada formato) e `pecas/peca.html`
  (montagem).
- **Resultado do conferidor:** passa nas 12 imagens.
  - Fonte mínima: 24 px no Story e 19 px no Feed.
  - Contraste: ≥ 4,2:1.
