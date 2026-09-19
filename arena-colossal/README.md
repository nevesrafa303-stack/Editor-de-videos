# Arena Colossal — plataforma digital

Site premium + sistema real de agendamento para a **Arena Colossal**, estética
automotiva em Balneário Camboriú — SC.

Não é uma landing page: é marca, portfólio, experiência e agendamento no mesmo
lugar, com backend próprio, banco de dados, Google Calendar, WhatsApp e e-mail.

---

## 1. Arquitetura

```
Navegador
   │  (só fala com o próprio domínio — nenhuma credencial no cliente)
   ▼
Next.js App Router ──────────────────────────────────────────────┐
   │                                                             │
   ├── Páginas (React Server Components + ilhas de cliente)      │
   │                                                             │
   └── API Routes                                                │
         ├── GET  /api/booking-config   janela de datas          │
         ├── GET  /api/availability     grade de horários        │
         ├── POST /api/bookings         cria o agendamento       │
         ├── POST /api/bookings/confirm estado + notificações    │
         └── GET  /api/health           diagnóstico de config    │
                │                                                │
                ▼                                                │
         Camada de serviços (src/services)                       │
         ├── booking/    regras de agenda e orquestração         │
         ├── calendar/   Google Calendar API v3                  │
         ├── email/      Resend                                  │
         ├── whatsapp/   Meta WhatsApp Cloud API                 │
         └── captcha/    Cloudflare Turnstile                    │
                │                                                │
                ▼                                                │
         Repositório (src/db) ── Prisma/PostgreSQL ── ou memória ┘
```

### Princípios que sustentam o código

1. **O agendamento é salvo primeiro.** Calendar, WhatsApp e e-mail acontecem
   *depois* da persistência e nunca derrubam a reserva. Cada canal grava seu
   resultado em `Notification` (`sent`/`failed`/`skipped`) para reprocessamento.
2. **Nenhum segredo no frontend.** Todo módulo com credencial importa
   `server-only` — se algum componente de cliente tentar importá-lo, o build
   quebra. O navegador só conversa com `/api/*`.
3. **Validação dupla, confiança única.** Frontend e backend usam o mesmo schema
   Zod; só a do backend decide.
4. **Reserva dupla é impedida no banco.** A inserção roda em transação
   `SERIALIZABLE` com contagem de sobreposição — não em `if` no JavaScript.
5. **Nada é inventado.** Endereço, horário, avaliações e fotos aparecem só
   quando configurados. Enquanto não existem, a seção some ou assume um estado
   honesto.
6. **Degradação é prevista, não acidental.** Sem banco → driver em memória.
   Sem Calendar → grade calculada só com o banco, com aviso. Sem WhatsApp/e-mail
   → agendamento normal, notificação marcada como `skipped`.

---

## 2. Estrutura de pastas

```
arena-colossal/
├── prisma/
│   └── schema.prisma              modelo de dados (PostgreSQL)
├── prisma.config.ts               config do Prisma CLI
├── public/images/                 fotos reais da Arena (ver §9)
│   ├── hero/ services/ process/ before-after/ team/ location/
└── src/
    ├── app/
    │   ├── layout.tsx             fontes, SEO, JSON-LD, shell da página
    │   ├── page.tsx               composição narrativa da home
    │   ├── globals.css            design system (tokens + primitivas)
    │   ├── icon.tsx               favicon gerado no build
    │   ├── opengraph-image.tsx    imagem de compartilhamento gerada no build
    │   ├── robots.ts / sitemap.ts
    │   ├── politica-de-privacidade/
    │   └── api/
    │       ├── booking-config/    janela de datas (runtime)
    │       ├── availability/      grade de horários do dia
    │       ├── bookings/          criação do agendamento
    │       ├── bookings/confirm/  estado + status de notificações
    │       └── health/            diagnóstico de configuração
    ├── components/
    │   ├── layout/                Navbar, Footer, Preloader, SmoothScroll,
    │   │                          CustomCursor, MobileActionBar, WhatsAppLink
    │   ├── sections/              as 11 seções da home
    │   ├── booking/               formulário de agendamento (5 etapas)
    │   ├── ui/                    Button, SectionTitle, AnimatedText,
    │   │                          Reveal, MediaFrame
    │   └── analytics/             GA4 / GTM / Meta Pixel
    ├── db/                        contrato + drivers (Prisma e memória)
    ├── lib/
    │   ├── config/                env do servidor, site público, serviços,
    │   │                          avaliações
    │   ├── hooks/ motion.ts       carregamento sob demanda do GSAP
    │   ├── http/                  rate limit, respostas de erro
    │   ├── seo/                   JSON-LD
    │   ├── utils/                 fuso horário, formatação, ICS
    │   ├── validation/            schemas Zod compartilhados
    │   └── images.ts              inventário de fotos existentes
    └── services/                  calendar, email, whatsapp, booking, captcha
```

