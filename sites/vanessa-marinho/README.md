# Site — Dra. Vanessa Marinho

Site estático de alto desempenho. Publique **o conteúdo desta pasta** na raiz do domínio.

## Antes de publicar (obrigatório)
1. **WhatsApp** — em `assets/js/main.js`, preencha `CONFIG.whatsapp` (55 + DDD + número, só dígitos).
   Enquanto estiver vazio, os botões abrem o Direct do Instagram e o planejador copia a mensagem.
2. **Domínio** — troque `https://www.dravanessamarinho.com.br` pelo domínio real em `index.html`
   (canonical, og:url, og:image, JSON-LD), `robots.txt`, `sitemap.xml` e `.well-known/security.txt`.
3. **Rode o build** (abaixo) sempre que editar `main.js`, `style.css` ou `boot.js`.
4. Confirmar com a Dra.: CRO, textos da carta, compromissos, fichas clínicas, sigla HFE e autorizações de imagem.

## Build (gera os arquivos de produção)
```bash
cd ../_fontes/vanessa-marinho
npm install
npm run build
```
Gera `assets/js/app.min.js` (GSAP + ScrollTrigger + Lenis + main.js), `assets/css/style.min.css`,
embute o `boot.js` no `<head>` e atualiza o hash `sha256` dele na CSP de `index.html`, `_headers`,
`vercel.json` e `.htaccess`. Edite sempre os arquivos-fonte (`main.js`, `style.css`, `boot.js`).

## Meta Pixel (opcional, com consentimento — LGPD)
1. Preencha `CONFIG.metaPixelId` em `assets/js/main.js` e rode o build.
2. Libere a Meta na CSP (nos 4 lugares: `index.html`, `_headers`, `vercel.json`, `.htaccess`):
   - `script-src` → acrescente `https://connect.facebook.net`
   - `img-src` → acrescente `https://www.facebook.com`
   - `connect-src` → acrescente `https://www.facebook.com https://connect.facebook.net`
3. O aviso de privacidade aparece para o visitante; o Pixel só carrega após "Aceitar".
   Cada clique em WhatsApp/agendar dispara o evento `Contact`.

## Onde hospedar
- **Netlify / Cloudflare Pages**: arraste a pasta. Cabeçalhos em `_headers`.
- **Vercel**: importe a pasta. Cabeçalhos em `vercel.json`.
- **Hostinger / Locaweb / HostGator (Apache)**: envie para `public_html`. O `.htaccess` força HTTPS,
  aplica cabeçalhos, cache e compressão.

## Qualidade (Lighthouse, servidor com compressão)
- Celular: Desempenho 94 · Acessibilidade 100 · Boas práticas 100 · SEO 100
- Desktop: Desempenho 96 · Acessibilidade 100 · Boas práticas 100 · SEO 100

## O que tem
- Rolagem suave (Lenis) e coreografia de rolagem (GSAP + ScrollTrigger), tudo hospedado no próprio site.
- Fontes Inter Tight + Geist Mono + assinatura manuscrita, hospedadas localmente.
- Segurança: CSP estrita (script inline só por hash), HSTS, anti-clickjacking, nosniff,
  Permissions-Policy, COOP/CORP, `security.txt`.
- SEO: Schema.org (WebSite, WebPage, Dentist, Person, FAQPage), Open Graph com imagem própria,
  sitemap, robots.
- Acessibilidade: teclado, foco visível, contraste AA, "reduzir movimento", funciona sem JavaScript.
- LGPD: sem cookies por padrão; Pixel só com consentimento; planejador não envia dados ao site.

## Trocar fotos
Imagens em `assets/img/` (WebP, versões `-720` e `-1280`). Fotos tratadas em JPG em
`../_fontes/vanessa-marinho/fotos-tratadas/`. A imagem de compartilhamento é gerada de
`../_fontes/vanessa-marinho/og-src.html`.
