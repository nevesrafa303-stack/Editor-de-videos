# Banco de vídeos — hospitais

Cortes limpos para usar nos nossos vídeos: só os trechos em que aparecem hospitais, sem a apresentadora, sem áudio e
sem a legenda queimada. Vieram dos Reels de referência da mesma consultora, enviados pelo cliente em 07/11/2026 (lote 1:
Reels 01–04; lote 2: Reels 05–09; ver `criativos/_referencias/copys/ugc-consultora-instagram/`); **o cliente informou
que tem autorização para usar as imagens** (07/11/2026). Os dados de cada corte ficam em `indice.json`.

## Regras de uso

- **Hospital só se estiver na rede.** Um corte com nome ou fachada de hospital (Einstein, Sírio-Libanês, Vila Nova
  Star…) só entra em anúncio de plano que tenha esse hospital na rede e na acomodação da cotação (regra do `CLAUDE.md`).
  Cortes "não identificado" podem ilustrar qualquer peça.
- **Marca de terceiros:** `omint-recepcao` mostra o logo da Omint e `unimed-hospital-fachada` o Hospital Unimed: só em
  peça dessas operadoras. `cirurgia-robotica-01` mostra a marca do robô (da Vinci) no console.
- **Sempre** com "Imagem meramente ilustrativa." na tela.
- São vídeos de celular em 720 px: ficam bem em cartões, janelas e fundos com escurecimento; em tela cheia 1080×1920,
  usar com movimento lento e camada por cima.

## Formatos

| Pasta | Formato | O que é |
|---|---|---|
| `hospitais/vertical/` | 720×1280 (9:16) | Trecho em tela cheia com a legenda apagada quadro a quadro. Em fundos com muito detalhe pode ficar uma marca leve na altura onde estava a legenda (y ≈ 800–1030, conforme o Reel de origem); cobrir com texto ou usar o `recorte-topo/`. |
| `hospitais/recorte-topo/` | 720×784 a 720×944 | O mesmo trecho cortado acima da legenda: 100% limpo, sem reparo. Bom para cartões e janelas. |
| `hospitais/faixa/` | 720×258 a 720×556 (horizontal) | Imagens que nos Reels apareciam na parte de cima da tela, recortadas sem a apresentadora. |

Cortes de 0,4 a 2 s em média (alguns têm 3 a 6 s), 30 fps, H.264, sem áudio.

<!-- tabelas -->
## Tela cheia — `vertical/` (e o mesmo trecho em `recorte-topo/`) · 35 cortes

