'use client';

import { useMemo } from 'react';

import { addDays, isoDateWeekday } from '@/lib/utils/timezone';
import { formatIsoDayNumber, formatIsoWeekdayShort } from '@/lib/utils/format';

import styles from './booking.module.css';
import type { PublicBookingConfig } from './types';

type DateStepProps = {
  config: PublicBookingConfig;
  value: string | null;
  onChange: (date: string) => void;
};

const MONTH_LABEL = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' });

/**
 * Etapa 02 — escolha do dia.
 *
 * Faixa de dias em vez de calendario completo: no celular, uma unica linha
 * rolavel resolve com um gesto o que um grid mensal resolve com dois toques e
 * um mês de navegacao.
 *
 * Dias fechados (fora do horario de funcionamento) e datas bloqueadas ja chegam
 * desabilitados — a informacao vem do servidor junto com a pagina, sem uma
 * requisicao por dia.
 */
export function DateStep({ config, value, onChange }: DateStepProps) {
  const days = useMemo(() => {
    const result: { date: string; enabled: boolean; monthStart: boolean }[] = [];
    let cursor = config.firstDate;
    let lastMonth = '';

    while (cursor <= config.lastDate && result.length < 120) {
      const month = cursor.slice(0, 7);
      const isOpenWeekday = config.openWeekdays.includes(isoDateWeekday(cursor));
      const isBlackout = config.blackoutDates.includes(cursor);

      result.push({
        date: cursor,
        enabled: isOpenWeekday && !isBlackout,
        monthStart: month !== lastMonth,
      });

      lastMonth = month;
      cursor = addDays(cursor, 1);
    }

    return result;
  }, [config]);

  if (!config.scheduleConfigured) {
    return (
      <p className={styles.notice}>
        A agenda online ainda não está disponível. Fale com a Arena pelo WhatsApp que reservamos
        seu horário.
      </p>
    );
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Escolha o dia</legend>
      <p className={styles.help}>
        Dias sem atendimento aparecem desativados. Horário de {config.timezone.replace('_', ' ')}.
      </p>

      <div className={styles.dayStrip}>
        {days.map((day) => (
          <div key={day.date} className={styles.dayCell}>
            {day.monthStart ? (
              <span className={styles.monthLabel}>
                {MONTH_LABEL.format(new Date(`${day.date}T12:00:00Z`))}
              </span>
            ) : null}

            <button
              type="button"
              className={styles.day}
              disabled={!day.enabled}
              data-selected={value === day.date}
              aria-pressed={value === day.date}
              onClick={() => onChange(day.date)}
            >
              <span className={styles.dayWeekday}>{formatIsoWeekdayShort(day.date)}</span>
              <span className={styles.dayNumber}>{formatIsoDayNumber(day.date)}</span>
            </button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
