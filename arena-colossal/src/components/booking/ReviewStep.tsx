'use client';

import { getService } from '@/lib/config/services';
import { formatIsoDateLong } from '@/lib/utils/format';

import styles from './booking.module.css';
import { Turnstile } from './Turnstile';
import type { BookingDraft } from './types';

type ReviewStepProps = {
  draft: BookingDraft;
  onTurnstileToken: (token: string | null) => void;
};

/** Etapa 05 — conferencia final antes de reservar o horario. */
export function ReviewStep({ draft, onTurnstileToken }: ReviewStepProps) {
  const service = draft.serviceSlug !== null ? getService(draft.serviceSlug) : null;
  const vehicle = [draft.vehicleBrand, draft.vehicleModel, draft.vehicleYear]
    .filter((part) => part.trim().length > 0)
    .join(' ');

  const rows: [string, string][] = [
    ['Serviço', service?.name ?? '—'],
    ['Data', draft.date !== null ? formatIsoDateLong(draft.date) : '—'],
    ['Horário', draft.time ?? '—'],
    ['Veículo', vehicle.length > 0 ? vehicle : '—'],
    ['Nome', draft.name],
    ['WhatsApp', draft.phone],
    ['E-mail', draft.email],
  ];

  if (draft.notes.trim().length > 0) rows.push(['Observações', draft.notes]);

  return (
    <div className={styles.review}>
      <h3 className={styles.reviewTitle}>Confira antes de confirmar</h3>

      <dl className={styles.reviewList}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.reviewRow}>
            <dt className={styles.reviewLabel}>{label}</dt>
            <dd className={styles.reviewValue}>{value}</dd>
          </div>
        ))}
      </dl>

      <Turnstile onToken={onTurnstileToken} />
    </div>
  );
}