| Arquivo | Hospital | O que aparece | Duração | Origem | Obs. |
|---|---|---|---|---|---|
| `vertical/einstein-atrio.mp4` | Einstein | átrio com teto de vidro e pessoas sentadas | 1,4 s | 04 check-up Einstein 75,1–76,7 s | marca leve de reparo na faixa da legenda |
| `vertical/einstein-fachada-01.mp4` | Einstein | totem e fachada do Hospital Israelita Albert Einstein | 1,3 s | 01 Omint 58,9–60,4 s | marca leve de reparo na faixa da legenda |
| `vertical/einstein-logo-porta.mp4` | Einstein | logo do Einstein numa porta de madeira | 0,5 s | 01 Omint 21,7–22,3 s |  |
| `vertical/einstein-marquise.mp4` | Einstein | marquise de vidro da entrada, carro chegando | 0,5 s | 04 check-up Einstein 74,4–75,1 s | marca leve de reparo na faixa da legenda |
| `vertical/unimed-hospital-fachada.mp4` | Hospital Unimed | prédio do Hospital Unimed ao entardecer | 0,6 s | 02 caso Sírio 7,5–8,2 s |  |
| `vertical/sirio-libanes-entrada-robotica.mp4` | Sírio-Libanês | entrada com o nome do hospital e robôs cirúrgicos | 0,7 s | 01 Omint 23,8–24,7 s |  |
| `vertical/sirio-libanes-predio-02.mp4` | Sírio-Libanês | torre do hospital vista de baixo | 1,5 s | 07 Sírio-Libanês 4,1–5,7 s | marca leve de reparo na faixa da legenda |
| `vertical/sirio-libanes-predio-03.mp4` | Sírio-Libanês | torre com o letreiro Hospital Sírio-Libanês | 0,9 s | 07 Sírio-Libanês 5,7–6,8 s |  |
| `vertical/sirio-libanes-predio.mp4` | Sírio-Libanês | prédio com logo e palmeiras | 0,9 s | 03 check-up Sírio 6,1–7,3 s |  |
| `vertical/sirio-libanes-recepcao-01.mp4` | Sírio-Libanês | recepção principal (logo iluminado) | 1,2 s | 01 Omint 57,6–58,9 s |  |
| `vertical/sirio-libanes-recepcao-02.mp4` | Sírio-Libanês | recepção principal, câmera andando | 1,3 s | 02 caso Sírio 15,4–16,9 s |  |
| `vertical/sirio-libanes-recepcao-03.mp4` | Sírio-Libanês | recepção com pessoas no balcão | 2,3 s | 03 check-up Sírio 1,0–3,5 s |  |
| `vertical/vila-nova-star-amenities.mp4` | Vila Nova Star | amenities de banho (Trousseau) | 0,5 s | 05 tour Vila Nova Star 10,0–10,7 s |  |
| `vertical/vila-nova-star-centro-diagnostico.mp4` | Vila Nova Star | entrada do centro diagnóstico | 1,3 s | 05 tour Vila Nova Star 71,4–72,8 s |  |
| `vertical/vila-nova-star-corredor.mp4` | Vila Nova Star | corredor com enfermeira caminhando | 2,7 s | 05 tour Vila Nova Star 11,6–14,5 s |  |
| `vertical/vila-nova-star-enxoval.mp4` | Vila Nova Star | travesseiro e enxoval bordado | 0,7 s | 05 tour Vila Nova Star 10,7–11,6 s |  |
| `vertical/vila-nova-star-fachada-02.mp4` | Vila Nova Star | fachada de vidro com o letreiro Vila Nova Star | 2,2 s | 05 tour Vila Nova Star 1,4–3,8 s |  |
| `vertical/vila-nova-star-letreiro.mp4` | Vila Nova Star | parede com o letreiro Vila Nova Star | 1,3 s | 05 tour Vila Nova Star 72,8–74,3 s |  |
| `vertical/vila-nova-star-lobby.mp4` | Vila Nova Star | lobby com pé-direito alto e recepção | 2,5 s | 05 tour Vila Nova Star 5,8–8,5 s |  |
| `vertical/vila-nova-star-medica.mp4` | Vila Nova Star | médica preparando equipamento | 0,8 s | 05 tour Vila Nova Star 29,2–30,2 s |  |
| `vertical/vila-nova-star-quarto-01.mp4` | Vila Nova Star | quarto amplo com cama e poltrona | 1,3 s | 05 tour Vila Nova Star 8,5–10,0 s |  |
| `vertical/vila-nova-star-quarto-02.mp4` | Vila Nova Star | quarto com leito hospitalar e piso de madeira | 2,9 s | 05 tour Vila Nova Star 26,1–29,2 s |  |
| `vertical/vila-nova-star-quarto-03.mp4` | Vila Nova Star | quarto com cama, poltrona e luz quente | 1,0 s | 05 tour Vila Nova Star 43,7–44,9 s |  |
| `vertical/vila-nova-star-quarto-vista.mp4` | Vila Nova Star | quarto com janela para a cidade e tablet | 1,7 s | 05 tour Vila Nova Star 16,9–18,7 s |  |
| `vertical/vila-nova-star-restaurante.mp4` | Vila Nova Star | restaurante com mesas e pé-direito alto | 1,4 s | 05 tour Vila Nova Star 15,3–16,9 s |  |
| `vertical/vila-nova-star-suite-sala.mp4` | Vila Nova Star | sala da suíte com sofás e janelas | 0,4 s | 05 tour Vila Nova Star 25,5–26,1 s |  |
| `vertical/medico-visita-leito.mp4` | não identificado | médico com prancheta visitando paciente | 0,9 s | 02 caso Sírio 32,8–33,9 s | marca leve de reparo na faixa da legenda |
| `vertical/paciente-leito-soro.mp4` | não identificado | paciente no leito com bomba de infusão | 1,3 s | 02 caso Sírio 31,3–32,8 s |  |
| `vertical/quarto-cama.mp4` | não identificado | quarto de internação: cama e mesa de cabeceira | 0,7 s | 01 Omint 4,0–4,9 s |  |
| `vertical/quarto-copa.mp4` | não identificado | copa do quarto com máquina de café | 0,7 s | 01 Omint 22,3–23,2 s | marca leve de reparo na faixa da legenda |
| `vertical/quarto-sala-tv.mp4` | não identificado | quarto/suíte com projeção na parede | 0,6 s | 01 Omint 4,9–5,7 s |  |
| `vertical/sala-exame-oftalmo.mp4` | provável Einstein (vídeo do check-up) | sala de exame com equipamento de oftalmologia | 1,5 s | 04 check-up Einstein 7,5–9,2 s |  |
| `vertical/sala-de-espera.mp4` | provável Sírio-Libanês (vídeo do check-up) | sala de espera com poltronas | 1,9 s | 03 check-up Sírio 19,1–21,2 s |  |
| `vertical/cirurgia-robotica-01.mp4` | provável Vila Nova Star (vídeo do VNS) | cirurgião no console do robô, luz azul | 1,5 s | 05 tour Vila Nova Star 36,5–38,2 s |  |
| `vertical/cirurgia-robotica-02.mp4` | provável Vila Nova Star (vídeo do VNS) | mãos no controle do robô cirúrgico | 0,9 s | 05 tour Vila Nova Star 38,2–39,3 s |  |

