import type { Metadata } from 'next';

import { SectionTitle } from '@/components/ui/SectionTitle';
import { Reveal } from '@/components/ui/Reveal';
import { services } from '@/lib/config/services';
import { site } from '@/lib/config/site';
import { formatDuration } from '@/lib/utils/format';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Serviços',
  description:
    'Os dez serviços da Arena Colossal em Balneário Camboriú: lavagem técnica, higienização, descontaminação, polimento, vitrificação e proteção — com o escopo de cada um.',
  alternates: { canonical: '/servicos' },
};

/**
 * Índice de serviços.
 *
 * Existe para dar um destino às buscas genéricas ("estética automotiva
 * Balneário Camboriú") e um ponto de partida para quem chegou por uma página
 * de serviço específica e quer ver o resto.
 */
export default function ServicosPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Serviços da Arena Colossal',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: service.name,
      url: `${site.url}/servicos/${service.slug}`,
    })),
  };

  return (
    <div className={`container ${styles.pagina}`}>
      <SectionTitle
        eyebrow="Catálogo"
        as="h2"
        title={'Dez frentes.\nUm processo.'}
        description="Cada serviço tem página própria, com as etapas, quando faz sentido e — principalmente — o que ele não resolve."
      />

      <ul className={styles.lista}>
        {services.map((service, index) => (
          <Reveal as="li" key={service.slug} variant="up" delay={index * 45}>
            <a className={styles.item} href={`/servicos/${service.slug}`}>
              <span className={styles.itemIndice}>{service.index}</span>
              <span className={styles.itemCorpo}>
                <span className={styles.itemNome}>{service.name}</span>
                <span className={styles.itemResumo}>{service.summary}</span>
              </span>
              <span className={styles.itemTempo}>{formatDuration(service.durationMinutes)}</span>
              <span aria-hidden="true" className={styles.itemSeta}>
                →
              </span>
            </a>
          </Reveal>
        ))}
      </ul>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
