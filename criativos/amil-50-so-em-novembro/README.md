# Amil — 50% nas 2 primeiras mensalidades, só em novembro/2026

Seis criativos estáticos com a mesma mensagem e intenção, cada um num layout diferente inspirado nas
referências do cliente (`criativos/_referencias/planos-de-saude`). Urgência: **a condição só vale em
novembro** (sem falar em prorrogação). Substitui `criativos/amil-50-novembro`.

Cada peça sai em **Story 9:16** e **Feed 4:5**, exportadas em 2x (2160×3840 e 2160×2700), em `final/`.
`final/_visao-geral.jpg` mostra as 12 imagens.

## Mensagem (igual em todas)

- Plano Empresarial Amil, **3 vidas com coparticipação a partir de R$ 1.123,17\***.
- **50% de desconto nas 2 primeiras mensalidades**, **só em novembro** (contratos até 30/11).
- **Exclusivo para CNPJ**. CTA: "Solicite uma cotação personalizada".

## Peças

| Peça | Gancho | Layout (referência) | Foto (banco de imagens) |
|---|---|---|---|
| `n1-so-em-novembro` | "50% OFF nas 2 primeiras mensalidades" + ingresso "30 NOV — Só para contratos de novembro. Quando o mês acabar, o desconto acaba junto." | Arco da marca, preço gigante, caixa de benefícios (14) | — (tipográfica) |
| `n2-familia` | "Seu CNPJ pode cuidar de quem você ama" | Foto no topo + painel curvo + cartão de preço com selo (01, 15) | `familia/04` casal com bebê |
| `n3-empresa-premium` | "Plano de saúde para sua empresa com 50% OFF" | Linha premium escura, aba com logo, caixa âmbar, itens com barras (16) | `empresarial/10` trio |
| `n4-pergunta-empresa` | "Sua empresa ainda não tem PLANO DE SAÚDE?" | Pergunta gigante, grade e moldura, pessoas recortadas (05) | `empresarial/08` trio (recortado) |
| `n5-cards-familia` | "Sua família no plano Amil pelo seu CNPJ, com 50% OFF" | Cards modulares, "3 VIDAS" em marca-texto, pílulas com seta (02) | `familia/05` pais e filha |
| `n6-painel-empresa` | "Contrate em novembro e pague metade nas 2 primeiras mensalidades" | Painel lateral claro, "3 vidas / a partir de ——", faixa CNPJ, lista de condições, foto com borda curva (11, 12) | `empresarial/01` reunião |

Todas as fotos têm 3 pessoas, como a oferta de 3 vidas. As fotos vêm de `criativos/_banco-de-imagens/hd`
(links simbólicos em `assets/fotos`); o recorte do trio fica em `assets/fotos/empresa-08-recorte.png`
(BiRefNet, mesmo processo de `anaclaudia-gestante-black-friday/ferramentas/recortar.py`).

## Observações obrigatórias (CLAUDE.md) usadas

Texto exato, só por escrito, ≥ 19 px no Story e ≥ 16 px no Feed:

- Abaixo do preço, em todas: **"Valores sujeitos à faixa etária e região."**
- Rodapé legal, em todas: perfil da simulação (*) + **"Valores referenciais sujeitos às regras da operadora."** +
  **"Cobertura e rede sujeitas à modalidade contratada."** + **"Consulte condições e elegibilidade."** +
  **"Condições sujeitas à análise comercial."** + **"Oferta sujeita à disponibilidade comercial."** + "Amil · ANS nº 326305."
- Nas peças com foto (n2 a n6): **"Imagem meramente ilustrativa."**

## Gerar e conferir

```bash
node render.mjs                     # as 12 imagens (ou: node render.mjs n4)
node ferramentas/conferir.mjs       # zonas seguras do Story, fonte mínima e contraste WCAG
```

Resultado desta versão: tudo ✓ (texto do Story entre y=256 e y=1516; pior contraste 4:1 em texto grande).

## Conferir antes de subir

- Se o preço de R$ 1.123,17 e o perfil da simulação valem para novembro.
- As peças de família falam em colocar a família no plano pelo CNPJ: confirmar com a corretora a regra
  de inclusão de dependentes no plano empresarial (por isso "Consulte condições e elegibilidade.").
- Se a peça leva logo e contato da corretora.