---

## 3. Tecnologias

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | RSC, rotas de API no mesmo deploy, otimização de imagem |
| Linguagem | **TypeScript** estrito | `strict` + `noUncheckedIndexedAccess` |
| Estilo | **CSS Modules + tokens** | controle fino de motion; sem CSS utilitário no HTML |
| Animação | **GSAP + ScrollTrigger**, carregado sob demanda | fora do bundle inicial; só onde há scroll-linked |
| Smooth scroll | **Lenis**, só no desktop | no mobile o scroll nativo ganha |
| Validação | **Zod 4** | um schema para cliente e servidor |
| Banco | **PostgreSQL + Prisma 7** | transação serializável para a reserva |
| Calendar | **Google Calendar API v3** via REST | 3 chamadas; a lib oficial seria peso morto |
| E-mail | **Resend** via REST | trocável em um arquivo |
| WhatsApp | **Meta WhatsApp Cloud API** | API oficial; nada de automação de WhatsApp Web |
| Anti-spam | **Turnstile + rate limit + honeypot** | três camadas independentes |

---

## 4. Componentes criados

**UI** — `Button` (com hover magnético), `SectionTitle`, `AnimatedText`
(revelação palavra a palavra), `Reveal`, `MediaFrame` (imagem real ou
placeholder elegante), `AvailableImagesProvider`.

**Layout** — `Navbar` (transparente sobre o hero, blur após o scroll, menu
fullscreen com foco preso), `Footer`, `Preloader`, `SmoothScroll`,
`CustomCursor`, `MobileActionBar`, `WhatsAppLink`.

**Seções** — `Hero`, `Manifesto`, `ServicesMarquee` (faixa em movimento),
`Services` (scroll horizontal fixado no desktop, lista completa no mobile),
`DetailHotspots`, `Standards` (critério técnico), `Process` (timeline com
progresso amarrado ao scroll), `BeforeAfter` (comparador arrastável),
`Reviews`, `BrandExperience`, `Audience` (quando procurar), `Faq`, `Location`,
`BookingSection`, `FinalCta`.

**Agendamento** — `BookingWizard`, `ProgressSteps`, `ServiceStep`, `DateStep`,
`TimeStep`, `DetailsStep`, `ReviewStep`, `Confirmation`, `Turnstile`,
`ServiceShortcut`.

---

## 5. Fluxo do agendamento

```
01 SERVIÇO ─ 02 DATA ─ 03 HORÁRIO ─ 04 DADOS ─ 05 CONFIRMAÇÃO ─ CONFIRMADO
```

1. **Serviço** — catálogo de `src/lib/config/services.ts`; a duração define o
   bloco reservado. Pode vir pré-selecionado por um atalho da seção "Quando
   procurar a Arena" ou por um link compartilhável
   (`/?servico=polimento-tecnico#agendamento`); o slug é validado contra o
   catálogo antes de virar estado.
2. **Data** — faixa de dias vinda de `/api/booking-config`. Dias fechados e
   datas bloqueadas já chegam desabilitados.
3. **Horário** — `/api/availability` cruza a grade de trabalho com os
   agendamentos do banco **e** o `freeBusy` do Google Calendar. Ocupados
   aparecem riscados, não somem.
4. **Dados** — cliente + veículo + observações + consentimento.
5. **Confirmação** — resumo, Turnstile e envio.

No servidor, `POST /api/bookings`:

