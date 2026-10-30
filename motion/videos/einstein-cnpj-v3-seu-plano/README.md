# "Seu plano de saúde te dá acesso ao Einstein?" — Einstein no CNPJ, variação 3 (story 9:16, 42,1 s)

Terceira variação do anúncio do Einstein (V1: `../einstein-cnpj-milionario`; V2:
`../einstein-cnpj-v2-vantagem`), com copy diferente das outras duas para rodar em teste A/B no Meta Ads
com formulário. Modelada a partir da mesma referência (vídeo UGC de terceiros enviado pelo cliente; o
vídeo não entra no motion). Sem logo de corretora, para usar com vários clientes.

- **Ângulo:** dor. Fala com quem **já tem plano** e não sabe se ele cobre o Einstein: a pergunta vira
  uma enquete, o "não" leva ao risco de descobrir na hora da emergência, e a saída é o plano empresarial
  pelo CNPJ. A V1 quebra uma crença e a V2 vende uma oportunidade.
- **Formato único: story 9:16 (1080×1920)**, informações no centro (nada nos 230 px de cima nem
  abaixo de 1536 px).
- **Gancho nos 3 primeiros segundos:** o quadro 0 já mostra a enquete "PERGUNTA RÁPIDA · Seu plano de
  saúde te dá acesso ao Einstein?" com a fachada do hospital e os botões SIM / NÃO; um dedo toca no
  NÃO no "não…" da fala e a trilha cai no drop no "presta atenção".
- **CTA:** "Clica no link, preenche o formulário e a gente te mostra quais planos têm o Einstein pro seu
  perfil." → botão "Preencha o formulário / e veja os planos com o Einstein" e "Clique no link abaixo".

## Roteiro

| Tempo | Fala | Na tela |
|---|---|---|
| 0–4,1 s | "Seu plano de saúde te dá acesso ao Einstein? Se a resposta foi não…" | enquete com a fachada sobre o átrio; toque no NÃO, que fica vermelho, e o SIM apaga |
| 4,1–11,2 s | "…presta atenção. Muita gente paga plano todo mês e só descobre na hora que precisa que o hospital que queria não está na rede." | "Presta atenção."; calendário de mensalidades marcando os meses pagos; notificação "Na hora que precisa… O hospital que você queria não faz parte da rede do seu plano" com carimbo "NÃO ESTÁ NA REDE" |
| 11,2–14,9 s | "E no Einstein, uma cirurgia pode passar dos duzentos mil reais." | "NO EINSTEIN, NO PARTICULAR" e uma conta hospitalar (mockup) "Cirurgia R$ 200.000+" rolando sobre a foto da cirurgia robótica |
| 14,9–20,3 s | "Só que tem um caminho que pouca gente conhece: o plano empresarial, pelo seu CNPJ." | caminho dourado se desenhando até o cartão "Plano empresarial / pelo seu CNPJ" |
| 20,3–25,3 s | "Existem planos com o Einstein na rede na Alice, na Amil, na Bradesco Saúde e na SulAmérica…" | "Existem planos com o Einstein na rede" e quatro linhas com o cubo de cada operadora e "✓ Einstein na rede", entrando no nome |
| 25,3–30,2 s | "…a partir de mil trezentos e quarenta e cinco reais por mês, pra uma pessoa de trinta anos." | "A PARTIR DE R$ 1.345,06/mês" rolando, com a observação de valor logo abaixo, e o cartão da cotação "1 pessoa · 30 anos · Alice Exclusivo" |
| 30,2–34,2 s | "Então, antes de renovar ou contratar qualquer plano… compara." | "Então, antes de" com as etiquetas "renovar" e "contratar", balança e "compara." em destaque (respiro na trilha) |
| 34,2–42,1 s | "Clica no link, preenche o formulário e a gente te mostra quais planos têm o Einstein pro seu perfil." | "Quais planos têm o Einstein pro seu perfil?", fachada com "Planos com o Einstein na rede", cubos, botão do formulário, setas "Clique no link abaixo", texto legal |

