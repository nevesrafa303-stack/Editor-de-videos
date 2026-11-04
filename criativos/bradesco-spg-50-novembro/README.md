# Bradesco Saúde SPG — 50% de desconto na 2ª mensalidade (novembro/2026)

Três variações (Story 1080×1920 e Feed 4:5 1080×1350) da oferta de novembro da Bradesco Saúde SPG:
**50% de desconto na 2ª mensalidade, nos cálculos realizados de 03 a 30/11/2026, para grupos de 3 a 199 vidas**. O texto está voltado
à empresa que contrata o plano. A referência enviada fala com o corretor ("para o seu cliente").

| Variação | Arquivos | Ideia | Foto (banco `empresarial/hd`) |
|---|---|---|---|
| **B1 · Clássico** | `final/b1-classico-{story,feed}.png` | Releitura da peça de referência: fundo claro com fachada de vidro, faixa vermelha no canto, arco do símbolo Bradesco atrás da dupla, 50% gigante, carimbo vermelho "Grupos de 3 a 199 vidas", data em cartão, benefícios e botão | `12-dupla-de-socios` |
| **B2 · Cupom** | `final/b2-cupom-{story,feed}.png` | Urgência premium: fundo vinho com luz vermelha, selo "Só até 30 de novembro", oferta como cupom destacável (furos reais do picote), carimbo branco "Grupos de 3 a 199 vidas" e o trio de sócios. No Story, o trio fica com os rostos inteiros acima do botão (queixo da moça do meio em y≈1202; botão em y=1266) | `05-trio-socia-ao-centro` |
| **B3 · Mensalidades** | `final/b3-mensalidades-{story,feed}.png` | Explicativo, para a equipe: título "Plano de saúde para a sua equipe", faixa vermelha "Para grupos de 3 a 199 vidas" logo abaixo, base vermelha em arco com a 1ª mensalidade ao fundo e a 2ª na frente com 50% OFF | `04-equipe-de-terno` |

PNG em 2x (Story 2160×3840, Feed 2160×2700). Visão geral: `final/_visao-geral.jpg`.

## Feito com Adobe e Figma

- **Adobe Photoshop (API do Adobe for creativity):** fundo removido das três fotos do banco em alta
  (`image_remove_background`) → `assets/fotos/*-recorte-adobe.png`. Nenhum outro ajuste foi feito nas fotos.
- **Figma:** arquivo [Bradesco Saúde SPG · 50% na 2ª mensalidade · Novembro 2026](https://www.figma.com/design/486NJYQsLW73d3VQUZD7wE)
  com os 6 quadros em camadas editáveis: 83 textos vivos (Montserrat e Poppins), formas e degradês nativos,
  logo e ícones vetoriais, fotos recortadas com máscara de esmaecimento e furos do cupom como máscara booleana.
- **Adobe Express:** dois documentos editáveis, cada um com as 3 variações como páginas:
  [3 a 199 vidas · Stories](https://new.express.adobe.com/id/urn:aaid:sc:VA6C2:ea000a45-9f4e-4ae4-8d69-6bf80c393c99) e
  [3 a 199 vidas · Feed](https://new.express.adobe.com/id/urn:aaid:sc:VA6C2:8244e5c2-a6e2-4dfd-9976-0511546d7f62).
  Os arquivos de apoio ficam na pasta `laks-bradesco-spg` do Creative Cloud.

## Marca e textos

- **Logo:** SVG oficial servido pelo site da Bradesco Seguros (página de plano de saúde), cortado ao desenho em
  `assets/marca/bradesco-saude.svg` (`currentColor`: vermelho `#CC092F` no claro, branco no vinho).
- **SPG:** a Bradesco Saúde apresenta o SPG como o seguro saúde para micro, pequenas e médias empresas. A
  sigla não aparece escrita por extenso, porque as fontes variam ("Seguro para Grupos" / "para Pequenos
  Grupos"). A expansão "Soluções para Grandes Grupos" da peça de referência não foi confirmada e ficou de fora.
- Não entram superlativos que a peça não comprova ("rede de excelência", "marca referência"). Os benefícios
  citados são genéricos e todos têm observação: pequenas e médias empresas, rede referenciada, opção de
  reembolso e abrangência nacional.
- Sem telefone ou WhatsApp escrito na peça. O botão pede a cotação: o número entra na configuração do anúncio.

## Observações obrigatórias (CLAUDE.md) que entraram

Texto exato, em todas as peças:

- Logo abaixo do 50%: **Valores sujeitos à faixa etária e região.**
- No rodapé legal:
  - Valores referenciais sujeitos às regras da operadora. (valor/desconto)
  - Os valores podem variar conforme perfil do beneficiário. (quantidade de vidas)
  - A rede credenciada pode variar conforme plano contratado. (rede referenciada)
  - Cobertura e rede sujeitas à modalidade contratada. (abrangência, reembolso)
  - Consulte condições e elegibilidade. (operadora, empresa)
  - Condições sujeitas à análise comercial. (condição especial, prazo)
  - Oferta sujeita à disponibilidade comercial. (promoção com prazo)
  - Imagem meramente ilustrativa. (fotos de pessoas)
- O rodapé também traz a condição da oferta: *Condição válida para cálculos realizados de 03 a 30/11/2026, para grupos
  de 3 a 199 vidas. Ao final,
  vem o registro da operadora: Bradesco Saúde S.A. · ANS nº 005711.

`ferramentas/conferir.mjs` passa nas 6 peças. No Story, todo texto fica entre y=245 e y=1525 (zona segura
230–1536). A menor fonte é de 19 px no Story e 16 px no Feed. O pior contraste é 4,3:1, num texto grande
(mínimo de 3:1).

## Como refazer

```bash
cd criativos/bradesco-spg-50-novembro
node render.mjs                     # PNG 2x em final/
node ferramentas/conferir.mjs       # zona segura, tamanho mínimo e contraste
# Figma / Adobe Express (a partir das mesmas páginas HTML):
node ferramentas/extrair-camadas.mjs /tmp/camadas          # árvore de camadas de cada peça (JSON) + texturas
python3 -I ferramentas/gerar-figma.py /tmp/camadas          # script use_figma por variação (figma-montar.js)
python3 -I ferramentas/gerar-express.py /tmp/camadas /tmp/express   # HTML de importação do Express
```

`pecas/base.css` e `pecas/base.js` guardam as cores, o logo inline, os ícones e os textos legais. As três
peças são `pecas/b1-classico.html`, `pecas/b2-cupom.html` e `pecas/b3-mensalidades.html`.
