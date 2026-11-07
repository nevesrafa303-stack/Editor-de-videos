# São Luiz capital — Itaim, Morumbi, Jabaquara, Anália Franco (story 9:16)

Anúncio de formulário no Meta Ads para empresários com CNPJ ou MEI, 3 vidas ou mais, na capital de São Paulo.
Público de alto padrão, que consegue pagar R$ 1.800 ou mais num plano de 3 vidas. **Sem preço na peça.**

**Status (07/11/2026):** copy pronta, 4 opções de voz geradas para o cliente escolher. Faltam os vídeos dos
4 hospitais, que o cliente vai enviar. Trilha, cenas e render vêm depois da escolha da voz.

## Análise de mercado (o que já está validado)

- **16 referências do cliente** (`criativos/_referencias/planos-de-saude/`). O que se repete nas peças que performam:
  gancho com pergunta ou filtro de público, selo "Exclusivo para CNPJ", prova de rede com nome e logo dos hospitais,
  3 a 5 benefícios curtos e faixa de CTA "Faça/Solicite sua cotação".
- **Manual de anúncios de corretora (Alice):** evitar "barato" e "50% de desconto" como promessa. Usar "plano de saúde
  empresarial" e "em São Paulo".
- **MEI:** as operadoras pedem CNPJ ativo há pelo menos 6 meses (180 dias). Por isso a peça diz "Consulte condições e
  elegibilidade".
- **Segmento premium em SP:** dominado por SulAmérica, Bradesco, Omint e CarePlus. Rede D'Or aparece nos planos de
  categoria mais alta.
- **Prova com fonte:**
  - Datafolha "O Melhor de São Paulo" 2026, com público das classes A e B da capital (5 a 13/02, 1.008 entrevistas):
    o pronto-socorro dos hospitais São Luiz foi eleito o melhor de São Paulo pela 2ª vez seguida. Fonte: notícia da
    Rede D'Or de 22/06/2026, em rededorsaoluiz.com.br/noticias/artigo/hospitais-sao-luiz-tem-o-melhor-pronto-socorro-de-sp.
  - 1º lugar em "Mais Amados de São Paulo", Veja SP 2025.
- **Modelagem:** o gancho "não é pra quem procura o mais barato" filtra quem tem orçamento baixo sem falar preço.
  Funciona como o filtro de público das referências, só que no tom de alto padrão.

## Copy (locução)

> Este anúncio não é pra quem procura o plano de saúde mais barato. É pra quem tem CNPJ ou MEI, três vidas ou mais… e
> não abre mão de ser atendido nos hospitais São Luiz, da Rede D'Or, aqui na capital de São Paulo. Itaim. Morumbi.
> Jabaquara. Anália Franco. O pronto-socorro dos hospitais São Luiz foi eleito o melhor de São Paulo, na pesquisa
> Datafolha. Pelo CNPJ, você coloca você, seus sócios e a sua família num plano com essa rede… e a gente compara as
> operadoras pra encontrar a melhor opção pro seu perfil. Clica no link, preenche o formulário e receba sua cotação.

Texto com as marcações de interpretação em `tools/voice_prompt.txt`.

## Opções de voz (ElevenLabs Eleven v4, mesma copy)

Arquivos em `assets/voice/opcoes/`, todos no mesmo volume (−16 LUFS). Os originais, sem ajuste, estão em
`assets/voice/src-opcoes/`.

| Arquivo | Voz | Duração |
|---|---|---|
| `1-jhony.mp3` | Jhony Tygas (masculina padrão do cliente): autoridade e calor | 34,7 s |
| `2-roberta.mp3` | Roberta - Casual Sales (feminina padrão do cliente): próxima, tom de conversa | 36,8 s |
| `3-thales.mp3` | Thales - Sophisticated and Vibrant: masculina grave e aveludada, feita para marcas de luxo | 37,1 s |
| `4-isabela.mp3` | Isabela - Commercial & Corporate: feminina elegante, institucional | 37,3 s |

A voz escolhida é acelerada 1,05× (`tools/prep_voice.py`), o que dá cerca de 33 a 35 s de fala.

## Na tela (planejado)

- Desde o 1º quadro: logo, faixa "PLANOS DE SAÚDE" em caixa alta pesada e selo forte
  "EXCLUSIVO PARA CNPJ/MEI · a partir de 3 vidas · capital de São Paulo".
- Os 4 hospitais com os vídeos enviados pelo cliente, prova Datafolha com a fonte na tela, botão
  "Solicite sua cotação" e "Clique no link abaixo". Sem preço e sem WhatsApp.

## Rede citada — confirmar antes de veicular

A peça não cita operadora nem plano. Pela regra do CLAUDE.md, a cotação enviada ao lead precisa ter os 4 hospitais
na rede e na acomodação do plano. Referência de rede: levantamento de corretora que cita o Painel do Corretor da
SulAmérica (23/10/2026). Nele, São Luiz Itaim, Morumbi e Anália Franco aparecem a partir do Especial RC, e São Luiz
Jabaquara a partir do Direto Nacional. Confirmar no material oficial de cada operadora antes de veicular.

## Observações obrigatórias (CLAUDE.md da raiz)

Só por escrito, texto exato, fora da locução:

- **Hospitais:** A rede credenciada pode variar conforme plano contratado. · Consulte a disponibilidade da rede hospitalar.
- **CNPJ/MEI e vidas:** Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Os valores podem
  variar conforme perfil do beneficiário.
- **Vídeos e fotos:** Imagem meramente ilustrativa.
- **Cartão final:** todas as observações acima, mais Cobertura e rede sujeitas à modalidade contratada.
