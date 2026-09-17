# Site — Dra. Consuelo Vasconcelos

Site institucional de página única, em **HTML + CSS + JavaScript puros**.
Sem build, sem framework, sem dependência de servidor: é só subir a pasta.

```
site/
├── index.html              ← a página inteira (conteúdo editável no HTML)
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css       ← todo o design (tokens de cor, tipografia, componentes)
    ├── js/config.js        ← ⚠️ ÚNICO ARQUIVO OBRIGATÓRIO DE EDITAR
    ├── js/main.js          ← comportamento (scroll, carrossel, comparador, formulário)
    └── img/                ← imagens (placeholders SVG para substituir)
```

---

## 1. De onde veio o conteúdo

Todo o texto desta página foi extraído do site publicado em
`draconsuelovasconcelos.com.br`: a bio, a missão, os 8 procedimentos com as
descrições originais, as 3 dúvidas frequentes, o endereço, o horário, o
telefone e o CRO-SC 25523. A paleta foi amostrada pixel a pixel dos prints do
site (ver seção 5).

### 1.1 O que ainda falta — `assets/js/config.js`

Os campos marcados `// ⚠️ CONFIRMAR` são os que não apareciam nos prints:

| Campo | Situação |
|---|---|
| `redes.instagram` | Chutei `@draconsuelovasconcelos` — **confirme o @ real** |
| `redes.facebook` `.youtube` `.pinterest` `.tiktok` | O site atual tem os ícones, mas as URLs não apareciam. `null` esconde o ícone |
| `email` | Não aparece no site atual. `null` faz o item sumir da página inteira |
| `google.link` | Troque pelo link do perfil do Google Business |
| `endereco.mapaEmbed` | Opcional: cole o `src` do iframe "Incorporar um mapa" |

Já conferidos e corretos: nome, CRO-SC 25523, WhatsApp (47) 98860-3900,
endereço na Hercílio Luz 642, horário de segunda a sábado 09h30–18h, cidade/UF.

### 1.2 Fotos — `assets/img/`

As fotos são reais e já estão no site. Os retratos foram exportados em **WebP
com canal alfa**: as bordas dissolvem para transparente, então a figura nasce do
fundo da página sem moldura e sem recorte de silhueta.

| Arquivo | Onde aparece |
|---|---|
| `consuelo-hero-*.webp` | Primeira dobra |
| `consuelo-sobre-*.webp` | "Afinal, quem sou eu?" |
| `consuelo-corpo-*.webp` | Chamada final, antes do contato |
| `clinica-*.webp` | Seção "A clínica" |
| `caso-labial-*.webp` | Seção "Resultados" |
| `og-capa.jpg` | Miniatura no WhatsApp, Instagram e Facebook |

Cada foto tem três larguras (`srcset`), então o celular baixa a menor e o
desktop a maior.

**Para trocar uma foto por outra**, o roteiro está em `ferramentas/fotos.py`:
ele recorta, gera as três larguras, aplica a máscara de transparência nas
bordas e exporta WebP. Rode `python3 ferramentas/fotos.py` a partir de `site/`.

> **Seção "Resultados":** a imagem é de uma paciente. Ela só pode ficar no ar
> com **termo de autorização de uso de imagem assinado** — é exigência do
> Código de Ética Odontológica, não formalidade. Para tirar do ar, apague a
> seção `<!-- CASO CLÍNICO -->` inteira do `index.html` e o link "Resultados"
> no rodapé.

### 1.3 Textos

Toda a copy está no `index.html`, em blocos comentados por seção. Nada foi
inventado: as frases são as do site atual. Os três selos da primeira dobra
(CRO, nota do Google, cidade) são fatos verificáveis, não estatísticas
estimadas.

---

## 2. Como publicar

Qualquer hospedagem de arquivos estáticos serve. O conteúdo da pasta `site/`
vai para a raiz do domínio.

**Hospedagem tradicional (Hostinger, Locaweb, cPanel):** envie o conteúdo de
`site/` para `public_html/` via FTP ou pelo gerenciador de arquivos.

**Netlify / Vercel / Cloudflare Pages:** conecte o repositório, defina o
diretório de publicação como `site` e deixe o comando de build vazio.