```
rate limit → honeypot → Turnstile → Zod → revalida o horário
   → INSERT em transação SERIALIZABLE (barreira anti reserva dupla)
   → em paralelo e sem derrubar nada:
        Google Calendar · WhatsApp da equipe · e-mail interno · e-mail do cliente
   → status = confirmed → resumo devolvido ao cliente
```

### Erros previstos

| Situação | O que o cliente vê |
| --- | --- |
| Horário tomado no meio do processo | "Esse horário acabou de ser reservado…" e volta para a grade |
| Google Calendar fora do ar | Horários continuam listados, com aviso; a reserva acontece |
| Falha ao salvar | "Não conseguimos confirmar esse horário agora…" + WhatsApp |
| Agenda não configurada | Mensagem honesta + WhatsApp (nunca um formulário que não reserva) |
| WhatsApp/e-mail falham | Nada — o agendamento está salvo; a falha vira `Notification` |

---

## 6. Integrações necessárias

| Integração | Sem ela | Onde conectar |
| --- | --- | --- |
| PostgreSQL | driver em memória (dados somem no restart) | `DATABASE_URL` |
| Google Calendar | evento não é criado; disponibilidade só do banco | §10.2 |
| Resend | nenhum e-mail sai | §10.3 |
| WhatsApp Cloud API | equipe não recebe aviso | §10.4 |
| Turnstile | só rate limit + honeypot | §10.5 |
| GA4 / GTM / Meta Pixel | sem medição de funil | IDs no `.env` |

---

## 7. Variáveis de ambiente

Todas estão documentadas, uma a uma, em **`.env.example`**. Resumo:

| Variável | Onde vive | Para quê |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | público | SEO, Open Graph, sitemap |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | público | botões de WhatsApp |
| `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_CONTACT_EMAIL` | público | rodapé |
| `NEXT_PUBLIC_ADDRESS_*`, `NEXT_PUBLIC_LAT/LNG`, `NEXT_PUBLIC_GOOGLE_PLACE_ID` | público | seção de localização e JSON-LD |
| `BOOKING_TIMEZONE`, `BOOKING_HOURS`, `BOOKING_SLOT_MINUTES`, `BOOKING_MIN_NOTICE_HOURS`, `BOOKING_MAX_ADVANCE_DAYS`, `BOOKING_CONCURRENCY`, `BOOKING_BLACKOUT_DATES` | **servidor** | regras da agenda |
| `DATABASE_URL` | **servidor** | PostgreSQL |
| `GOOGLE_CALENDAR_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | **servidor / segredo** | Google Calendar |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO_INTERNAL` | **servidor / segredo** | e-mail |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_NOTIFY_TO`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | **servidor / segredo** | WhatsApp |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | público / **segredo** | anti-spam |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | público | analytics |
| `RATE_LIMIT_BOOKINGS_PER_HOUR` | servidor | limite por IP |

> **Regra inegociável:** nada com `NEXT_PUBLIC_` pode ser segredo — esse prefixo
> embute o valor no JavaScript entregue ao navegador.

> **Variável mudou? Refaça o deploy.** Valores `NEXT_PUBLIC_*` e o horário
> exibido no rodapé são resolvidos no build.

---

## 8. Como executar localmente

```bash
cd arena-colossal
npm install
cp .env.example .env.local     # preencha pelo menos BOOKING_HOURS
npm run dev                    # http://localhost:3000
```

Sem `DATABASE_URL` o site sobe com o driver em memória: dá para percorrer o
agendamento inteiro, ver o horário sumir da grade e checar as notificações.
**Confira `http://localhost:3000/api/health`** — ele lista o que falta conectar.

Com PostgreSQL:

```bash
export DATABASE_URL="postgresql://usuario:senha@localhost:5432/arena_colossal"
npm run db:generate
npm run db:push        # ou: npm run db:migrate
npm run dev
```

Outros comandos: `npm run typecheck`, `npm run build`, `npm run start`,
`npm run db:studio`.

---

## 9. Imagens

Solte os arquivos nestes caminhos e as fotos reais assumem no lugar dos
placeholders (nenhuma alteração de código):

