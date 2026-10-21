# Site — LAKS Company · Marketing e vendas para corretoras

Landing page em **Next.js 16** (App Router, TypeScript, Tailwind 4) com rolagem suave (**Lenis**) e
animações por rolagem (**GSAP + ScrollTrigger**). Recria o lakscompany.com.br com mais autoridade:
depoimentos em vídeo, Método MAPA, números, equipe e formulário de diagnóstico.

## Rodar

```bash
cd sites/laks
npm install
cp .env.example .env.local   # preencha o webhook dos leads
npm run dev                  # http://localhost:3000
npm run build && npm start   # produção local
```

## Prévia em arquivo único (para enviar ao cliente)
Gera `entregas/laks-preview.html` (~8,5 MB) com imagens, fontes, animações e vídeos embutidos; abre direto
no navegador, sem servidor. O formulário só valida (não envia) e os vídeos vão em qualidade reduzida.

```bash
cd sites/laks && npm run build && npm start          # em outro terminal
cd sites/_fontes/laks && npm install && node preview/build-preview.mjs http://localhost:3000
```

## Publicar na Vercel
1. Importe o repositório e defina **Root Directory = `sites/laks`** (framework: Next.js).
2. Em *Environment Variables*, cadastre as variáveis de `.env.example`:
   - `LEAD_WEBHOOK_URL` **(obrigatória)**: sem ela o formulário responde erro e o lead não chega.
   - `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_CLARITY_ID`: os IDs do site atual já estão no exemplo.
     São lidos no build: depois de mudar, faça um novo deploy.
3. Aponte o domínio `lakscompany.com.br` para o projeto.

## Antes de publicar (confirmar com o cliente)
Tudo que depende do cliente está em `src/content/site.ts`, marcado com **CONFIRMAR**:
- Nome e cargo do fundador (as fotos aparecem sem nome).
- Nomes de quem fala nos depoimentos da **Fiorano Seguros** e da **Malta & Nardelli**.
- Nome da corretora do logo de escudo "M" (faixa de clientes).
- E-mail de contato / encarregado de dados (LGPD). Sem ele, a política de privacidade aponta para o Instagram.
- Revisar os textos da página e da **política de privacidade** (`src/app/politica-de-privacidade/page.tsx`).

## Formulário de leads
- Mesmos campos e opções do site anterior (`src/lib/lead.ts`), validados no navegador e de novo na API (`src/app/api/lead/route.ts`).
- A API envia um JSON para `LEAD_WEBHOOK_URL` com os campos, `qualificado`, página de origem e UTMs/gclid/fbclid da visita.
- Proteções: campo-armadilha para robôs, tempo mínimo de preenchimento, checagem de origem, limite de 5 envios por IP a cada 10 min e limite de tamanho.
- Depois do envio, o visitante vai para **`/obrigado2`** (faturamento a partir de R$ 10 mil) ou **`/obrigado1`** (abaixo de R$ 10 mil), as mesmas URLs do site anterior.
  As conversões personalizadas por URL nas campanhas continuam funcionando.

## Medição e LGPD
- **GTM** carrega com Consent Mode v2 em "negado"; **Pixel da Meta** e **Clarity** só carregam depois de "Aceitar" no aviso de cookies.
  O rodapé tem "Preferências de cookies" para mudar a escolha.
- Eventos enviados ao `dataLayer`: `lead_enviado` (com `lead_qualificado`, `faturamento`, `conheceu`, `trafego`), `pagina_obrigado`,
  `form_inicio`, `form_erro_validacao`, `form_erro_envio`, `cta_clique` (com `local`) e `depoimento_play`.
- Se o time de tráfego adicionar no GTM uma ferramenta de outro domínio, inclua o domínio na lista de `next.config.ts` (CSP).

## Onde mexer
| O quê | Arquivo |
|---|---|
| Textos, números, depoimentos, contatos | `src/content/site.ts` |
| Seções da página | `src/components/*.tsx` (ordem em `src/app/page.tsx`) |
| Animações de rolagem | `src/lib/motion.ts` (as seções marcam o que anima com `data-*`; usado também pela prévia) |
| Cabeçalho na rolagem (fundo, some/volta, barra de progresso) | `src/lib/cabecalho.ts` |
| Cores e fontes | `src/app/globals.css` (`@theme`) e `src/app/layout.tsx` |
| Cabeçalhos de segurança (CSP etc.) | `next.config.ts` |
| Imagem de compartilhamento e ícone | `../_fontes/laks/og-src.html`, `icon-src.html` → `node render-og.mjs` |

Fotos originais e vídeos-fonte ficam em `../_fontes/laks/`. Os depoimentos foram comprimidos para web (H.264, ~19 MB no total)
e só carregam quando o visitante clica em assistir.

## Movimentos de rolagem
- Títulos entram linha a linha (SplitText); hero com foto que aproxima e cubos das operadoras em profundidade (seguem o mouse no desktop).
- Manifesto em cena fixa com as palavras acendendo; faixa de texto grande correndo em sentidos opostos.
- Método MAPA com título fixo, indicador M·A·P·A e etapas que acendem; depoimentos em rolagem horizontal com
  barra de progresso e vídeos que giram e crescem ao entrar (desktop).
- Tudo ligado à rolagem em tempo real: ao subir, os movimentos se desfazem; ao descer de novo, acontecem outra vez
  (inclusive os contadores). A faixa de logos troca de sentido com a rolagem e os textos grandes inclinam com a velocidade.
- Foto do fundador que abre até a largura total; propósito em faixa laranja com palavras em movimento; marca gigante no rodapé.
- Botões principais magnéticos (só com mouse); cabeçalho some ao descer, volta ao subir e mostra o progresso da leitura.

## Acessibilidade e movimento
Com "reduzir movimento" ativado no sistema, a rolagem suave e as animações são desligadas e o conteúdo aparece completo.
Sem JavaScript, a página também mostra todo o conteúdo.
