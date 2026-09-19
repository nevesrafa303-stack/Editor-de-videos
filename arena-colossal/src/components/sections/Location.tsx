import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { site } from '@/lib/config/site';

import styles from './Location.module.css';

/**
 * Localizacao.
 *
 * O endereco so aparece quando `NEXT_PUBLIC_ADDRESS_STREET` esta configurado.
 * Sem ele, a secao mostra a cidade e leva ao WhatsApp para combinar o endereco —
 * em vez de publicar um endereco inventado que faria alguem dirigir para o
 * lugar errado.
 *
 * O mapa e' um iframe com `loading="lazy"`: nenhum request ao Google acontece
 * antes de o usuario chegar perto da secao.
 */
export function Location() {
  const hasAddress = site.location.fullAddress !== null;
  const hasCoordinates = site.location.lat !== null && site.location.lng !== null;
  const showMap = hasAddress || hasCoordinates;

  return (
    <section id="localizacao" className={`section ${styles.section}`} aria-label="Localização">
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <SectionTitle eyebrow="Onde estamos" title={'Encontre\na Arena.'} />

          <Reveal variant="up" className={styles.details}>
            <p className={styles.brand}>Arena Colossal</p>
            <p className={styles.city}>
              {site.location.city} — {site.location.state}
            </p>

            {hasAddress ? (
              <address className={styles.address}>{site.location.fullAddress}</address>
            ) : (
              <p className={styles.pending}>
                O endereço completo é confirmado no agendamento. Se preferir, chame no WhatsApp que
                enviamos a localização exata.
              </p>
            )}

            <div className={styles.actions}>
              {showMap ? (
                <>
                  <Button href={site.location.mapsUrl} external variant="outline">
                    Abrir no Google Maps
                  </Button>
                  <Button href={site.location.directionsUrl} external variant="ghost">
                    Traçar rota
                  </Button>
                </>
              ) : (
                <Button href="#agendamento">Agendar serviço</Button>
              )}
            </div>
          </Reveal>
        </div>

        {showMap ? (
          <Reveal variant="mask" className={styles.mapWrapper}>
            <iframe
              className={styles.map}
              src={site.location.embedUrl}
              title={`Mapa — Arena Colossal, ${site.location.city}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
