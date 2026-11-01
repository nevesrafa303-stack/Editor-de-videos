# Banco de imagens — criativos de plano de saúde

Fotos enviadas pelo cliente para usar nos criativos. **Regra de uso:**

- **`familia/`** → criativos direcionados a **família / pessoa física** (proteger a família, dependentes, filhos).
- **`empresarial/`** → criativos direcionados a **empresas** (CNPJ, PME, MEI, sócios, equipe, "benefício para colaboradores").

Usar sempre a versão em alta de **`hd/`** (mesma estrutura e mesmos nomes). Os originais ficam em
`familia/` e `empresarial/`; `_painel-familia.jpg` e `_painel-empresarial.jpg` mostram todas.

Toda peça de plano de saúde com estas fotos leva **"Imagem meramente ilustrativa."** (regra do `CLAUDE.md`):
são fotos de banco e várias parecem geradas por IA.

## Família

| Arquivo | Original | Quem aparece | Bom para |
|---|---|---|---|
| `01-abraco-casa-luzes` | 474×592 | pai, mãe, filha e filho abraçados, sala com luzinhas, tom quente | família com 2 filhos, aconchego, fim de ano |
| `02-abraco-sala-risadas` | 1200×1200 | pai, mãe, menino e bebê rindo no chão da sala, luz natural | alegria, família com crianças pequenas |
| `03-filha-nos-ombros` | 720×720 | filha nos ombros do pai, mãe atrás, sala clara | 3 vidas (casal + 1 filha), leveza |
| `04-casal-com-bebe` | 1199×799 (horizontal) | casal com bebê de colo | 3 vidas, bebê, pediatria; bom para Feed/1:1 e painel lateral |
| `05-gramado-pais-e-filha` | 512×640 | pai, mãe e filha deitados no gramado | 3 vidas, ar livre |
| `06-gramado-vista-de-cima` | 474×711 | pai, mãe e filho deitados na grama, vista de cima | 3 vidas, retrato vertical (Story) |
| `07-piquenique-no-gramado` | 1200×1600 | mãe, pai e filho numa manta no gramado, tons bege | 3 vidas, muito espaço de grama no topo para texto |

## Empresarial

| Arquivo | Original | Quem aparece | Bom para |
|---|---|---|---|
| `01-reuniao-lounge` | 1024×1536 | três pessoas em reunião num lounge com notebook | consultoria, cotação, "fale com um especialista" |
| `02-reuniao-mesa` | 832×1248 | dois homens em conversa de negócios | sócios, negociação |
| `03-apresentacao-equipe` | 1024×1536 | gestor apresentando para a equipe | benefício para colaboradores, PME |
| `04-equipe-de-terno` | 736×1104 | quatro profissionais de terno em fila | empresa, equipe (4+ vidas) |
| `05-trio-socia-ao-centro` | 1200×1200 | sócia à frente, dois sócios atrás | **3 vidas**, empresa liderada por mulher |
| `06-trio-socio-de-oculos` | 1200×1200 | sócio careca de óculos entre duas sócias | **3 vidas** |
| `07-trio-socio-de-gravata` | 1200×1200 | sócio de gravata entre duas sócias | **3 vidas** |
| `08-trio-escritorio-janela` | 1200×1200 | três sócios sorrindo, escritório com janela | **3 vidas**, sócios de idades diferentes |
| `09-equipe-comemorando` | 768×1344 | equipe comemorando de braços para cima | conquista, "sua equipe merece", PME |
| `10-trio-frente-janelas` | 1200×1200 | sócia ao centro entre dois sócios, janelões ao fundo | **3 vidas** |
| `11-aperto-de-maos` | 912×1600 (vertical) | dois sócios apertando as mãos | **2 vidas**, acordo fechado, "feche o plano da sua empresa"; bom para Story |
| `12-dupla-de-socios` | 1080×1080 | sócio e sócia lado a lado, escritório | **2 vidas**, casal de sócios |

## Cuidados

- `empresarial/02` e `09` mostram o logo da Apple nos notebooks; `03` tem notebooks em primeiro plano: cortar ou
  desfocar quando aparecer no enquadramento (marca de terceiro). Em `01` o notebook não mostra logo.
- `empresarial/11` tem um texto sem sentido na parede ao fundo (foto gerada por IA): cortar ou desfocar.
- Os trios (05 a 08 e 10) casam com ofertas de **3 vidas**; as duplas (02, 11 e 12), com **2 vidas**.
- Fotos pequenas (menos de 900 px) só devem ir para peça pela versão em `hd/`.

## Como gerar `hd/`

```bash
# pesos em https://github.com/xinntao/Real-ESRGAN/releases (requer torch CPU + spandrel)
python3 -I criativos/_banco-de-imagens/ampliar.py /pasta/dos/pesos              # todas as que faltam
python3 -I criativos/_banco-de-imagens/ampliar.py /pasta/dos/pesos familia/04-casal-com-bebe.jpg
```

Super-resolução Real-ESRGAN (4x para fotos com menos de 1000 px de largura, 2x para as demais), depois a
textura fina da foto original é devolvida e entra uma nitidez sutil, para a pele não ficar com aspecto de
plástico.
