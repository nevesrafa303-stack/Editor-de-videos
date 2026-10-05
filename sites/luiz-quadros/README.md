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
- Celular: Desempenho 96 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (LCP 2,7 s · TBT 60 ms · CLS 0)
- Desktop: Desempenho 100 · Acessibilidade 100 · Boas práticas 100 · SEO 100

## O que tem (v5 — para investidores)
- **Mensagem central**: investir no m² mais valorizado do Brasil com pagamento **100% direto com a
  construtora, em até 120x, sem banco**. Confirmar com o Luiz que todos os empreendimentos seguem esse modelo.
- **Hero** com o valor do m² (FipeZAP) como peça gráfica, CTA "Simular meu investimento" e faixa de cotações.
- **Mercado**: gráfico do ranking do m² e indicadores (atualize os números todo mês).
- **A tese**: quatro pilares do pagamento direto (sem banco, capital diluído, valorização sobre o valor total,
  chaves antes da última parcela).
- **A régua dos 120 meses**: 121 meses que acendem com a rolagem (entrada, obra, chaves, pós-chaves).
- **Simulador do investidor**: entrada, 60/84/100/120x, prazo de entrega e cenário de valorização, com gráfico
  interativo (capital desembolsado × valor estimado) e mensagem pronta para o WhatsApp.
- **Estratégias**: abas com três teses (valorização, renda de temporada, patrimônio).
- Resultados (R$ 130 mi), dossiê de compra, **Guia do Investidor em PDF** (atualizado para o pagamento direto),
  reconhecimentos, região, sobre, dúvidas sobre 120x/cessão/correção e montador de mensagem por entrada disponível.

## Imagens ilustrativas (Higgsfield)
Seis imagens geradas com IA (orla, baía, interior, obra, chaves, maquete) em `assets/img/ia-*.webp`, sempre
marcadas como "Imagem ilustrativa" no site. Onde aparecem: interlúdio da orla após o hero (zoom na rolagem),
régua dos 120 meses (a imagem muda com a fase: maquete → obra → chaves → interior), abas de estratégias e
cartões de Itapema e Porto Belo. Para baixar de novo os originais: `../_fontes/luiz-quadros/importar-imagens-ia.sh`.

## Fotos
Imagens em `assets/img/` (WebP em mais de um tamanho). Fotos tratadas em JPG em
`../_fontes/luiz-quadros/fotos-tratadas/`, recortadas dos posts do Instagram; os recortes sem fundo
(`*-recorte.png`) foram gerados com rembg (modelo birefnet-portrait). Para ainda mais nitidez,
substitua pelos arquivos originais do ensaio (mesmos nomes) e regere os WebP.
