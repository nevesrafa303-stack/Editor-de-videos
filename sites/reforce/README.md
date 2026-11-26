# Site — Reforce Consultoria · Projetos de Capital e Infraestrutura

Site institucional em **Next.js 16** (App Router, TypeScript, Tailwind 4) com rolagem suave (**Lenis**) e
animações por rolagem (**GSAP + ScrollTrigger + SplitText**). Todo o conteúdo veio da "Apresentação
Institucional Reforce" (PDF de 26 páginas): textos, números, cases, nomes, cargos, fotos e painéis.

- Textos: `src/content/site.ts` (mudou um número ou um nome? Troque só aqui).
- Animações: `src/lib/motion.ts`. Interações (abas, cronograma, mapa, filtro, formulário): `src/lib/interacoes.ts`.
- Sem JavaScript ou com "reduzir movimento" ativado no aparelho, a página aparece completa, no estado final.

## Rodar

```bash
cd sites/reforce
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
npm run build && npm start   # produção local
```

## Publicar (Vercel)
Importe a pasta `sites/reforce` como projeto (Root Directory = `sites/reforce`) e cadastre
`NEXT_PUBLIC_SITE_URL` com o domínio final. Cabeçalhos de segurança (CSP, HSTS, anti-iframe) estão em
`next.config.ts`.

## Prévia em arquivo único (para enviar ao cliente)
Gera `entregas/reforce-preview.html` (~2,5 MB, imagens e fontes embutidas); abre direto no navegador.

```bash
cd sites/reforce && npm run build && npm start          # em outro terminal
cd sites/_fontes/reforce && npm install && node preview/build-preview.mjs http://localhost:3000
```

## Seções e experiências (tudo preso à rolagem: ao descer acontece, ao subir se desfaz)
- **Abertura:** o R da marca se desenha em linha; a pílula enche como barra de avanço; o título sobe linha a
  linha. Ao rolar, as três linhas do título se separam para lados diferentes, o R gira e se afasta e, no painel
  da curva S (ilustração), o "realizado" continua se desenhando e o marcador "hoje" anda até o fim do plano.
  A faixa dos setores corre de lado e inclina com a velocidade da rolagem.
- **Números:** cada número vira de baixo para cima (3D), a barra lateral cresce e o valor conta.
- **Abordagem:** o cronograma fica fixo ao lado (no celular, no topo) e os três passos rolam: cada passo que
  chega troca o estado (tradicional com atraso de +9 dias → no prazo → rotinas diárias). Os passos também são botões.
- **Setores:** a seção fixa e os cartões passam da direita para a esquerda **em qualquer tela**, girando em 3D ao
  cruzar o centro, com a foto andando ao contrário (profundidade). Contador, barra e setas.
- **Atuações:** a seção fixa (no celular, o carrossel) e cada atuação fica parada um trecho e desliza para a
  próxima; o conteúdo do cartão entra em cascata. Botões, setas e teclado (← →, Home, End) pulam para a atuação.
- **Método:** no desktop a seção fixa, a linha atravessa a tela e cada fase sobe girando quando a linha chega;
  o número grande acompanha a fase. No celular e no tablet, a linha desce na vertical.
- **Tecnologia:** as telas reais saem deitadas em 3D e levantam; os números voam dos lados até as bordas da tela;
  os quatro recursos chegam de lado, como numa esteira. Clicar amplia a tela.
- **Campo:** duas fileiras de fotos andam em sentidos opostos; cada foto abre de um recorte com zoom. Clique amplia.
- **Cases:** no desktop, os cases se empilham (o de baixo cobre o de cima, que encolhe e escurece); no celular
  entram de lados alternados. Números contam, a barra do valor capturado cresce e os 3 projetos se abrem em leque.
- **Presença:** o mapa levanta em 3D, os estados acendem um a um (RS, SP, RJ, MG, AM) junto com a lista, os
  escritórios aparecem e as rotas se desenham (no desktop a seção fixa durante a sequência).
- **Diferenciais:** os cartões entram pela direita e a seta gira até apontar.
- **Equipe:** os cartões da liderança abrem de um recorte com zoom na foto; as colunas da equipe sobem em
  velocidades diferentes (paralaxe). Filtro por área.
