/**
 * Avaliacoes de clientes.
 *
 * ESTE ARQUIVO NASCE VAZIO — DE PROPOSITO.
 *
 * O site nao publica avaliacao inventada. Enquanto a lista estiver vazia, a
 * secao "Quem conhece, volta." mostra um estado honesto (e o link para o perfil
 * do Google, se `NEXT_PUBLIC_GOOGLE_PLACE_ID` estiver configurado) em vez de
 * depoimento ficticio.
 *
 * COMO PUBLICAR AVALIACOES REAIS
 *   1. Manual: adicione objetos a `reviews` abaixo, copiando o texto real do
 *      cliente (com autorizacao).
 *   2. Automatico: crie `src/app/api/reviews/route.ts` consultando a Google
 *      Places API com a chave no SERVIDOR (nunca no frontend) e troque o
 *      consumo da secao para essa rota. O formato de `Review` ja e' o mesmo que
 *      o Places devolve, para a troca ser direta.
 */

export type Review = {
  id: string;
  /** Nome como o cliente autorizou publicar. */
  author: string;
  /** 1 a 5. */
  rating: number;
  /** ISO `YYYY-MM-DD`. */
  date: string;
  comment: string;
  /** `google` quando importada do perfil; `direct` quando enviada à Arena. */
  source: 'google' | 'direct';
};

export const reviews: Review[] = [];
