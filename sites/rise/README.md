# Site — Mentoria RISE · Aceleração para donos de agência, com o Hermano

Landing page em **Next.js 16** (App Router, TypeScript, Tailwind 4) com rolagem suave (**Lenis**) e
animações por rolagem (**GSAP + ScrollTrigger**). Junta os conteúdos de skillsales.com.br e
hermanodotrafego.com.br em um site só; quando os dois divergiam, valeu o skillsales (versão mais nova).
A galeria de depoimentos em vídeo usa o mesmo desenho dos cases do site da LAKS.

Todos os textos ficam em `src/content/site.ts`. As animações ficam em `src/lib/motion.ts` e seguem a
rolagem nos dois sentidos (descendo acontecem, subindo se desfazem). Sem JavaScript ou com "reduzir
movimento" ativado no aparelho, a página aparece completa, no estado final.

## Rodar

```bash
cd sites/rise
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
npm run build && npm start   # produção local
```

## Prévia em arquivo único (para enviar ao cliente)
Gera `entregas/rise-preview.html` (~9 MB) com imagens, fontes, animações e vídeos embutidos; abre direto
no navegador, sem servidor. Os vídeos vão em qualidade reduzida.

```bash
cd sites/rise && npm run build && npm start          # em outro terminal
cd sites/_fontes/rise && npm install && node preview/build-preview.mjs http://localhost:3000
```

A imagem de compartilhamento e o ícone da Apple saem de `sites/_fontes/rise/og-src.html` e `icon-src.html`
(`node render-og.mjs`, com Playwright).

## Experiências por seção
- **Abertura:** título sobe palavra por palavra; brasas douradas sobem num canvas (reagem ao mouse e aceleram
  com a rolagem); a foto aproxima ao rolar e acompanha o mouse.
- **"Você já tem cliente…":** linha de leitura desce pela lista, acende cada gargalo e o painel conta 0/4 → 4/4.
- **"A RISE não é fuga. É método.":** tela fixa; risco corta "fuga", as letras desmoronam e "método" sobe letra a letra.
- **Para quem é:** autodiagnóstico — a pessoa marca o que vale para a agência, o medidor responde e, com 3 ou
  mais, aparece o botão de aplicação (evento `autodiagnostico` no dataLayer, com a quantidade marcada).
- **Estrutura:** frase apaga e acende palavra a palavra; os sintomas caem como dominós.
- **Entregas:** desktop — ingressos saem de um monte e se espalham; inclinam e brilham seguindo o mouse.
  Celular — baralho: a seção fixa e cada ingresso sai para o lado.
- **Mentoria anual:** focos enchem de dourado; pilares com "lanterna" que segue o mouse.
- **Resultados:** soma das 6 placas (R$ 200 mil → R$ 815 mil), barras crescendo e print em janela.
- **Depoimentos:** galeria igual à da LAKS; no desktop o vídeo toca sem som ao passar o mouse.
- **Hermano:** foto fixa ao lado e linha do tempo que acende marco a marco.
- **Chamada final:** brasas de novo, fechando o ciclo da abertura.
- **Geral:** cursor dourado com rótulo ("Aplicar", "Assistir", "Ver print"), reflexo de luz nos botões, menu marca a
  seção na tela e, no celular, barra fixa com o botão de aplicação (some na abertura e na chamada final).

Tudo segue a rolagem nos dois sentidos. Com "reduzir movimento" ou sem JavaScript, a página aparece no estado
final (sem brasas nem cursor). Com "reduzir movimento" o autodiagnóstico funciona normalmente; sem JavaScript as
caixas ainda podem ser marcadas, mas o medidor não responde.

## Aplicação (formulário)
Os botões "Aplicar para uma vaga" abrem o formulário do Respondi (`NEXT_PUBLIC_FORM_URL`) em nova aba. Os
parâmetros de campanha da primeira página vista na sessão (utm_*, gclid, fbclid) vão junto no link. Cada
clique dispara `cta_clique` no dataLayer, com o local do botão (`hero`, `header`, `final`…).

## Publicar na Vercel
1. Importe o repositório e defina **Root Directory = `sites/rise`** (framework: Next.js).
2. Em *Environment Variables*, cadastre as variáveis de `.env.example` (os IDs do site atual já estão lá).
   São lidas no build: depois de mudar, faça um novo deploy.
3. Aponte o domínio para o projeto e ajuste `NEXT_PUBLIC_SITE_URL`.

## Antes de publicar (confirmar com o cliente)
Tudo que depende do cliente está em `src/content/site.ts`, marcado com **CONFIRMAR**:
- Nomes e agências de quem fala nos depoimentos em vídeo (só o Rafael se apresenta pelo nome).
- Razão social, CNPJ e e-mail para pedidos de titulares (LGPD), usados na política de privacidade.
- Qual formulário vale: o do skillsales (`…/BPhjlgeA`, padrão) ou o do hermanodotrafego (`…/qNHe1Ohp`).
- Números que mudaram entre os dois sites (foi usado o mais novo): público acima de R$ 30 mil/mês,
  500+ agências, 350+ clientes da LAKS, operação de R$ 1 milhão/mês.
- A foto da seção "Hermano" veio do site atual (resolução baixa, 450×500); se houver uma maior, troque
  `src/assets/img/hermano-bio.webp`.

## Material de origem
Fotos, prints, logo e vídeos originais estão em `sites/_fontes/rise/`, com as anotações em `notas.md`.