- **Valores:** a linha em degradê se desenha, o número entra pela esquerda e o texto pela direita; o R gigante gira ao fundo.
- **Contato e rodapé:** o formulário levanta em 3D, a rede do Brasil gira ao fundo; no fim, o logo gigante sobe.
- **Palavras gigantes de contorno** ("Resultados", "No campo", "Jornada da execução"…) correm atrás das seções.
- **Carrosséis sem animação** (reduzir movimento ligado): trilhos de rolagem lateral com dedo, **arrastar com o
  mouse** e setas.
- **Diagnóstico rápido:** a mensagem sai pronta para o WhatsApp ou o e-mail comercial. O site não guarda dados.
- **Geral:** rolagem suave (Lenis), barra de "avanço da leitura" no cabeçalho, link da seção atual marcado.
  As animações (GSAP) carregam na primeira interação ou quando o navegador fica ocioso, para não atrasar a abertura.

## Qualidade (Lighthouse 12, `next start` local, sem compressão)
- Celular: Desempenho 85 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 3,4 s · TBT 300 ms · CLS 0)
- Desktop: Desempenho 100 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 0,8 s · CLS 0)
- Na Vercel o HTML vai comprimido (brotli), o que costuma subir a nota do celular.

## Confirmar com a Reforce antes de publicar
1. **Cliente citado:** a apresentação cita a **Gerdau** nos cases e nos projetos em andamento (Blendagem R$ 380 mi,
   AGF R$ 85 mi, Drenagem R$ 55 mi; R$ 6,1 mi capturados). Confirmar autorização para publicar nome e valores
   num site aberto. Para tirar o nome, mude `cases.valor.titulo` e `cases.projetos.texto` em `site.ts`.
2. **Painéis e fotos de campo:** as telas mostram nomes de responsáveis e as fotos mostram pessoas de outras
   empresas. Confirmar que podem ir para o site público.
3. **WhatsApp:** o botão usa o telefone da apresentação (+55 51 98209-8161). Confirmar que é WhatsApp.
4. **Domínio:** o padrão é `reforceconsultoria.com.br` (do e-mail comercial). Ajuste em `NEXT_PUBLIC_SITE_URL`.
5. **Cidade da sede:** está "Sapucaia – RS", como no PDF (provavelmente Sapucaia do Sul).
6. **Textos de apoio escritos para o site** (não estão no PDF): frases das seções (ex.: "O plano acontece no campo",
   "Gente que já esteve na parada, no canteiro e na mesa de decisão"), a linha de cada setor, os três tópicos de
   cada passo da Abordagem e o cronograma ilustrativo dessa seção (marcado como "ilustração").

## Imagens
- Extraídas do PDF: `sites/_fontes/reforce/originais/` (JPG de alta qualidade). O site usa WebP gerado por
  `python3 -I scripts/preparar-imagens.py ../../reforce/src/assets/img` (de `sites/_fontes/reforce`).
- As fotos de setores (siderurgia, mineração etc.) têm pouca resolução no PDF (416 px) e são ilustrativas: estão
  marcadas como "Imagens ilustrativas". Se a Reforce tiver fotos próprias em alta, troque os arquivos `setor-*`.
- Os retratos da equipe entram como no PDF: só recorte quadrado e redução, sem retoque.
- **Logo:** vetorizado do PNG da apresentação (`scripts/vetorizar-logo.py` → `logo-reforce.svg` e `marca-r.svg`;
  `scripts/gerar-logo-ts.py` copia para o site). Se a Reforce tiver o logo original em SVG/PDF vetorial, substitua.
- Imagem de compartilhamento e ícone da Apple: `og-src.html` e `icon-src.html` (`node render-og.mjs`, com Playwright).
- Mapa do Brasil: [SVG Maps](https://github.com/VictorCazanave/svg-maps), licença CC BY 4.0 (crédito no rodapé).

## Medição (opcional)
O site não tem Google Tag Manager, Pixel nem cookies. Para medir, copie o padrão de consentimento de
`sites/rise` (`Tracking.tsx`, `lib/tracking.ts`), libere os hosts na CSP de `next.config.ts` e atualize a
política de privacidade (`src/app/politica-de-privacidade/page.tsx`).
