/**
 * Perguntas frequentes.
 *
 * REGRA DESTE ARQUIVO: só entra resposta que o próprio site sustenta.
 *
 * Nada aqui inventa prazo, preço, garantia, forma de pagamento ou política de
 * cancelamento — informações que dependem da operação real da Arena e que
 * ninguém confirmou. Onde a resposta depende do caso, ela diz isso e aponta o
 * caminho (avaliação ou WhatsApp), em vez de chutar um número.
 *
 * Ao acrescentar uma pergunta, mantenha o mesmo critério: se a resposta não
 * puder ser verificada no próprio produto, ela precisa vir da Arena antes de
 * ser publicada. A lista alimenta ao mesmo tempo a seção visível e os dados
 * estruturados FAQPage do Google — resposta errada aqui vira resposta errada
 * na busca.
 */

export type FaqItem = {
  pergunta: string;
  /** Texto puro: o mesmo conteúdo vai para a tela e para o JSON-LD. */
  resposta: string;
};

export const faq: FaqItem[] = [
  {
    pergunta: 'Quanto tempo o serviço leva?',
    resposta:
      'Depende do serviço. A duração de cada um aparece no agendamento, ao lado do nome, e é ela que reserva o bloco na agenda. O prazo final é confirmado na avaliação, com o veículo na frente.',
  },
  {
    pergunta: 'Por que não tem tabela de preços no site?',
    resposta:
      'Porque o valor depende do porte do veículo, do estado real da pintura e do interior, e do que a avaliação apontar. Publicar um número fixo seria chutar para cima ou para baixo. O orçamento é fechado com o carro presente.',
  },
  {
    pergunta: 'Preciso agendar ou posso chegar direto?',
    resposta:
      'Agende. O horário escolhido no site é reservado na hora e sai da agenda imediatamente, então ninguém mais consegue marcar em cima. Assim o veículo tem tempo de box garantido.',
  },
  {
    pergunta: 'Meu carro precisa de mais de um serviço. Como faço?',
    resposta:
      'O agendamento online reserva um serviço por vez. Escolha o principal e descreva o restante no campo de observações — a combinação final de etapas é definida na avaliação, que é justamente onde esse tipo de decisão é tomada.',
  },
  {
    pergunta: 'Como remarco ou cancelo um horário?',
    resposta:
      'Fale com a Arena pelo WhatsApp. O site reserva o horário, mas a remarcação é feita no contato direto, para que a equipe consiga reorganizar a agenda do dia.',
  },
  {
    pergunta: 'O que acontece com os meus dados?',
    resposta:
      'São usados apenas para registrar e confirmar o seu agendamento: agenda interna, aviso para a equipe e e-mail de confirmação. Não são vendidos nem usados para publicidade. O detalhe completo está na política de privacidade.',
  },
];