**GitHub Pages:** publique a partir da branch escolhida, pasta `/site`.

Lembre de forçar **HTTPS** e o redirecionamento `www` → domínio principal
(ou o contrário) na hospedagem.

## 3. Ver localmente

```bash
cd site
python3 -m http.server 8080
# abra http://localhost:8080
```

Abrir o `index.html` direto pelo navegador (`file://`) também funciona, mas o
`config.js` carrega melhor por HTTP.

---

## 4. O que já está implementado

**Seções** — primeira dobra, faixa de credenciais, "Afinal, quem sou eu?" com
"Paixão que virou carreira", missão "Cuidado que transforma" em 4 blocos, os 8
procedimentos, "O que muda na sua estética" (01/02/03), avaliações do Google,
as 3 dúvidas frequentes, chamada final, localização com formulário e rodapé.

**Scroll e movimento** — barra de progresso de leitura, cabeçalho que encolhe e
se esconde ao descer, revelação progressiva de cada bloco (IntersectionObserver),
animação palavra a palavra no título, parallax nas fotos, scrollspy destacando a
seção ativa no menu, medidor de progresso na seção da missão, faixa de
credenciais em rolagem infinita e botão de voltar ao topo.

**Interações** — acordeão de dúvidas com um item aberto por vez, menu mobile em
tela cheia e formulário que valida os campos e abre o WhatsApp com a mensagem já
montada (nome, procedimento escolhido, observação e telefone).

**Acessibilidade** — HTML semântico, um único `h1` com hierarquia correta, link
"pular para o conteúdo", foco visível, `alt` em todas as imagens, rótulo em todos
os campos, navegação completa por teclado, `prefers-reduced-motion` desligando
todas as animações e **contraste WCAG AA aprovado em 100% dos textos** (auditado
automaticamente em Chromium).

**SEO** — meta description, canonical, Open Graph, Twitter Card, JSON-LD
`schema.org/Dentist` com endereço e horário de funcionamento reais, `robots.txt`
e `sitemap.xml`.

**Responsivo** — layout fluido com `clamp()`, testado de 390px a 1440px, sem
rolagem horizontal. Também tem folha de impressão.

## 5. A paleta — de onde ela veio

As cores não foram escolhidas: foram **medidas nos prints do site publicado**,
amostrando os pixels de cada região da interface. O resultado é que o site é
genuinamente monocromático — o croma máximo medido nas áreas de interface foi
**4 de 255**, ou seja, cinza puro. A única cor da marca é o dourado do logo.

| Token | Cor | Onde foi medido |
|---|---|---|
| `--grafite` | `#121214` | Fundo do estúdio das fotos — com o token igual, o retrato funde com a página |
| `--carvao` | `#3A3A3A` | Fundo das seções escuras |
| `--chumbo` | `#5D5D5D` | Topo do gradiente dos cards |
| `--cinza` | `#6E6E6E` | O cinza dominante do site (`#888888`, 53% dos pixels), escurecido o suficiente para o texto branco passar em contraste |
| `--prata` | `#A5A5A5` | Base do gradiente dos cards e faixas claras |
| `--creme` | `#EBE7DB` | Branco quente do logo |
| `--ouro` | `#C9A96A` | Dourado do monograma e do bordado do jaleco |

O gradiente dos cards (`--grad-card`) reproduz o do site atual: escuro no canto
superior esquerdo, prata no inferior direito.

**Uma correção deliberada:** o cinza original `#888888` com texto branco dá
contraste de 3,5:1 — abaixo do mínimo legal de acessibilidade (4,5:1). Escureci
para `#6E6E6E`, que mantém o mesmo ar da marca e passa com folga. Se preferir o
tom exato do site atual, troque `--cinza` de volta e aceite a perda de
legibilidade.

### Tipografia

O site atual combina um **sans geométrico leve** nos títulos com um **serif
itálico de contraste alto** nos acentos de marca ("É posicionamento", "quem sou
eu?"). Reproduzi isso com **Montserrat 200/300** + **Playfair Display italic**,
carregadas do Google Fonts no `<head>`.

Para trocar qualquer cor ou fonte, edite as variáveis em `:root`, no topo de
`assets/css/style.css`.
