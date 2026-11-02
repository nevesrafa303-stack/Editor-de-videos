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
- **Abertura:** a seta da marca aparece no centro e o vídeo do evento abre em tela cheia a partir do círculo.
  Ao rolar, a tela fixa, o texto sai e o vídeo vira um quadro "Veja como foi a última edição". Botão de som.
  O vídeo só começa a baixar depois que a página carrega (versão de 480 px no celular, 720 px no computador),
  toca sem som em loop e pausa fora da tela.
- **5 pilares:** cartões que empilham (cada um gruda no topo e o anterior encolhe e escurece); no desktop o
  título fica fixo ao lado com o contador 01/05.
- **Para quem é:** as chaves liga/desliga do site atual ligam conforme cada item chega ao meio da tela.
- **O que você precisa saber:** painel com as letras embaralhando até formar o texto (quadro de embarque),
  "Adicionar à agenda" (arquivo .ics), "Ver no mapa" e contagem regressiva (some depois da data).
- **Depoimentos:** a mesma galeria da RISE; no desktop o vídeo toca sem som ao passar o mouse.
- **Ingressos:** Black e Diamond com a barra de vendidos; as chaves dos benefícios ligam em sequência e as que
  o ingresso não inclui ficam desligadas e riscadas. Diamond com carimbo de esgotado. Botões levam ao WhatsApp.
- **Mentores:** a foto abre de baixo para cima; selo de verificado e link do Instagram.
- **Perguntas frequentes:** abre e fecha com altura animada (funciona sem JavaScript).
- **Hora de agir:** a seta gigante da marca gira com a rolagem.
- **Geral:** cursor com rótulo, reflexo nos botões, menu marca a seção na tela e, no celular, barra fixa com o
  botão de ingresso e a porcentagem vendida (some na abertura, nos ingressos e na chamada final).

Tudo segue a rolagem nos dois sentidos. Com "reduzir movimento" ou sem JavaScript, a página aparece completa e
o vídeo não toca sozinho (o botão vira "Assistir com som"). A preparação das animações roda em etapas curtas
para não travar o celular.

## Eventos para o GTM
`cta_clique` (com o local do botão: `hero`, `ingresso-black`, `suporte`, `agenda`…) e `video_evento_som`.

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
- Fotos dos mentores: Saimon Oliveira = polo preta no sofá; Gabriel Dias = polo vinho (identificados pelas fotos
  do site atual). A foto de polo preta em pé ficou de reserva (`sites/_fontes/clube/originais`).
- Nomes de quem fala nos depoimentos (os mesmos vídeos da RISE).
- Razão social, CNPJ e e-mail da Skill Sales para a política de privacidade (LGPD).
