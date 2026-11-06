# SulAmérica Direto Nacional 3 vidas — variação 3, "3 motivos" (story 9:16, 36,6 s)

Terceira de três variações para teste no Meta Ads (anúncio de formulário) da mesma cotação
SulAmérica Direto Nacional, enfermaria, sem coparticipação, 3 vidas. Público: empresários com CNPJ ou
MEI que podem pagar R$ 1.500 ou mais por um plano. As outras: `../sulamerica-direto-v1-cinema` e
`../sulamerica-direto-v2-planilha`.

- **Ângulo:** lista rápida e direta, a mais curta das três: quem tem CNPJ ou MEI e não tem plano
  recebe três motivos (sem coparticipação, hospitais de referência, a família toda protegida pelo
  preço da cotação) e um prazo (cotação válida até 19/12/2026).
- **Design:** cinético e colorido, nativo de rede social: fundos laranja, azul-marinho e branco que
  se alternam a cada motivo, Montserrat Black gigante, adesivos inclinados que "pulam", vídeos em
  círculo e em cartões, cortes laterais no ritmo da trilha. Voz feminina "Roberta".
- **Gancho nos 3 primeiros segundos:** o quadro 0 já mostra "TEM CNPJ OU MEI?" em adesivos sobre o
  laranja, com mãos assinando um contrato num círculo; "e ainda não tem plano de saúde?" entra na fala.
- **CTA:** "Clica no link e preenche o formulário… essa cotação vale até 19 de dezembro." → resumo dos
  3 motivos, botão do formulário, "Clique no link abaixo" e o selo "Cotação válida até 19/12/2026".

## Roteiro

| Tempo | Fala | Na tela |
|---|---|---|
| 0–3,6 s | "Tem CNPJ ou MEI e ainda não tem plano de saúde?" | laranja: "TEM", adesivos "CNPJ" e "OU MEI?", contrato sendo assinado no círculo |
| 3,6–6,7 s | "Então olha esses três motivos pra fazer agora." | azul-marinho: "3" gigante, "MOTIVOS", "pra fazer agora", casas 1-2-3 |
| 6,7–12,9 s | "Um: sem coparticipação. Consulta, exame e pronto-socorro… sem pagar nada a mais." | branco: "MOTIVO 1 · SEM COPARTICIPAÇÃO", médico medindo pressão, adesivos Consulta / Exame / Pronto-socorro, "sem pagar nada a mais" marcado em amarelo |
| 12,9–20,3 s | "Dois: hospitais de referência em São Paulo, como a BP, Beneficência Portuguesa, o Sepaco e unidades da Rede D'Or São Luiz." | corredor de hospital ao fundo: "MOTIVO 2 · HOSPITAIS DE REFERÊNCIA EM SP", foto do Hospital BP, adesivos BP, Sepaco e Rede D'Or São Luiz |
| 20,3–29,4 s | "Três: a família toda protegida. Três vidas no SulAmérica Direto Nacional por R$ 1.593,54 por mês, já com IOF." | laranja: "MOTIVO 3 · A FAMÍLIA TODA PROTEGIDA", mãe e filha com a médica no círculo; cartão da cotação: logo, Direto Nacional, Enfermaria · Sem coparticipação, 3 vidas, preço rolando, "JÁ COM IOF" |
| 29,4–36,6 s | "Clica no link e preenche o formulário… essa cotação vale até dezenove de dezembro." | equipe médica ao fundo: "Exclusivo CNPJ/MEI · a partir de 3 vidas", os 3 motivos, botão do formulário, "Clique no link abaixo", selo "Cotação válida até 19/12/2026", texto legal |

## Cotação (tabela enviada pelo cliente)

SulAmérica Saúde · Direto Nacional · Nacional SP (CAP1) · enfermaria · sem coparticipação · 3 vidas:
2 vidas de 34 a 38 anos (R$ 612,02 cada) e 1 vida de 0 a 18 anos (R$ 332,45). Prêmio R$ 1.556,49 +
IOF 2,38% (R$ 37,05) = **R$ 1.593,54/mês**. Valores per capita sem IOF. Validade da cotação:
19/12/2026. Exclusivo para CNPJ/MEI, a partir de 3 vidas.