```
public/images/hero/hero.jpg                     abertura, tela cheia
public/images/services/<slug>.jpg               um por serviço, slugs em src/lib/config/services.ts
public/images/services/detalhes.jpg             foto do mapa de hotspots
public/images/before-after/caso-0N-antes.jpg    comparador (N = 1..3)
public/images/before-after/caso-0N-depois.jpg
public/images/team/ambiente.jpg                 seção "A Arena por dentro"
public/images/process/equipe.jpg
public/images/process/produtos.jpg
public/images/process/detalhe.jpg
```

Recomendações: 2000px no lado maior, `.jpg` de boa qualidade (o Next converte
para AVIF/WebP e gera os tamanhos). **Depois de adicionar fotos, refaça o
build** — o inventário de imagens é montado no build para não disparar
requisições quebradas enquanto as fotos não existem.

---

## 10. O que ainda precisa ser configurado manualmente

### 10.1 Dados da Arena (obrigatório antes de publicar)

- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` — sem ele, **todo botão de WhatsApp some**.
- [ ] `BOOKING_HOURS` — horário real de atendimento. Sem ele não existe grade.
- [ ] `BOOKING_CONCURRENCY` — quantos veículos a Arena atende no mesmo horário.
- [ ] `durationMinutes` de cada serviço em `src/lib/config/services.ts` — os
      valores atuais são **padrões de partida**, não a operação real.
- [ ] Endereço (`NEXT_PUBLIC_ADDRESS_*`, `NEXT_PUBLIC_LAT/LNG`). Enquanto vazio,
      o site mostra só "Balneário Camboriú — SC" e não inventa endereço.
- [ ] `NEXT_PUBLIC_SITE_URL` — domínio final.

### 10.2 Google Calendar

1. Google Cloud Console → novo projeto → ative a **Google Calendar API**.
2. *Credenciais* → *ID do cliente OAuth* → tipo **Aplicativo da Web**.
   Em "URIs de redirecionamento autorizados" adicione
   `https://developers.google.com/oauthplayground`.
   Guarde **Client ID** e **Client Secret**.
