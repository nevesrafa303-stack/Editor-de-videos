'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { track } from '@/lib/analytics';
import { site } from '@/lib/config/site';
import { formatIsoDateLong } from '@/lib/utils/format';
import { buildIcs, downloadIcs } from '@/lib/utils/ics';

import styles from './booking.module.css';
import type { BookingConfirmation } from './types';

type ConfirmationProps = {
  confirmation: BookingConfirmation;
  onRestart: () => void;
};

/**
 * Tela final.
 *
 * Nada de "obrigado, entraremos em contato": o horario ESTA reservado e a tela
 * entrega as duas coisas que o cliente quer em seguida — salvar na agenda dele
 * e ter um canal direto com a Arena.
 */
export function Confirmation({ confirmation, onRestart }: ConfirmationProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // A confirmacao substitui um formulario mais alto: sem este ajuste o titulo
  // "Agendamento confirmado." pode nascer atras da navbar fixa.
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  const whatsappLink =
    site.contact.whatsappNumber !== null
      ? `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(
          `Olá! Acabei de agendar ${confirmation.serviceName} para ${formatIsoDateLong(
            confirmation.date,
          )} às ${confirmation.time}.`,
        )}`
      : null;

  const handleAddToCalendar = () => {
    const ics = buildIcs({
      uid: confirmation.id,
      title: `Arena Colossal — ${confirmation.serviceName}`,
      description: [
        `Serviço: ${confirmation.serviceName}`,
        `Veículo: ${confirmation.vehicle}`,
        `Agendamento #${confirmation.id}`,
      ].join('\n'),
      location: site.location.fullAddress ?? `${site.location.city} — ${site.location.state}`,
      startsAt: confirmation.startsAt,
      endsAt: confirmation.endsAt,
    });

    downloadIcs(`arena-colossal-${confirmation.date}.ics`, ics);
  };

  return (
    <div ref={rootRef} className={styles.success} role="status">
      <span className={styles.successMark} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 12.5 9.5 18 20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h3 className={styles.successTitle}>Agendamento confirmado.</h3>
      <p className={styles.successText}>Seu horário na Arena Colossal está reservado.</p>

      <dl className={styles.successList}>
        <div className={styles.reviewRow}>
          <dt className={styles.reviewLabel}>Serviço</dt>
          <dd className={styles.reviewValue}>{confirmation.serviceName}</dd>
        </div>
        <div className={styles.reviewRow}>
          <dt className={styles.reviewLabel}>Data</dt>
          <dd className={styles.reviewValue}>{formatIsoDateLong(confirmation.date)}</dd>
        </div>
        <div className={styles.reviewRow}>
          <dt className={styles.reviewLabel}>Horário</dt>
          <dd className={styles.reviewValue}>{confirmation.timeRange}</dd>
        </div>
        <div className={styles.reviewRow}>
          <dt className={styles.reviewLabel}>Veículo</dt>
          <dd className={styles.reviewValue}>{confirmation.vehicle}</dd>
        </div>
      </dl>

      <div className={styles.successActions}>
        <Button type="button" magnetic={false} onClick={handleAddToCalendar}>
          Adicionar ao calendário
        </Button>

        {whatsappLink !== null ? (
          <Button
            href={whatsappLink}
            external
            variant="outline"
            magnetic={false}
            onClick={() => track('click_whatsapp', { source: 'booking_confirmation' })}
          >
            Falar com a Arena no WhatsApp
          </Button>
        ) : null}
      </div>

      <button type="button" className={styles.restart} onClick={onRestart}>
        Fazer outro agendamento
      </button>
    </div>
  );
}