## Rede citada — confirmar antes de veicular

BP – Beneficência Portuguesa, Hospital e Maternidade Sepaco e unidades da Rede D'Or São Luiz aparecem
com rede **a partir do Direto Nacional** na rede de referência SulAmérica SP (PME), segundo
levantamento de uma corretora que cita o Painel do Corretor da SulAmérica em 23/10/2026. **Antes de
veicular:** confirmar no Painel do Corretor a rede do Direto Nacional – Enfermaria para esses
hospitais.

## Observações obrigatórias de segurança comercial (CLAUDE.md da raiz)

Só por escrito, texto exato, fora da locução (sem legendas de fala). Letra de 20 px (19 px no cartão
final); 22 px logo abaixo do preço.

| Cena | Observações |
|---|---|
| Gancho / 3 motivos | — (nenhuma promessa de plano, valor ou rede) |
| Motivo 1 · sem coparticipação (vídeo) | Cobertura e rede sujeitas à modalidade contratada. · Imagem meramente ilustrativa. |
| Motivo 2 · hospitais (foto do BP, vídeo) | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. · crédito da foto |
| Motivo 3 · preço | logo abaixo: Valores sujeitos à faixa etária e região. · embaixo: Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. · Imagem meramente ilustrativa. |
| Cartão final (prazo da cotação) | logo abaixo do preço: Valores sujeitos à faixa etária e região. · texto legal: dados da cotação + hospitais como exemplos da rede + crédito da foto · Valores sujeitos à faixa etária e região. · Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. · Cobertura e rede sujeitas à modalidade contratada. · Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Oferta sujeita à disponibilidade comercial. · Imagem meramente ilustrativa. |

## Gerar de novo

```bash
python3 -I tools/prep_voice.py      # vo.wav (1,1× mais rápido, mesmo tom), vo.words.json e vo.dur
python3 -I tools/prep_clips.py      # baixa do Mixkit e recorta os vídeos (tools/clips.json)
python3 -I tools/synth_audio.py     # efeitos + trilha presa à locução; grava tools/grid.json
bash tools/assemble.sh              # index.html + compositions/*.html + carve da trilha
npx hyperframes check
npx hyperframes render --quality high --fps 30 --output renders/sulamerica-direto-v3-motivos.mp4
```

`tools/core.mjs` é o mesmo nas três variações; `tools/build.mjs` tem o visual desta. Masterização em
−14 LUFS, loudnorm em duas passadas, AAC 256k e faststart.

## Áudio

- **Locução:** ElevenLabs Eleven v4, voz feminina "Roberta - Casual Sales" (voz padrão do cliente),
  tomada A de 2, acelerada 1,1× com atempo: 37,2 s → 33,9 s. Texto em `tools/voice_prompt.txt`;
  tempos por palavra do Scribe v1.
- **Trilha** sintetizada, ~106 BPM (a mais rápida das três): subida curta no gancho, drop no "Um:",
  groove em Fá / Dó / Sol / Lá menor meio tom acima nos três motivos, refrão no "Clica no link".
  Carve 0,35 sob a voz.
- **Efeitos:** pops nos adesivos, whooshes nos cortes, impactos no "3", carimbos, contador no preço.

## Assets

- **Vídeos de banco** (Mixkit, licença gratuita para uso comercial, sem atribuição obrigatória),
  recortados na vertical, sem correção de cor: 241 (contrato), 28149 (pressão arterial), 4779
  (corredor de hospital), 5992 (mãe e filha com a médica), 4766 (equipe médica). Lista e cortes em
  `tools/clips.json`.
- **Foto do Hospital BP** (`assets/img/bp-bloco.jpg`): Cecilia Melozi, CC BY-SA 4.0, Wikimedia
  Commons; crédito no vídeo.
- Logo SulAmérica em azul-marinho e onda laranja, iguais aos anúncios anteriores.