## Faixas — `faixa/` · 32 cortes

| Arquivo | Hospital | O que aparece | Duração | Origem |
|---|---|---|---|---|
| `faixa/einstein-checkup-bioimpedancia.mp4` | Einstein | balança de bioimpedância | 0,6 s | 04 check-up Einstein 34,8–35,6 s |
| `faixa/einstein-checkup-consultorio.mp4` | Einstein | médica no computador do consultório | 0,7 s | 04 check-up Einstein 30,7–31,6 s |
| `faixa/einstein-checkup-enfermeira.mp4` | Einstein | enfermeira sorrindo no corredor | 1,5 s | 04 check-up Einstein 16,6–18,3 s |
| `faixa/einstein-checkup-ergometria.mp4` | Einstein | sala de ergometria (0,6 s) | 0,4 s | 04 check-up Einstein 25,8–26,5 s |
| `faixa/einstein-checkup-esteira.mp4` | Einstein | paciente na esteira ergométrica | 0,8 s | 04 check-up Einstein 31,6–32,7 s |
| `faixa/einstein-checkup-medico-tablet.mp4` | Einstein | médico mostrando resultados no tablet | 3,9 s | 04 check-up Einstein 48,9–53,0 s |
| `faixa/einstein-checkup-paciente.mp4` | Einstein | paciente idoso sendo examinado | 1,2 s | 04 check-up Einstein 32,7–34,1 s |
| `faixa/einstein-checkup-tablet.mp4` | Einstein | médico avaliando no tablet | 1,4 s | 04 check-up Einstein 26,5–28,1 s |
| `faixa/einstein-checkup-triagem.mp4` | Einstein | placa Triagem / Bioimpedância | 1,5 s | 04 check-up Einstein 14,9–16,6 s |
| `faixa/einstein-checkup-ultrassom.mp4` | Einstein | sala de ultrassom | 1,9 s | 04 check-up Einstein 23,7–25,8 s |
| `faixa/einstein-fachada-03.mp4` | Einstein | totem e fachada do Einstein, câmera subindo | 2,8 s | 04 check-up Einstein 0,0–3,1 s |
| `faixa/einstein-placa-cardiologia.mp4` | Einstein | placa Cardiologia / Mamografia | 0,8 s | 04 check-up Einstein 28,1–29,2 s |
| `faixa/einstein-vista-aerea.mp4` | Einstein | vista aérea do Einstein Morumbi | 0,3 s | 09 ranking de planos 18,2–18,7 s |
| `faixa/omint-recepcao.mp4` | Omint (centro da operadora, não é hospital) | recepção com o logo da Omint | 0,6 s | 01 Omint 0,0–0,7 s |
| `faixa/sirio-libanes-balcao.mp4` | Sírio-Libanês | balcão com o logo Sírio-Libanês | 5,0 s | 03 check-up Sírio 37,4–42,6 s |
| `faixa/sirio-libanes-catracas.mp4` | Sírio-Libanês | lobby com catracas | 1,1 s | 02 caso Sírio 57,4–58,8 s |
| `faixa/sirio-libanes-fachada-01.mp4` | Sírio-Libanês | fachada com o logo, de baixo para cima | 1,0 s | 02 caso Sírio 0,0–1,3 s |
| `faixa/sirio-libanes-fachada-02.mp4` | Sírio-Libanês | fachada com o nome e palmeiras | 3,7 s | 02 caso Sírio 19,3–23,2 s |
| `faixa/sirio-libanes-fachada-03.mp4` | Sírio-Libanês | fachada com o logo | 1,3 s | 02 caso Sírio 65,3–66,9 s |
| `faixa/sirio-libanes-placa.mp4` | Sírio-Libanês | placa de madeira com o nome do hospital | 1,4 s | 02 caso Sírio 25,0–26,6 s |
| `faixa/sirio-libanes-predio-faixa.mp4` | Sírio-Libanês | prédio do Sírio-Libanês | 0,3 s | 09 ranking de planos 18,7–19,2 s |
| `faixa/sirio-libanes-recepcao-faixa.mp4` | Sírio-Libanês | recepção principal (0,4 s) | 0,5 s | 01 Omint 15,5–16,0 s |
| `faixa/vila-nova-star-fachada.mp4` | Vila Nova Star | fachada com o nome Vila Nova Star (0,5 s) | 0,6 s | 01 Omint 16,0–16,7 s |
| `faixa/equipe-cirurgica.mp4` | não identificado | equipe em centro cirúrgico | 1,2 s | 01 Omint 13,6–15,0 s |
| `faixa/equipe-recepcao.mp4` | não identificado | enfermeira, recepcionista e médico | 1,9 s | 01 Omint 69,1–71,2 s |
| `faixa/medico-consulta.mp4` | não identificado | mãos do médico com estetoscópio e prontuário | 6,2 s | 03 check-up Sírio 46,3–52,8 s |
| `faixa/quarto-equipamentos.mp4` | não identificado | quarto com equipamentos e paciente | 1,8 s | 01 Omint 50,7–52,7 s |
| `faixa/sala-de-espera-02.mp4` | não identificado | sala de espera com poltronas | 0,9 s | 02 caso Sírio 58,8–59,9 s |
| `faixa/sala-exame-maca.mp4` | não identificado | profissional atendendo paciente na maca | 1,9 s | 01 Omint 46,7–48,9 s |
| `faixa/recepcao-marmore.mp4` | não identificado (provável Omint) | recepção com balcão de mármore | 1,0 s | 01 Omint 0,7–1,8 s |
| `faixa/checkup-cardio.mp4` | provável Sírio-Libanês (vídeo do check-up) | equipe e paciente na avaliação cardiovascular | 3,1 s | 03 check-up Sírio 26,6–29,9 s |
| `faixa/checkup-recepcao.mp4` | provável Sírio-Libanês (vídeo do check-up) | recepção do check-up com equipe | 2,0 s | 03 check-up Sírio 24,4–26,6 s |
<!-- /tabelas -->