3. Em [OAuth Playground](https://developers.google.com/oauthplayground):
   engrenagem → *Use your own OAuth credentials* → cole ID e Secret →
   escopo `https://www.googleapis.com/auth/calendar` → autorize com a conta
   Google **da Arena** → *Exchange authorization code for tokens* →
   copie o **refresh token**.
4. No Google Calendar, abra a agenda que receberá os eventos →
   *Configurações* → **ID da agenda** (algo como `...@group.calendar.google.com`).
5. Preencha `GOOGLE_CALENDAR_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `GOOGLE_REFRESH_TOKEN`.

> O refresh token é revogado se a senha da conta mudar ou se o app ficar em
> "Testing" por mais de 7 dias na tela de consentimento. Publique o app.

### 10.3 E-mail (Resend)

1. Crie a conta e **verifique o domínio** da Arena (SPF + DKIM).
2. Gere uma API key → `RESEND_API_KEY`.
3. `EMAIL_FROM` precisa usar o domínio verificado
   (ex.: `Arena Colossal <agenda@dominio.com.br>`).
4. `EMAIL_TO_INTERNAL` — caixa que recebe a cópia de cada agendamento.

### 10.4 WhatsApp (Meta Cloud API)

1. Meta for Developers → app do tipo *Business* → produto **WhatsApp**.
2. Anote o **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`.
3. Gere um **token permanente** (usuário do sistema, permissões
   `whatsapp_business_messaging` + `whatsapp_business_management`) →
   `WHATSAPP_ACCESS_TOKEN`.
4. `WHATSAPP_NOTIFY_TO` — número da equipe, em E.164 só com dígitos.
5. **Template** (necessário fora da janela de 24h): crie um template de
   `UTILITY` em pt_BR com seis variáveis, nesta ordem —
   `{{1}}` cliente, `{{2}}` WhatsApp, `{{3}}` serviço, `{{4}}` veículo,
   `{{5}}` data, `{{6}}` horário. Depois de aprovado, informe o nome em
   `WHATSAPP_TEMPLATE_NAME`.
   Sem template configurado o sistema envia texto simples, que só é entregue
   dentro da janela de 24h.

### 10.5 Turnstile

Cloudflare → *Turnstile* → adicione o domínio →
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` (pública) e `TURNSTILE_SECRET_KEY` (segredo).

### 10.6 Conteúdo

- [ ] Fotos reais (§9) — sem elas o site funciona, mas com placeholders.
- [ ] Avaliações reais em `src/lib/config/reviews.ts`. **O arquivo nasce vazio
      de propósito**; a seção mostra um estado honesto até haver depoimento
      autorizado. Nenhuma avaliação foi inventada.
- [ ] Casos de antes/depois em `src/components/sections/BeforeAfter.tsx`
      (ajuste o `label` para o serviço realmente executado).
- [ ] **Revisar os textos de marca** com a Arena: `Standards.tsx` (critério
      técnico), `Audience.tsx` (quando procurar) e `src/lib/config/faq.ts`.
      São afirmações sobre método e operação — nenhuma inventa preço, prazo,
      garantia ou número, mas todas falam em nome da Arena e precisam do aval
      de quem toca a oficina. O FAQ em especial vira **dados estruturados no
      Google**: resposta errada ali é resposta errada na busca.
- [ ] Revisar a política de privacidade com quem cuida do jurídico
      (prazo de retenção e encarregado de dados não foram preenchidos).

---

## 11. Como publicar em produção

### Vercel (caminho mais curto)

1. Importe o repositório; **Root Directory = `arena-colossal`**.
2. Build Command: `npm run build` · Install: `npm install`.
3. Cadastre as variáveis de ambiente (§7) em *Production*.
4. Banco: Vercel Postgres, Neon ou Supabase → copie a connection string para
   `DATABASE_URL`.
5. Rode as migrações uma vez, da sua máquina, apontando para o banco de produção:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   ```
6. Deploy e abra **`/api/health`**: `status` precisa ser `ready` e
   `storageDriver` precisa ser `prisma`.
7. Aponte o domínio e confira `NEXT_PUBLIC_SITE_URL`.

### Qualquer host com Node 20+

```bash
npm ci
npm run db:generate
npm run build
npm run start        # escuta em $PORT
```

Requisitos: rodar atrás de HTTPS e de um proxy que reescreva
`x-forwarded-for` (o rate limit depende disso).

### Checklist pós-deploy

- [ ] `/api/health` → `status: ready`, `storageDriver: prisma`
- [ ] Um agendamento de teste de ponta a ponta
- [ ] O evento apareceu no Google Calendar da Arena
- [ ] A equipe recebeu o WhatsApp e o e-mail interno
- [ ] O cliente recebeu a confirmação por e-mail
- [ ] O horário de teste sumiu da grade
- [ ] `/sitemap.xml` e `/robots.txt` com o domínio certo
- [ ] Compartilhar o link em uma rede social e conferir a prévia
- [ ] Cancelar o agendamento de teste na agenda

---

## 12. Decisões que valem saber

**Rate limiting é por instância.** O contador vive na memória do processo; com
várias instâncias o limite efetivo é `limite × instâncias`. Suficiente contra
script ingênuo. Para limite global, troque o `Map` de
`src/lib/http/rate-limit.ts` por Redis mantendo a assinatura.

**Fuso horário.** Toda data civil é convertida para UTC em
`src/lib/utils/timezone.ts`, com dupla passagem para acertar viradas de horário
de verão. Nada no sistema depende do fuso do servidor.

**Serviço não é tabela.** O catálogo vive em código
(`src/lib/config/services.ts`) e o banco guarda o slug — um estado a menos para
ficar desatualizado.

**Animação nunca esconde conteúdo.** Com `prefers-reduced-motion`, tudo nasce no
estado final. O GSAP só é baixado quando há movimento permitido, e só nas seções
que realmente precisam.

**Mobile não é o desktop encolhido.** Scroll nativo (sem Lenis), sem cursor
customizado, sem seção fixada, barra de ação fixa e campos com
`font-size: 16px` para o iOS não dar zoom ao focar. Os serviços, que no desktop
correm na horizontal, viram **lista vertical com os dez à vista**: o carrossel
mostrava um card e escondia nove, e no celular isso lia como seção vazia
justamente na parte mais importante do site.

**O placeholder de imagem é design, não buraco.** Enquanto as fotos da Arena
não chegam, a moldura desenha marcas de enquadramento, cruz de centro,
monograma e o rótulo do que entra ali. São esses blocos que seguram a
composição no celular, onde cada um ocupa meia tela.
