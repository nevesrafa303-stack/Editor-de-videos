# Site — Luiz Quadros · Imóveis na Planta (Itapema e Porto Belo)

Site estático de alto desempenho. Publique **o conteúdo desta pasta** na raiz do domínio.

## Antes de publicar (obrigatório)
1. **WhatsApp**: em `assets/js/main.js`, preencha `CONFIG.whatsapp` (55 + DDD + número, só dígitos).
   Enquanto estiver vazio, os botões abrem o Direct do Instagram (@luizquadrosde) e copiam a mensagem.
2. **Domínio**: troque `https://www.luizquadros.com.br` pelo domínio real em `index.html`
   (canonical, og:url, og:image, JSON-LD), `robots.txt`, `sitemap.xml` e `.well-known/security.txt`.
3. **Rode o build** (abaixo) sempre que editar `main.js`, `style.css` ou `boot.js`.
4. **Confirmar com o Luiz**: textos da carta e dos compromissos, datas dos reconhecimentos,
   a frase sobre VGV divulgado pelo O Novo Imobiliário, autorização de uso das fotos
   (B.Balas e colegas na foto) e se o O Novo Imobiliário exige CRECI jurídico no rodapé.

## Build (gera os arquivos de produção)
```bash
cd ../_fontes/luiz-quadros
npm install
npm run build          # app.min.js, style.min.css, boot inline + hash na CSP
node render-og.mjs     # (opcional) refaz og.jpg e ícones a partir de og-src.html / icon-src.html
python3 build-preview.py ../../luiz-quadros ../../../entregas/luiz-quadros-preview.html   # prévia em arquivo único
```

## Meta Pixel (opcional, com consentimento — LGPD)
1. Preencha `CONFIG.metaPixelId` em `assets/js/main.js` e rode o build.
2. Libere a Meta na CSP (nos 4 lugares: `index.html`, `_headers`, `vercel.json`, `.htaccess`):
   - `script-src` → acrescente `https://connect.facebook.net`
   - `img-src` → acrescente `https://www.facebook.com`
   - `connect-src` → acrescente `https://www.facebook.com https://connect.facebook.net`
3. O aviso de privacidade aparece; o Pixel só carrega após "Aceitar". Todo clique de contato dispara `Contact`.

## Onde hospedar
- **Netlify / Cloudflare Pages**: arraste a pasta. Cabeçalhos em `_headers`.
- **Vercel**: importe a pasta. Cabeçalhos em `vercel.json`.
- **Hostinger / Locaweb / HostGator (Apache)**: envie para `public_html`. O `.htaccess` força HTTPS,
  aplica cabeçalhos, cache e compressão.

## Qualidade (Lighthouse 12, servidor com compressão)
- Celular: Desempenho 97 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 2,4 s · TBT 70 ms · CLS 0)
- Desktop: Desempenho 100 · Acessibilidade 100 · Boas práticas 100 · SEO 100

## O que tem
- Direção de arte "planta arquitetônica": preto, ouro e marfim; Cormorant + Manrope + Geist Mono
  e assinatura manuscrita, tudo hospedado localmente.
- Abertura com contador "R$ 130 mi", planta que se desenha no hero, número gigante de VGV,
  manifesto que acende palavra por palavra, método em 5 etapas com planta desenhada por etapa,
  mapa esquemático Itapema/Porto Belo, reconhecimentos, carta com assinatura.
- **Simulador de fluxo na planta** (entrada, obra, chaves, cenário de valorização) que vira
  mensagem pronta para o WhatsApp — com aviso de que não é promessa de rentabilidade.
- **Montador de mensagem** (objetivo, cidade, faixa de investimento) para leads qualificados.
- Segurança: CSP estrita (script inline só por hash), HSTS, anti-clickjacking, nosniff,
  Permissions-Policy, COOP/CORP, `security.txt`.
- SEO: Schema.org (WebSite, WebPage, RealEstateAgent, Person com CRECI e prêmios, FAQPage),
  Open Graph com imagem própria, sitemap, robots.
- Acessibilidade: teclado, foco visível, contraste AA, "reduzir movimento", funciona sem JavaScript.
- LGPD: sem cookies por padrão; Pixel só com consentimento; simulador e mensagem não enviam dados ao site.

## Fotos
Imagens em `assets/img/` (WebP em mais de um tamanho). Fotos tratadas em JPG em
`../_fontes/luiz-quadros/fotos-tratadas/`, recortadas dos posts do Instagram. Para ainda mais nitidez,
substitua pelos arquivos originais do ensaio (mesmos nomes) e regere os WebP.
