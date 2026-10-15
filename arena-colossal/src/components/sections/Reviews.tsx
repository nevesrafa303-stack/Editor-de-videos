import { Reveal } from '@/components/ui/Reveal';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { reviews } from '@/lib/config/reviews';
import { site } from '@/lib/config/site';
import { formatIsoDateLong } from '@/lib/utils/format';

import styles from './Reviews.module.css';

/**
 * Prova social.
 *
 * Enquanto `src/lib/config/reviews.ts` estiver vazio, a secao assume o estado
 * honesto: explica onde as avaliacoes reais vao aparecer e leva ao perfil do
 * Google. Nenhum depoimento e' fabricado, nenhuma nota media e' estimada.
 */
export function Reviews() {
  const hasReviews = reviews.length > 0;

  return (
    <section className={`section ${styles.section}`} aria-label="Avaliações">
      <div className={`container ${styles.inner}`}>
        <SectionTitle
          eyebrow="Prova social"
          title={'Quem conhece,\nvolta.'}
          description="Avaliações de clientes da Arena Colossal, publicadas exatamente como foram escritas."
        />

        {hasReviews ? (
          <ul className={styles.grid}>
            {reviews.map((review, index) => (
              <Reveal as="li" key={review.id} variant="up" delay={index * 80}>
                <article className={styles.card}>
                  <Stars rating={review.rating} />
                  <p className={styles.comment}>{review.comment}</p>
                  <footer className={styles.meta}>
                    <span className={styles.author}>{review.author}</span>
                    <time dateTime={review.date} className={styles.date}>
                      {formatIsoDateLong(review.date)}
                    </time>
                  </footer>
                </article>
              </Reveal>
            ))}
          </ul>
        ) : (
          <Reveal variant="up" className={styles.empty}>
            <p className={styles.emptyTitle}>
              As avaliações reais dos clientes da Arena aparecem aqui.
            </p>
            <p className={styles.emptyText}>
              Preferimos publicar nada a publicar algo inventado. Enquanto os depoimentos
              autorizados não entram, o perfil no Google segue aberto para consulta.
            </p>
            {site.location.placeId !== null ? (
              <a
                className={styles.emptyLink}
                href={site.location.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver avaliações no Google
              </a>
            ) : null}
          </Reveal>
        )}
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(Math.min(5, Math.max(0, rating)));

  return (
    <p className={styles.stars} aria-label={`${rounded} de 5 estrelas`}>
      <span aria-hidden="true">
        {'★'.repeat(rounded)}
        <span className={styles.starsOff}>{'★'.repeat(5 - rounded)}</span>
      </span>
    </p>
  );
}
