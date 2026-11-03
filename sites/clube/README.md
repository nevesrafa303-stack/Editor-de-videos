# Site — Imersão Clube das Agências

Landing page em **Next.js 16** (App Router, TypeScript, Tailwind 4) com rolagem suave (**Lenis**) e animações
por rolagem (**GSAP + ScrollTrigger + SplitText + ScrambleText**). Refaz o clubedasagencias.com.br no mesmo padrão
dos sites da LAKS e da RISE. Pedido do cliente: entrada em tela cheia com o vídeo do evento, depoimentos com os
mesmos vídeos da RISE, pouca imagem e mais texto.

Todos os textos ficam em `src/content/site.ts`. As animações ficam em `src/lib/motion.ts`.

## Rodar

```bash
cd sites/clube
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
npm run build && npm start   # produção local
```

## Prévia em arquivo único (para enviar ao cliente)
Gera `entregas/clube-preview.html` (~13 MB) com imagens, fontes, animações e vídeos embutidos (em qualidade de
prévia); abre direto no navegador, sem servidor.

```bash
cd sites/clube && npm run build && npm start          # em outro terminal
cd sites/_fontes/clube && npm install && node preview/build-preview.mjs http://localhost:3000
```

A imagem de compartilhamento e o ícone da Apple saem de `sites/_fontes/clube/og-src.html` e `icon-src.html`
(`node render-og.mjs`, com Playwright).

## Experiências por seção
Cada seção tem uma composição própria (nada de "símbolo + título + subtítulo" repetido). Títulos curtos em
caixa alta; títulos longos em caixa normal, com um trecho em dourado.

- **Abertura:** a seta da marca aparece no centro e o vídeo do evento abre em tela cheia a partir do círculo.
  Com mouse, uma luz de palco segue o cursor sobre o vídeo e vídeo e texto se deslocam em camadas. Ao rolar,
  a tela fixa, o texto sai e o vídeo vira um quadro "Veja como foi a última edição". Botão de som. O vídeo
  só começa a baixar depois que a página carrega (480 px no celular, 720 px no computador), toca sem som em
  loop e pausa fora da tela; a capa é o Hermano no palco (2 s do vídeo).
- **Faixa:** duas linhas de texto correndo em sentidos opostos; a velocidade e a inclinação seguem a rolagem.
- **Números:** uma frase só ("Você vai ver por dentro uma agência de R$ 15 milhões…") que acende palavra por
  palavra com a rolagem; os números rolam como contadores de painel até o valor.
- **5 pilares:** acordeão. No computador a seção fixa na altura exata da tela (cabe em 1024×640 até
  1920×1080) e as colunas abrem uma por vez com a rolagem, com o contador 01/05; o mouse em movimento também
  abre. No celular os cinco ficam abertos e o que passa pelo meio da tela acende.
- **Para quem é:** diagnóstico. A pessoa liga as chaves e o anel do medidor acende um segmento por chave; a
  resposta muda e, com 3 ou mais, aparece o botão de ingresso. No computador o medidor acompanha a rolagem.
- **Por dentro da última edição:** galeria para arrastar (inércia no mouse, deslize no celular), com botões,
  contador 01/09 e setas do teclado; as fotos inclinam com a velocidade e deslizam dentro do quadro.
- **O que você precisa saber:** ingresso de papel com canhoto picotado. Entra inclinado, as letras
  embaralham até formar o texto (quadro de embarque) e ele inclina com o mouse. Contagem regressiva no
  canhoto (some depois da data), "Adicionar à agenda" (arquivo .ics) e "Ver no mapa".
- **Depoimentos:** playlist com os vídeos da RISE. Um palco com o vídeo escolhido e a fala por cima, como
  legenda; a lista ao lado troca o vídeo com uma cortina. No play o vídeo toca com som e a linha da lista
  mostra o andamento. Com mouse, prévia sem som e o palco inclina. Resultados em números logo abaixo.
- **Ingressos:** Black e Diamond com a barra de vendidos; as chaves dos benefícios ligam em sequência e as
  que o ingresso não inclui ficam desligadas e riscadas. Diamond com carimbo de esgotado. Os cartões
  entram inclinados e seguem o mouse. Botões levam ao WhatsApp.
- **Mentores:** no computador as três cartas saem de um monte no centro e se abrem lado a lado com a
  rolagem; com mouse, a carta sob o cursor fica em foco (as outras se apagam) e inclina. Bio alinhada à
  esquerda, selo de verificado e Instagram.
- **Perguntas frequentes:** duas colunas no computador (título e suporte fixos ao lado), 7 perguntas
  numeradas; abre e fecha com altura animada (funciona sem JavaScript).
- **Hora de agir:** as letras entram uma a uma e, com mouse, as que estão perto do cursor se erguem e douram;
  botão redondo com o texto girando em volta, atraído pelo mouse.
- **Geral:** cursor com rótulo ("Abrir", "Arraste", "Ver", "Assistir", "Ligar"), que se atualiza também ao
  rolar; reflexo nos botões; menu marca a seção na tela; no celular, barra fixa com o botão de ingresso e a
  porcentagem vendida (some na abertura, nos ingressos e na chamada final). Logo gigante do rodapé sobe no
  fim da página.

Tudo segue a rolagem nos dois sentidos. Com "reduzir movimento" ou sem JavaScript, a página aparece completa
(pilares em lista, números no valor final) e o vídeo não toca sozinho (o botão vira "Assistir com som"). A
preparação das animações roda em etapas curtas para não travar o celular.

## Eventos para o GTM
`cta_clique` (com o local do botão: `hero`, `perfil`, `ingresso-black`, `final`, `suporte`, `agenda`…),
`video_evento_som`, `depoimento_play` e `perfil_imersao` (quantas chaves a pessoa ligou no "Para quem é").

## Publicar na Vercel
1. Importe o repositório e defina **Root Directory = `sites/clube`** (framework: Next.js).
2. Em *Environment Variables*, cadastre as variáveis de `.env.example` (o Pixel do site atual já está lá).
   São lidas no build: depois de mudar, faça um novo deploy.
3. Aponte o domínio para o projeto e ajuste `NEXT_PUBLIC_SITE_URL`.

## Antes de publicar (confirmar com o cliente)
Tudo que depende do cliente está em `src/content/site.ts`, marcado com **CONFIRMAR**:
- **Datas da próxima edição.** As do site atual (25 e 26 de setembro de 2026) já passaram; enquanto não mudar,
  a contagem regressiva fica escondida. Trocar também a data do jantar ("24/09") nos benefícios.
- Preços, parcelas, porcentagem vendida (86%) e se o Diamond continua esgotado.
- Público mínimo: o topo fala em R$ 30 mil/mês e uma resposta das perguntas fala em R$ 20 mil/mês.
- Perguntas novas (horários, Black × Diamond, pagamento) e a resposta do "presencial", que agora cita o
  Riviera Business & Mall (antes dizia que o endereço seria enviado depois, contradizendo o ingresso).
- Fotos dos mentores: Saimon Oliveira = polo preta no sofá; Gabriel Dias = polo vinho (identificados pelas fotos
  do site atual). A foto de polo preta em pé ficou de reserva (`sites/_fontes/clube/originais`).
- Nomes de quem fala nos depoimentos (os mesmos vídeos da RISE).
- Razão social, CNPJ e e-mail da Skill Sales para a política de privacidade (LGPD).
