# Vila Nova Star pelo CNPJ/MEI — story 9:16 (~50 s)

Anúncio de formulário no Meta Ads para empresários e empreendedores da **capital de São Paulo**, com **CNPJ ou MEI** e
**3 vidas ou mais**, público de alto padrão. Sem preço na peça. Voz: **Roberta** (ElevenLabs Eleven v4).

## De onde veio a copy

Modelada no **Reel 05** das referências do cliente (tour do Vila Nova Star; `criativos/_referencias/copys/`), com os
padrões do guia de copy:

- **Gancho em pergunta** com o nome do hospital e a cidade: "Por que tanta gente em São Paulo quer o Vila Nova Star no
  plano de saúde?" (o nome aparece grande desde o quadro 0).
- **Hospital como experiência:** "parece mais um hotel de alto padrão do que um hospital" e um detalhe que ninguém
  imagina — o pronto-socorro em suíte individual, "é a equipe que vai até você" (padrão 12).
- **Virada:** "nem todo mundo que é atendido lá paga tudo no particular" (padrão 13).
- **Filtro** CNPJ/MEI + 3 vidas falado, **comparação de operadoras**, **frase-tese** ("Não é só um hospital bonito. É um
  padrão de atendimento que você acessa com o plano certo.") e **CTA do formulário**.

Diferente da referência: nada de preço, nada de "um dos mais luxuosos do Brasil" (superlativo sem fonte) e o CTA vai
para o formulário ("Solicite sua cotação"), não para comentário.

## Roteiro

| Tempo | Fala (Roberta, 1,1×) | Na tela |
|---|---|---|
| 0–4,2 s | "Por que tanta gente em São Paulo quer o Vila Nova Star no plano de saúde?" | fachada e letreiro do VNS; pergunta com "VILA NOVA STAR" em dourado |
| 4,2–14,4 s | "Quando você entra, ele parece mais um hotel de alto padrão do que um hospital. Apartamentos amplos com vista pra cidade… concierge… e cardápio assinado por chef." | lobby, quartos, enxoval, suíte, restaurante; "HOTEL DE ALTO PADRÃO" e 3 itens (apartamentos com vista, concierge, cardápio assinado por chef) |
| 14,4–23,9 s | "Mas o que mais impressiona é o pronto-socorro: você é atendido numa suíte individual, e a consulta e os exames acontecem ali dentro. É a equipe que vai até você." | corredor, quarto com leito, médica, centro diagnóstico; "O PRONTO-SOCORRO EM SUÍTE INDIVIDUAL", consulta · exames · na própria suíte |
| 23,9–27,0 s | "E nem todo mundo que é atendido lá paga tudo no particular." | cirurgia robótica; "PAGA TUDO NO PARTICULAR" riscado |
| 27,0–37,3 s | "Se você tem CNPJ ou MEI e três vidas ou mais, existem planos empresariais com o Vila Nova Star na rede… e a gente compara as operadoras pra encontrar o melhor pro seu perfil." | ✓ CNPJ ou MEI, ✓ 3 vidas ou mais, cartão "NA REDE · VILA NOVA STAR"; comparação de 3 operadoras ilustrativas com "Melhor pro seu perfil" |
| 37,3–42,4 s | "Não é só um hospital bonito. É um padrão de atendimento que você acessa com o plano certo." | lobby, quarto com vista, fachada |
| 42,4–50,4 s | "Clica no link, preenche o formulário e receba sua cotação." | PLANOS DE SAÚDE · EXCLUSIVO PARA CNPJ/MEI · a partir de 3 vidas · capital de São Paulo; botão "Solicite sua cotação"; "Clique no link abaixo"; texto legal |

Do início ao CTA, o topo mostra sempre a tarja **PLANOS DE SAÚDE**, o selo **EXCLUSIVO PARA CNPJ/MEI** e "a partir
de 3 vidas · capital de São Paulo" (regra do `CLAUDE.md`).

## Fontes das informações

- **Hospital (site oficial, consultado em 07/11/2026):**
  [rededorsaoluiz.com.br/star/vilanovastar](https://www.rededorsaoluiz.com.br/star/vilanovastar)
  - Pronto-socorro adulto (`/servicos/emergencia`): atendimento em **suítes individuais**; triagem, consulta, coleta de
    exames, infusões, raio-x, ultrassom e reavaliação feitos na suíte, "eliminando a necessidade de deslocamento do
    paciente".
  - Acomodações (`/o-hospital/acomodacoes`): hotelaria de alto padrão, apartamentos amplos com vista panorâmica,
    enxoval e amenities especiais, frigobar, **concierge**; alta gastronomia com cardápios **assinados pelo chef Roland**.
  - Cirurgia robótica (`/servicos/cirurgia-robotica`): robôs Da Vinci Xi, Rosa e Velys (só na imagem, não na fala).
- **Rede (confirmar antes de veicular):** levantamento de corretora que cita o Painel do Corretor da SulAmérica: o
  Vila Nova Star consta da rede de referência SulAmérica SP com internação especializada a partir do **Especial RC** e
  internação e pronto-socorro do **Especial Mais ao Prestige**. A peça não cita operadora; a cotação enviada ao lead
  precisa ter o Vila Nova Star na rede e na acomodação do plano.

## Imagens

Cortes do banco de vídeos (`criativos/_banco-de-videos/hospitais/vertical/`, Reel 05, uso autorizado segundo o
cliente): fachada, letreiro, lobby, quartos 01–03, quarto com vista, sala da suíte, enxoval, amenities, restaurante,
corredor, médica, centro diagnóstico e cirurgia robótica. Os mais curtos foram desacelerados (0,5× a 0,9×) em
`tools/prep_clips.py`. Fundo das cenas de design: lobby e fachada desfocados. O console do robô mostra a marca "da
Vinci" (equipamento, não operadora).

## Observações obrigatórias (texto exato, só na tela)

| Cena | Observações |
|---|---|
| Gancho, tour, tese | Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Imagem meramente ilustrativa. |
| Pronto-socorro | fonte (site oficial) · Consulte a disponibilidade da rede hospitalar. · Cobertura e rede sujeitas à modalidade contratada. · Imagem meramente ilustrativa. |
| Particular | Imagem meramente ilustrativa. |
| CNPJ e comparação | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Valores sujeitos à faixa etária e região. · Os valores podem variar conforme perfil do beneficiário. · A rede credenciada pode variar conforme plano contratado. · Cobertura e rede sujeitas à modalidade contratada. · "Operadoras ilustrativas." |
| Cartão final | hospital como exemplo de rede + exclusivo CNPJ/MEI, 3 vidas, capital · fonte das informações do hospital · Consulte a disponibilidade da rede hospitalar. · A rede credenciada pode variar conforme plano contratado. · Cobertura e rede sujeitas à modalidade contratada. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Valores sujeitos à faixa etária e região. · Os valores podem variar conforme perfil do beneficiário. · Imagem meramente ilustrativa. |

## Texto do anúncio no Meta (sugestão)

- **Texto principal:** "O pronto-socorro do Vila Nova Star atende em suítes individuais, e a equipe vai até você. Se você tem
  CNPJ ou MEI e a partir de 3 vidas, existem planos empresariais com o Vila Nova Star na rede. A gente compara as
  operadoras e manda a cotação pro seu perfil. Exclusivo para CNPJ/MEI, a partir de 3 vidas, capital de São Paulo."
- **Título:** "Vila Nova Star pelo seu CNPJ" · **Descrição:** "Exclusivo CNPJ/MEI · 3+ vidas"
- **Botão:** Obter cotação
- Observações no texto: Consulte a disponibilidade da rede hospitalar. Consulte condições e elegibilidade.

## Gerar de novo

```bash
python3 -I tools/prep_voice.py      # vo.wav (1,1×), vo.words.json e vo.dur a partir de takes/take.mp3 (tomada A)
python3 -I tools/prep_clips.py      # cortes do banco de vídeos para assets/video
python -I tools/synth_audio.py      # trilha presa à locução (drop no "Quando você entra"), grava tools/grid.json
bash tools/assemble.sh              # index.html + compositions/*.html + carve da trilha
npx hyperframes check
npx hyperframes render --quality high --fps 30 --output renders/vila-nova-star-cnpj.mp4
```

Locução: tomada A de 2 (`assets/voice/takes/`), texto em `tools/voice_prompt.txt`, tempos do Scribe v1.
Masterização em −14 LUFS, AAC 256k, faststart.