### Cotação (a mesma do vídeo de referência, a pedido do cliente)

| Perfil | Operadora e plano | Detalhes | Valor |
|---|---|---|---|
| 1 pessoa · 30 anos | Alice · Exclusivo | Saúde PME · Apartamento · Coparticipação 30% | R$ 1.345,06/mês |

As outras três operadoras aparecem só como "planos com o Einstein na rede", sem preço. **Antes de
veicular:** a cotação é de outra corretora — confirmar com as operadoras que esses planos estão
disponíveis por esse valor e que o Einstein está na rede de cada um (Alice, Amil, Bradesco Saúde e
SulAmérica). O valor da cirurgia (R$ 200 mil) também vem do vídeo de referência.

### Observações obrigatórias de segurança comercial (CLAUDE.md da raiz)

Só por escrito, texto exato, fora da locução (sem legendas de fala). Letra de 20 px; 24 px logo abaixo
do preço.

| Cena | Observações |
|---|---|
| Enquete (fotos do hospital) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| "Não está na rede" (rede, mockup) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Conta da cirurgia (foto, mockup) | Imagem meramente ilustrativa. |
| Plano empresarial pelo CNPJ | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Operadoras com o Einstein na rede | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Consulte condições e elegibilidade. · Imagem meramente ilustrativa. |
| Preço | logo abaixo: Valores sujeitos à faixa etária e região. · embaixo: Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. · Cobertura e rede sujeitas à modalidade contratada. · Imagem meramente ilustrativa. |
| Cartão final | dados da cotação · Valores sujeitos à faixa etária e região. · Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. · Cobertura e rede sujeitas à modalidade contratada. · Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Imagem meramente ilustrativa. |

## Gerar de novo

```bash
python3 -I tools/prep_voice.py      # vo.wav (1,1× mais rápido, mesmo tom), vo.words.json e vo.dur
python3 -I tools/synth_audio.py     # efeitos + trilha presa à locução; grava tools/grid.json
bash tools/assemble.sh              # index.html + compositions/*.html + carve da trilha
npx hyperframes check
npx hyperframes render --quality high --fps 30 --output renders/einstein-cnpj-v3-story.mp4
```

`tools/lib.mjs` é o mesmo da variação 2 (paleta, ícones, cubos, cotações, observações, contadores que
rolam); `tools/build.mjs` monta as cenas presas às palavras da locução. Masterização em −14 LUFS,
loudnorm em duas passadas, AAC 256k e faststart.

## Áudio

- **Locução**: ElevenLabs Eleven v4, voz "Roberta - Casual Sales" (voz feminina principal do cliente),
  acelerada 1,1× com atempo (sem mudar o tom): 43,3 s → 39,5 s. Texto em `tools/voice_prompt.txt`;
  tempos por palavra do Scribe v1.
- **Trilha** sintetizada (`tools/synth_audio.py`, ~96 BPM): introdução contida sob a enquete, drop no
  "presta atenção", groove em Lá menor / Fá / Dó / Sol, respiro no "Então, antes de renovar…", subida
  até o "compara." e refrão no "Clica no link".
- **Carve** 0,35 sob a voz. **Efeitos**: toque no botão, impacto, brilho, contador nos valores,
  cartões, check, carimbos, subida, pops e whooshes.

## Assets

- Fotos enviadas pelo cliente (`assets/img/`): fachada e átrio do Einstein e a sala de cirurgia
  robótica (fundo escurecido da conta). Só enquadramento e zoom lento, sem tratamento de cor. As outras
  fotos da pasta ficaram de reserva.
- Cubos das operadoras (Alice, Amil, Bradesco, SulAmérica) iguais aos da V1.
- Tipografia Montserrat e Poppins; paleta azul-meia-noite e champanhe, vermelho para o "não" e a conta,
  verde para "Einstein na rede".