## Como foram feitos

Cortes detectados por mudança de cena e conferidos quadro a quadro; ficaram de fora os trechos em que ela aparece
(inclusive de costas, refletida no espelho ou só a mão) e os closes de braço/perna em exame. A legenda (branca,
centralizada, sempre na mesma altura em cada vídeo) foi apagada com OpenCV (inpainting Telea) só na faixa dela e só
nos pixels de letra; depois cada corte foi varrido quadro a quadro para conferir que não sobrou texto.

## Como adicionar vídeos novos (próximos lotes do cliente)

Ferramentas em `tools/` (precisam de ffmpeg; `limpar_corte.py` precisa de `opencv-python-headless` e `numpy`):

1. **Transcrever** a fala, para o guia de copy (`criativos/_referencias/copys/`):
   `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx hyperframes transcribe VIDEO.mp4 -m small -l pt --json`
   (o proxy precisa estar ligado no Node para baixar o modelo Whisper).
2. **Achar os cortes:** `python -I tools/folha_de_cortes.py VIDEO.mp4 folha.jpg` lista os trechos e monta uma folha com
   um quadro de cada; escolher os de hospital em que a apresentadora não aparece.
3. **Medir a legenda:** ver em que altura (linhas y) fica a legenda branca daquele vídeo; ela costuma ser centralizada
   e fixa.
4. **Recortar e limpar:** `python -I tools/limpar_corte.py VIDEO.mp4 T0 T1 saida.mp4 --cap Y0,Y1` (tela cheia com a
   legenda apagada) ou `--crop 0,0,720,ALTURA` (só a parte de cima, sem reparo). Cortar 0,1 s depois do início e
   0,08 s antes do fim do trecho para não pegar quadro de transição. Se ficar "fantasma" da letra (legenda com sombra),
   refazer com `--grow 19`.
5. **Conferir** quadro a quadro que não sobrou texto e que ela não aparece (olhar de perto a faixa da legenda).
6. **Registrar:** acrescentar o corte em `indice.json` e rodar `python -I tools/gerar_indice.py` (refaz as tabelas
   acima) e `python -I tools/gerar_painel.py` (refaz o `_painel.jpg`).
