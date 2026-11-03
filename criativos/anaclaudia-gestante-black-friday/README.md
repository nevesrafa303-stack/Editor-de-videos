# Ana Claudia Clicks — Black Friday (novembro/2026): gestante, newborn e combo

Criativos estáticos da Black Friday do estúdio Ana Claudia Clicks (cliente da LAKS), no padrão visual da
proposta comercial em PDF da cliente, com a promo de setembro (`assets/ref/promo-setembro-*.png`) como
referência para as fotos em formato de impresso.

**9 criativos**, cada um em **Story 9:16** e **Feed 4:5**, exportados em 2x (2160×3840 e 2160×2700), em
`final/`. `final/_visao-geral.jpg` mostra as 18 imagens.

## Regra da cliente: fotos sem nenhuma alteração

Pedido do estúdio em 03/11/2026 ("as nossas fotos são profissionais, não precisam alterar nada"):

- as fotos entram **exatamente como o estúdio enviou** (`assets/fotos/originais/`);
- **pode**: enquadrar (cortar) e reduzir;
- **não pode**: recorte do fundo, troca de fundo, ampliação por IA, nitidez, filtro, retoque, degradê ou texto
  por cima da pessoa;
- nenhuma foto é ampliada: o conferidor mede a escala de cada foto (px exportado ÷ px original) e só aceita ≤ 1.
  Nesta versão a maior escala é 1,0 (G1 Story): a foto aparece no tamanho original, sem ampliar.
- **Enquadramento:** `pecas/dados.js` guarda onde está a pessoa / o bebê em cada foto (medido nas originais) e
  cada moldura mostra essa região inteira e centralizada, com o formato da moldura acompanhando o da pessoa
  (arco alto para gestante em pé, moldura horizontal para bebê deitado).

A versão anterior (recorte da modelo sentada sobre um holofote desenhado e fotos ampliadas por IA) foi
removida do projeto. Ela continua só no histórico do git.

## Peças

Pedido de 03/11: deixar claro que é **ensaio fotográfico** e que **gestante = 15%** e **newborn = 20%**.
Os textos usam "Ensaio de Gestante" e "Ensaio de Newborn". Nas peças com as duas fotos, cada foto leva o seu
desconto colado nela (embaixo do arco, na legenda do impresso ou ao lado do card).

| Grupo | Oferta | Peça | Layout | Foto(s) |
|---|---|---|---|---|
| Gestante | Ensaio de Gestante* **15% OFF** | `g1-capa-vermelho` | Capa escura, arco alto + oferta ao lado | vermelho |
| | | `g2-papel-jeans` | Papel com foto impressa | jeans |
| | | `g3-convite-holofote` | Convite (card + painel claro) | holofote (foto do PDF, com o círculo de luz original) |
| Newborn | Ensaio de Newborn* **20% OFF** | `n1-capa-tule` | Capa escura, foto horizontal | newborn menina (tule, deitada) |
| | | `n2-papel-botoes` | Papel com foto impressa | newborn menino (botões) |
| | | `n3-convite-tule` | Convite | newborn menina (tule, vertical) |
| Juntos | foto de gestante **15%** + foto do bebê **20%** | `j1-capa-sentada-azul` | Capa escura, dois arcos, desconto embaixo de cada foto | sentada + newborn menino (azul, vertical) |
| | | `j2-papel-tenis-touca` | Papel com dois impressos (promo de setembro), desconto na legenda de cada impresso | branco com tênis + newborn menino (touca) |
| | | `j3-convite-tule-renda` | Convite com duas fotos, desconto ao lado de cada foto | marrom de tule + newborn menina (renda) |

Em todas: "BLACK FRIDAY", etiqueta Black Friday do PDF, "Condição Especial somente em Novembro" e
"\*Válido para reservas realizadas em novembro de 2026.". Sem valores em reais e sem logo, como pedido antes.

**Confirmar:** o texto original da cliente dizia "Combo Gestante + Newborn 20% OFF"; a pedido da LAKS (03/11)
as peças dizem "Ensaio de Newborn 20% OFF". Para voltar ao "Combo", basta trocar o rótulo em `pecas/base.js`.

## Como funciona

- `pecas/dados.js`: lista das peças (layout, grupo e moldura de cada foto em Story e Feed: posição, forma,
  ponto de foco e zoom).
- `pecas/capa.html`, `pecas/editorial.html`, `pecas/convite.html`: os três layouts.
- `pecas/base.js`: monta as molduras (só corta e reduz a foto, nunca amplia), os textos e as ofertas.

```bash
node render.mjs                     # as 18 imagens (ou: node render.mjs j2)
node ferramentas/conferir.mjs       # fotos sem ampliação, zonas seguras do Story, fonte mínima e contraste
```

## Fotos

- Gestante: `vermelho`, `jeans`, `sentada`, `branco-tenis`, `marrom-tule` (enviadas pelo estúdio) e
  `holofote-blazer-pdf` (tirada da proposta em PDF da cliente).
- Newborn: 6 fotos enviadas pelo estúdio (`newborn-*.jpg`).

## Marca

- **"GESTANTE"** (`assets/marca/gestante-wordmark*.png`): recortado da capa do PDF (versão clara e escura).
- **Etiqueta Black Friday** (`assets/marca/etiqueta-black-friday.png`): PNG do PDF, com o barbante prolongado.
- **Papel** (`assets/marca/papel.jpg`): textura de fundo gerada para os layouts claros (não é foto).
- **Cores** do PDF: grafite `#31312f`, papel `#f4f4f4`, vinho `#7a010f`, marfim `#f6f3ee`.
- **Fontes**: Montserrat (a mesma do PDF); Gilda Display ≈ TAN Pearl e Bellefair ≈ Kief Montaser Light
  (as TAN são pagas do Canva).
