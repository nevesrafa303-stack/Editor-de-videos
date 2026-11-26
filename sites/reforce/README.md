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

## Seções e experiências
- **Abertura:** o R da marca se desenha em linha (como um traço de projeto), a pílula em degradê enche como
  barra de avanço, o título sobe linha a linha e um painel flutuante mostra a curva S (previsto x realizado,
  marcada como ilustração) com dois números reais da apresentação (95,87% das restrições concluídas; parada
  entregue antes do prazo). Faixa dos 5 setores anda com a rolagem.
- **Números:** +25 consultores, 5 estados, R$ 6,1 mi capturados em 16 meses, R$ 520 mi em projetos de capital.
- **Abordagem (o "uau" principal):** cronograma de uma parada em três estados. No modelo tradicional as tarefas
  escorregam e estouram o prazo (+9 dias); com a abordagem da Reforce ficam no plano; no resultado aparecem as
  rotinas diárias. No desktop a seção fica fixa e a rolagem troca os estados; os botões também trocam.
- **Setores:** galeria que corre na horizontal com a rolagem (no celular, carrossel de arrastar).
- **Atuações:** abas acessíveis (teclado) com as 5 atuações, entregas e o fluxo de cada uma (jornada da
  execução, ciclo de paradas, fluxo de materiais, riscos contratuais, rotinas de campo).
- **Método:** linha da jornada (4 fases) que avança e acende cada fase.
- **Tecnologia:** os dois painéis reais (SKIDS PBT e restrições) numa moldura que inclina com o mouse; clique amplia.
- **Campo:** mosaico das 6 fotos de campo com paralaxe; clique amplia com a legenda.
- **Cases:** 3 cases empilhados (o próximo cartão sobe por cima), contadores, barra do valor capturado
  (R$ 3,5 mi + R$ 2,6 mi = R$ 6,1 mi) e os 3 projetos em andamento com a fatia de cada um em R$ 520 mi.
- **Presença nacional:** mapa do Brasil com RS, SP, RJ, MG e AM acesos, escritórios de Sapucaia (sede) e Ouro
  Branco (filial) e rotas de mobilização que se desenham. Passar o mouse num estado da lista acende o estado.
- **Diferenciais, liderança (3), equipe (12, com filtro por área) e valores (5).**
- **Contato:** "Diagnóstico rápido" — a pessoa marca a demanda, o segmento e o momento do projeto, preenche os
  dados e a mensagem sai pronta para o WhatsApp ou o e-mail comercial. O site não guarda dados (não há
  servidor de formulário). Validação só depois da interação (`:user-invalid`), com `aria-invalid` sincronizado.
- **Geral:** barra de "avanço da leitura" em degradê no cabeçalho, link da seção atual marcado no menu.

## Qualidade (Lighthouse 12, `next start` local)
- Celular: Desempenho 92 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 2,9 s · TBT 190 ms · CLS 0)
- Desktop: Desempenho 100 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 0,8 s · CLS 0)

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
   "Gente que já esteve na parada, no canteiro e na mesa de decisão"), a linha de cada setor e o cronograma
   ilustrativo da seção Abordagem (marcado como "ilustração").

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
