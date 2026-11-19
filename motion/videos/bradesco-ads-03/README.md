# Ads 03 Bradesco (story 9:16, 41,4 s)

Edição do vídeo do corretor João Olegario (Bradesco Saúde/Mediservice) que veio pelo Google Drive em 19/11/2026
("Ads 03 Bradesco", 1080×1920, 30 fps). O vídeo já vem com cortes secos, a tarja "João Olegario · Corretor Bradesco
Saúde" nos primeiros segundos e um selo pequeno da Bradesco no canto.

**O que entrou:**
- legenda palavra a palavra;
- painel de infográficos sincronizado com a fala;
- trilha;
- efeitos sonoros.

A fala é a original. O formato é o mesmo dos Ads 01 Friday e 02 (`bradesco-ads-01-friday`, `bradesco-ads-02`), na
paleta da Bradesco Saúde. O anúncio leva ao formulário do Meta.

## Enquadramento

Os planos deste vídeo variam: a cabeça fica entre y 390 (planos fechados) e 630 (abertos) no quadro original. Por
isso:

| Item | Valor |
|---|---|
| Vídeo em tela cheia | desce 100 px |
| Vídeo com o painel | desce 800 px (o rosto cabe inteiro em todos os planos) |
| Legenda em tela cheia | sobe para y 1190, acima da tarja do apresentador |
| Texto legal do gancho | logo abaixo do cabeçalho, sobre a parede |

## Roteiro e infográficos

| Tempo | Fala | Na tela |
|---|---|---|
| 0–4,3 s | "Ei, deixa eu te contar uma coisa, você já deve ter ouvido falar da Bradesco Saúde, né?" | Tela cheia, com a tarja do João do próprio vídeo. Punch-ins no "contar" e no "Bradesco". |
| 4,3–7,9 s | "Ah, João, mas é um plano de saúde top demais, mas é muito caro." | O painel desce com a citação entre aspas: "Ah, João, mas é um plano **top demais**… mas é **muito caro**!" e a etiqueta "R$" tremendo |
| 7,9–11,1 s | "Então se prepara, porque talvez você ainda não saiba disso." | "Então… SE PREPARA!" bate na tela + "talvez você ainda não saiba disso" |
| 11,1–18,9 s | "A Bradesco Saúde trouxe aqui para a nossa região uma nova opção de plano de saúde para empresas, de 3 até 199 pessoas." | Logo da Bradesco Saúde com impacto. "Novidade na nossa região" e "Plano para empresas". Contagem "de 3 a 199 pessoas" que termina exatamente no "199". |
| 18,9–28,1 s | "Um plano com abrangência nacional, excelentes hospitais e aquela qualidade de tratamento de alto custo que somente clientes Bradesco têm essa segurança." | "Um plano com" + ✓ Abrangência nacional ✓ Excelentes hospitais ✓ Tratamentos de alto custo |
| 28,1–32,7 s | "E olha, um custo que tenho certeza que vai surpreender você." | Medidor de custo: o ponteiro sai do "alto" e cai para o "baixo" no "surpreender". "Um custo que vai surpreender você". |
| 32,7–35,9 s | "Talvez a sua empresa esteja aí pagando mais do que precisa." | O painel sobe; tela cheia com punch-in no "mais" |
| 35,9–41,4 s | "Clica aqui no botão abaixo, faça a sua cotação e descubra quanto você pode economizar." | Botão "Solicite sua cotação / Preencha o formulário" apertado no "cotação", "✓ Exclusivo para CNPJ/MEI · a partir de 3 vidas" e o texto legal |

**Sem balão de conversa:** a objeção aparece como citação entre aspas, não como balão de chat, para seguir o `CLAUDE.md`.

**CTA na tela:** só de formulário.

## Confirmar antes de subir

- **"De 3 até 199 pessoas":** é fala do cliente. O material oficial do Bradesco Saúde Efetivo Plus (agosto/2026) diz
  "empresas a partir de 3 pessoas". O limite de 199 vidas é o da linha PME, mas não está nesse material. Ver
  `criativos/cotacoes-sulamerica-bradesco-sp/fontes/`.
- **"Somente clientes Bradesco têm essa segurança":** ficou só na fala e na legenda. Na tela não há afirmação de
  exclusividade, só "Tratamentos de alto custo".
- **"Um custo que vai surpreender você":** sem valor na tela. O medidor é ilustrativo, sem números, e a observação de
  valor acompanha.
- **"Nossa região":** na tela ficou "Novidade na nossa região", sem cidade.

## Observações obrigatórias (texto exato, só na tela)

| Trecho | Observações |
|---|---|
| Gancho, tela cheia | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| "Muito caro" | Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. |
| Se prepara | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| 3 a 199 pessoas | Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. |
| Abrangência, hospitais, tratamento | Cobertura e rede sujeitas à modalidade contratada. · A rede credenciada pode variar conforme plano contratado. · Consulte a disponibilidade da rede hospitalar. |
| Custo | Valores referenciais sujeitos às regras da operadora. · Valores sujeitos à faixa etária e região. |
| "Pagando mais", tela cheia | Valores referenciais sujeitos às regras da operadora. · Os valores podem variar conforme perfil do beneficiário. |
| CTA (fim) | Plano de saúde empresarial Bradesco Saúde para empresas de 3 a 199 vidas, com abrangência nacional conforme o plano contratado. · Exclusivo para CNPJ/MEI. · Consulte condições e elegibilidade. · Condições sujeitas à análise comercial. · Valores referenciais sujeitos às regras da operadora. · Cobertura e rede sujeitas à modalidade contratada. |

O texto legal tem 19 px e fica entre 230 e 1536 px. O `hyperframes check` passa sem erros.

## Áudio

- **Voz:** o áudio original, tratado com passa-altas, compressão leve e nível de fala (`tools/prep_voice.sh`).
- **Trilha:** sintetizada em Dó sustenido menor, ~96 BPM (`tools/synth_audio.py`).
  - Piano no gancho e na objeção.
  - Subida no "Então se prepara".
  - Drop na revelação "A Bradesco Saúde trouxe…".
  - Refrão no "Clica aqui no botão".
  - Fica abaixo da voz (`tools/duck_bgm.sh`, volume 1,4).
- **Efeitos:** 22 ao todo.
  - whoosh nas trocas;
  - cartão na citação e pop na etiqueta "R$";
  - carimbo no "SE PREPARA";
  - subida + impacto na revelação;
  - contador no 3 → 199;
  - check nos ✓;
  - brilho no "surpreender";
  - toque no botão.

## Gerar de novo

```bash
python3 -I tools/clean_words.py
bash tools/prep_voice.sh
<venv>/python -I tools/synth_audio.py
bash tools/duck_bgm.sh
node tools/build.mjs
npx hyperframes check
npx hyperframes render --quality high --fps 30 --sdr --output renders/bradesco-ads-03.mp4
```
