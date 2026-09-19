import { Button } from '@/components/ui/Button';
import { AnimatedText } from '@/components/ui/AnimatedText';
import { Reveal } from '@/components/ui/Reveal';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';

import styles from './FinalCta.module.css';

/** Fechamento — a ultima chance de converter antes do rodape. */
export function FinalCta() {
  return (
    <section className={`section ${styles.section}`} aria-label="Agende na Arena">
      <div className={`container ${styles.inner}`}>
        <AnimatedText
          as="h2"
          className={styles.title}
          text={'Seu carro merece mais\ndo que uma lavagem.'}
        />

        <Reveal variant="up" delay={120}>
          <p className={styles.subtitle}>Ele merece um processo.</p>
        </Reveal>

        <Reveal variant="up" delay={220} className={styles.actions}>
          <Button href="#agendamento" size="lg">
            Agendar na Arena
          </Button>
          <WhatsAppLink source="final_cta" className={styles.whatsLink}>
            Falar no WhatsApp
          </WhatsAppLink>
        </Reveal>
      </div>
    </section>
  );
}
