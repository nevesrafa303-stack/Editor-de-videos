'use client';

import { services } from '@/lib/config/services';
import { formatDuration } from '@/lib/utils/format';

import styles from './booking.module.css';

type ServiceStepProps = {
  value: string | null;
  onChange: (slug: string) => void;
};

/**
 * Etapa 01 — escolha do servico.
 *
 * Grupo de radio nativo por baixo do visual: navegacao por setas, selecao por
 * espaco e anuncio correto de "3 de 10" saem de graca.
 */
export function ServiceStep({ value, onChange }: ServiceStepProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Escolha o serviço</legend>
      <p className={styles.help}>
        Não tem certeza? Escolha a avaliação mais próxima — o processo final é definido com o
        veículo na frente.
      </p>

      <div className={styles.optionGrid}>
        {services.map((service) => (
          <label key={service.slug} className={styles.option} data-selected={value === service.slug}>
            <input
              type="radio"
              name="service"
              value={service.slug}
              checked={value === service.slug}
              onChange={() => onChange(service.slug)}
              className={styles.optionInput}
            />
            <span className={styles.optionIndex}>{service.index}</span>
            <span className={styles.optionBody}>
              <span className={styles.optionName}>{service.name}</span>
              <span className={styles.optionMeta}>{formatDuration(service.durationMinutes)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
