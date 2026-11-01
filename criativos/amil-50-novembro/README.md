# Amil — 50% nas 2 primeiras mensalidades, prorrogada para novembro/2026

Três variações estáticas da promoção Amil Plano Empresarial, que era só de outubro e foi
**prorrogada para o mês todo de novembro**. Peça de origem (outubro):
`motion/videos/amil-outubro-50/assets/ref/amil-outubro-story.png` (a mesma do vídeo "Só em outubro").

Cada peça sai em **Story 9:16** e **Feed 4:5**, exportadas em 2x (2160×3840 e 2160×2700), em `final/`.
`final/_visao-geral.jpg` mostra as 6 imagens.

## Oferta (da peça de outubro; só o prazo mudou)

- Plano Empresarial Amil, plano para 3 vidas com coparticipação, a partir de **R$ 1.123,17**.
- **50% de desconto nas 2 primeiras mensalidades**, agora **até 30 de novembro** (antes: "Promoção para Outubro").
- Exclusivo para CNPJ. Valor referente a uma vida de 18 anos, um adulto de 33 anos e mais um até 38 anos.
- CTA: "Solicite uma cotação personalizada".

## Variações

| Peça | Copy | Inspiração (`criativos/_referencias/planos-de-saude`) |
|---|---|---|
| `v1-prorrogada` | Selo **"PROMOÇÃO PRORROGADA"**, "50% de desconto nas 2 primeiras mensalidades", pílula "Agora vale até 30 de novembro", cartão branco de preço | Peça de outubro + 02 e 14 (número grande, cartão de preço, selo CNPJ, botão) |
| `v2-sua-empresa` | **"Sua empresa com plano Amil pagando metade"** nas 2 primeiras mensalidades, selo "Prorrogada até 30/11", sócios sobre anéis concêntricos, cartão de preço com selo 50% OFF | 05 (pessoa sobre a cor da operadora) + banners da Amil |
| `v3-mais-um-mes` | Pergunta **"Deixou para depois em outubro?"** → "A promoção foi prorrogada.", calendário de novembro/2026 inteiro marcado com o dia 30 em destaque, adesivo 50% OFF | 03, 05 e 08 (pergunta de impacto) |

## Observações obrigatórias (CLAUDE.md) usadas

Texto exato, só por escrito, ≥ 19 px no Story e ≥ 16 px no Feed:

- Abaixo do preço, em todas: **"Valores sujeitos à faixa etária e região."**
- Rodapé legal, em todas: perfil da simulação (*) + **"Valores referenciais sujeitos às regras da operadora."**
  (valor) + **"Cobertura e rede sujeitas à modalidade contratada."** (coparticipação) + **"Consulte condições e
  elegibilidade."** (operadora/CNPJ) + **"Oferta sujeita à disponibilidade comercial."** (promoção com prazo)
  + "Amil · ANS nº 326305."
- Só na `v2-sua-empresa` (tem foto de pessoas): **"Imagem meramente ilustrativa."**

## Conferência automática

```bash
node render.mjs                     # gera as 6 imagens (ou: node render.mjs v2)
node ferramentas/conferir.mjs       # zonas seguras, tamanho mínimo e contraste
```

`ferramentas/conferir.mjs` confere em cada peça e formato: no Story, todo texto entre y=230 e y=1536;
fonte mínima de 19 px (Story) e 16 px (Feed); contraste WCAG de cada texto contra o fundo real atrás das
letras (4,5:1 texto comum, 3:1 texto grande). Resultado desta versão: tudo ✓ (pior caso 3,9:1 em texto grande).

## Fotos e marca

- Sócios (`assets/fotos/dupla.png`): recorte da linha Figma do projeto `munhoz-amil-50`, foto Adobe Stock
  (licença gratuita, sem IA).
- Logo Amil vetorial (`assets/amil-logo.svg`), do projeto `munhoz-amil-50`.
- Fontes: Montserrat 800/900 e Poppins (as mesmas da peça e do vídeo de outubro).

## Conferir antes de subir

- Se o preço de R$ 1.123,17 e o perfil da simulação continuam valendo em novembro.
- Se o último dia é mesmo 30/11 (mês todo de novembro).
- Se a peça leva logo e contato da corretora (a peça de outubro não tinha).
