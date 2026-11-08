# Hospitais de referência em SP — Vila Nova Star e São Luiz Itaim (estáticos)

Seis criativos estáticos para o formulário do Meta (CNPJ/MEI, 3 vidas ou mais, capital de São Paulo). Cada um
aparece em dois formatos.

## Pedidos do cliente (07 e 08/11/2026)

- **Estilo:** seguir por completo as referências 10, 14 e 16 de `criativos/_referencias/planos-de-saude/`.
  - **Ref 10:** SulAmérica, hospital no topo.
  - **Ref 14:** SulAmérica, "plano de saúde com CNPJ" e preço gigante.
  - **Ref 16:** Amil Premium, Sírio-Libanês, preto e dourado.
- **Destaque:** palavras importantes em destaque.
- **Fotos:** só imagens reais.
  - Usar os quadros dos vídeos de hospital do banco (`criativos/_banco-de-videos`, cortes de 07/11) e fotos de
    hospitais de referência como o São Luiz Itaim e o Vila Nova Star.
  - **Nada de banco de imagens** (pessoas posando, corredor genérico) nem foto gerada.

## Peças

| Peça | Referência | Hospital | Foto (real) | Destaques |
|---|---|---|---|---|
| `v1-vns-hospital` | 10 | Vila Nova Star | fachada com o letreiro (enviada pelo cliente) | tarja laranja "PLANOS DE SAÚDE", "Vila Nova Star" em laranja, cartão "a partir de 3 VIDAS" com aba "EXCLUSIVO PARA CNPJ/MEI", fila de diferenciais, faixa "SOLICITE SUA COTAÇÃO" |
| `v2-vns-cnpj` | 14 | Vila Nova Star | letreiro do lobby (quadro do corte `vila-nova-star-letreiro`) | arco laranja "PLANOS DE SAÚDE", "VILA NOVA STAR" em tarja azul, "3 VIDAS" gigante, tarja "Exclusivo para CNPJ/MEI", caixa laranja de diferenciais |
| `v3-vns-premium` | 16 | Vila Nova Star | fachada com o letreiro (enviada pelo cliente) | aba branca "EXCLUSIVO PARA CNPJ/MEI", "Vila Nova Star" em dourado, cartão "A PARTIR DE 3 VIDAS · PELO CNPJ" + caixa dourada "PLANOS DE SAÚDE", diferenciais separados por barras |
| `l1-sl-hospital` | 10 | São Luiz Itaim | fachada com o logo e o letreiro (enviada pelo cliente) | igual à V1, com "São Luiz Itaim" e a fila "Pronto-socorro eleito o melhor de SP¹ │ Rede D'Or │ Itaim" |
| `l2-sl-cnpj` | 14 | São Luiz Itaim | fachada em cartão | igual à V2, caixa "Por que o São Luiz" |
| `l3-sl-premium` | 16 | São Luiz Itaim | fachada com o logo e o letreiro | igual à V3, "Por que o São Luiz" |

**Formatos** (PNG em 2x, em `final/`; visão geral em `_visao-geral-feed.jpg` e `_visao-geral-story.jpg`):
- **Feed:** 1:1, 2160×2160.
- **Story:** 2160×3840. É o mesmo desenho a partir de y=300. A faixa de cima, coberta pela interface do Story, mostra a
  mesma foto desfocada. A faixa de CTA desce até o pé. Todo texto fica entre y=290 e y=1536.

**Sem preço e sem operadora:** não há cotação com esses hospitais em mãos.
- O lugar do preço das referências virou "a partir de 3 VIDAS" e "pelo CNPJ".
- Quando chegar uma cotação de plano que tenha esses hospitais (por exemplo, SulAmérica Especial RC ou Especial
  Mais), o bloco "3 VIDAS por apenas R$…" entra no mesmo lugar, como nas referências.

## Fontes

