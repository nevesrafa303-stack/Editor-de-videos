'use client';

import { maskPhoneBR } from '@/lib/utils/format';

import styles from './booking.module.css';
import type { BookingDraft } from './types';

type DetailsStepProps = {
  draft: BookingDraft;
  errors: Record<string, string>;
  onChange: <K extends keyof BookingDraft>(field: K, value: BookingDraft[K]) => void;
};

/**
 * Etapa 04 — dados do cliente e do veiculo.
 *
 * Detalhes que mudam a taxa de conclusao no celular:
 *   - `inputMode` e `autoComplete` corretos em cada campo (teclado numerico no
 *     WhatsApp, preenchimento automatico de nome e e-mail);
 *   - erro ligado ao campo por `aria-describedby`, nao so por cor;
 *   - o honeypot fica fora da ordem de tabulacao e escondido de leitores.
 */
export function DetailsStep({ draft, errors, onChange }: DetailsStepProps) {
  const field = (name: keyof BookingDraft) => ({
    id: `booking-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `booking-${name}-error` : undefined,
  });

  return (
    <div className={styles.formGrid}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="booking-name">
          Nome completo
        </label>
        <input
          {...field('name')}
          className={styles.input}
          type="text"
          name="name"
          autoComplete="name"
          value={draft.name}
          onChange={(event) => onChange('name', event.target.value)}
          required
        />
        <FieldError name="name" message={errors.name} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="booking-phone">
          WhatsApp
        </label>
        <input
          {...field('phone')}
          className={styles.input}
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(47) 90000-0000"
          value={draft.phone}
          onChange={(event) => onChange('phone', maskPhoneBR(event.target.value))}
          required
        />
        <FieldError name="phone" message={errors.phone} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="booking-email">
          E-mail
        </label>
        <input
          {...field('email')}
          className={styles.input}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          value={draft.email}
          onChange={(event) => onChange('email', event.target.value)}
          required
        />
        <FieldError name="email" message={errors.email} />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="booking-vehicleBrand">
            Marca
          </label>
          <input
            {...field('vehicleBrand')}
            className={styles.input}
            type="text"
            name="vehicleBrand"
            value={draft.vehicleBrand}
            onChange={(event) => onChange('vehicleBrand', event.target.value)}
            required
          />
          <FieldError name="vehicleBrand" message={errors.vehicleBrand} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="booking-vehicleModel">
            Modelo
          </label>
          <input
            {...field('vehicleModel')}
            className={styles.input}
            type="text"
            name="vehicleModel"
            value={draft.vehicleModel}
            onChange={(event) => onChange('vehicleModel', event.target.value)}
            required
          />
          <FieldError name="vehicleModel" message={errors.vehicleModel} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="booking-vehicleYear">
            Ano <span className={styles.optional}>(opcional)</span>
          </label>
          <input
            {...field('vehicleYear')}
            className={styles.input}
            type="text"
            name="vehicleYear"
            inputMode="numeric"
            maxLength={4}
            value={draft.vehicleYear}
            onChange={(event) => onChange('vehicleYear', event.target.value.replace(/\D/g, ''))}
          />
          <FieldError name="vehicleYear" message={errors.vehicleYear} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="booking-notes">
          Observações <span className={styles.optional}>(opcional)</span>
        </label>
        <textarea
          {...field('notes')}
          className={styles.textarea}
          name="notes"
          rows={4}
          maxLength={600}
          placeholder="Algo que a equipe precisa saber sobre o veículo?"
          value={draft.notes}
          onChange={(event) => onChange('notes', event.target.value)}
        />
        <FieldError name="notes" message={errors.notes} />
      </div>

      <div className={styles.field}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="consent"
            checked={draft.consent}
            onChange={(event) => onChange('consent', event.target.checked)}
            aria-describedby={errors.consent ? 'booking-consent-error' : undefined}
            required
          />
          <span>
            Autorizo o uso dos meus dados para contato relacionado ao meu agendamento.
          </span>
        </label>
        <FieldError name="consent" message={errors.consent} />
      </div>

      {/* Honeypot: invisivel para pessoas, irresistivel para bots. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="booking-website">Não preencha este campo</label>
        <input
          id="booking-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={draft.website}
          onChange={(event) => onChange('website', event.target.value)}
        />
      </div>
    </div>
  );
}

function FieldError({ name, message }: { name: string; message: string | undefined }) {
  if (!message) return null;

  return (
    <p id={`booking-${name}-error`} className={styles.fieldError} role="alert">
      {message}
    </p>
  );
}
