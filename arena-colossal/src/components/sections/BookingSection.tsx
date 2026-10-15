import { BookingWizard } from '@/components/booking/BookingWizard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';

import styles from './BookingSection.module.css';

/**
 * Secao de agendamento.
 *
 * A home e' estatica (bom para performance e SEO), mas a janela de datas do
 * agendamento comeca "hoje" — ela mudaria de valor no dia seguinte ao build.
 * Por isso o formulario busca a configuracao em `/api/booking-config` ao
 * montar, em vez de recebe-la congelada do build.
 */
export function BookingSection() {
  return (
    <section id="agendamento" className={`section ${styles.section}`} aria-label="Agendamento">
      <div className={`container ${styles.inner}`}>
        <div className={styles.intro}>
          <SectionTitle
            eyebrow="Agendamento"
            title={'Reserve o\nhorário do seu carro.'}
            description="Escolha o serviço, o dia e o horário. A confirmação é imediata e o horário sai da agenda no mesmo instante."
          />

          <ul className={styles.assurances}>
            <li>Confirmação na hora, sem espera por retorno.</li>
            <li>Horários ocupados não aparecem como disponíveis.</li>
            <li>Seus dados são usados apenas para este agendamento.</li>
          </ul>

          <p className={styles.whatsFallback}>
            <WhatsAppLink source="booking_section" className={styles.whatsLink}>
              Prefere falar antes? Chame no WhatsApp
            </WhatsAppLink>
          </p>
        </div>

        <div className={styles.form}>
          <BookingWizard />
        </div>
      </div>
    </section>
  );
}