- **Rede, a confirmar antes de veicular.** A cotação enviada ao lead precisa ter o hospital na rede e na acomodação do
  plano (CLAUDE.md). Fonte: levantamento de corretora com base no Painel do Corretor da SulAmérica, 23/10/2026.
  - **Vila Nova Star:** internação especializada a partir do Especial RC; internação e pronto-socorro do Especial Mais
    ao Prestige. O material oficial do Especial Mais (`motion/videos/vila-nova-star-v3-viajantes/fontes/`) cita o
    atendimento no Vila Nova Star.
  - **São Luiz Itaim:** a partir do Especial RC.
- **Diferenciais do Vila Nova Star:** site oficial
  ([rededorsaoluiz.com.br/star/vilanovastar](https://www.rededorsaoluiz.com.br/star/vilanovastar)), consultado em
  07/11/2026:
  - pronto-socorro adulto em suítes individuais;
  - concierge e cardápios assinados pelo chef Roland;
  - CTI com acomodação para acompanhante em tempo integral;
  - exames no próprio hospital, da ressonância ao PET-CT.
- **"Pronto-socorro eleito o melhor de SP¹" (São Luiz):** pesquisa Datafolha "O Melhor de São Paulo" 2026 (classes A e
  B da capital), divulgada pela Rede D'Or em 22/06/2026. A nota ¹ vai no texto legal.
- **Fotos:**
  - **Quadros do Reel 05:** `vila-nova-star-letreiro` e outros cortes do Vila Nova Star em
    `criativos/_banco-de-videos`. Uso autorizado segundo o cliente. Versão `recorte-topo`, sem reparo de legenda.
  - **Fachadas:** Vila Nova Star e São Luiz Itaim, enviadas pelo cliente para o vídeo `sp-rede-premium-cnpj`.
  - `ferramentas/preparar-fotos.py` refaz tudo.

## Observações obrigatórias (texto exato, só na tela)

O texto legal fica logo acima da faixa de CTA: 16 px no Feed e 19 px no Story. Ele reúne:

- hospital citado como exemplo de rede, com a disponibilidade variando por operadora, plano e acomodação;
- fonte dos diferenciais ou da pesquisa Datafolha;
- "Exclusivo para CNPJ/MEI, a partir de 3 vidas, na capital de São Paulo.";
- as observações do CLAUDE.md:
  - **hospital e rede:** Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano
    contratado.
  - **cobertura:** Cobertura e rede sujeitas à modalidade contratada.
  - **CNPJ/MEI:** Consulte condições e elegibilidade. · Condições sujeitas à análise comercial.
  - **3 vidas:** Valores sujeitos à faixa etária e região. · Os valores podem variar conforme perfil do beneficiário.
  - **foto:** Imagem meramente ilustrativa.

`node ferramentas/conferir.mjs` passa nas 12 imagens (6 peças × 2 formatos):
- texto dentro das zonas seguras;
- fonte mínima de 16 px no Feed e 19 px no Story;
- contraste WCAG aprovado contra o fundo real.

## Texto do anúncio no Meta (sugestão)

- **Texto principal:** "O Vila Nova Star [ou: o São Luiz Itaim] no plano de saúde da sua empresa. Com CNPJ ou MEI e a
  partir de 3 vidas, você coloca você, seus sócios e a sua família num plano empresarial com esse hospital na rede, e a
  gente compara as operadoras pra você. Exclusivo para CNPJ/MEI, a partir de 3 vidas, capital de São Paulo."
- **Título:** "Plano de saúde pelo CNPJ" · **Descrição:** "A partir de 3 vidas"
- **Botão:** Obter cotação
- **Observações no texto:** Consulte a disponibilidade da rede hospitalar. Consulte condições e elegibilidade.

## Gerar de novo

```bash
cd criativos/hospitais-referencia-sp
python3 -I ferramentas/preparar-fotos.py   # quadros do banco de vídeos + fachadas enviadas pelo cliente
node render.mjs                            # 6 peças em Feed 1:1 e Story, em 2x
node ferramentas/conferir.mjs              # zonas seguras, fonte mínima e contraste
```
