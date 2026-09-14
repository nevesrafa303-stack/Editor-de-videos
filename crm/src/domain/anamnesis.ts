/** Perguntas da anamnese. Mudar esta lista não inválida fichas antigas: o
 *  questionario e gravado como JSON e lido pela chave. */
export const ANAMNESIS_QUESTIONS = [
  { key: "tratamento_medico", label: "Esta em tratamento médico no momento?" },
  { key: "medicamento_continuo", label: "Usa medicamento de uso contínuo?" },
  { key: "alergia", label: "Tem alergia a algum medicamento ou anestésico?" },
  { key: "diabetes", label: "Tem diabetes?" },
  { key: "hipertensao", label: "Tem pressao alta?" },
  { key: "cardiopatia", label: "Tem problema cardíaco?" },
  { key: "anticoagulante", label: "Usa anticoagulante?" },
  { key: "gestante", label: "Esta grávida ou amamentando?" },
  { key: "fumante", label: "Fuma?" },
  { key: "bruxismo", label: "Range ou aperta os dentes?" },
  { key: "cirurgia_previa", label: "Já fez cirurgia (odontológica ou estética)?" },
  { key: "preenchimento_previo", label: "Já fez preenchimento ou toxina botulínica?" },
  { key: "queloide", label: "Tem tendencia a queloide?" },
  { key: "hemorragia", label: "Já teve sangramento excessivo após procedimento?" },
] as const;
