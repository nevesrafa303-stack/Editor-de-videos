'use client';

import { useEffect, useState } from 'react';

import { formatIsoDateLong } from '@/lib/utils/format';

import styles from './booking.module.css';
import type { AvailabilityResponse, SlotView } from './types';

type TimeStepProps = {
  date: string;
  serviceSlug: string;
  value: string | null;
  onChange: (time: string) => void;
};

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; slots: SlotView[]; degraded: boolean }
  | { kind: 'error' };

/**
 * Etapa 03 — escolha do horario.
 *
 * A grade vem sempre do servidor: o navegador nao tem como saber o que esta
 * ocupado. Horarios indisponiveis continuam visiveis, riscados — some da tela
 * e' pior, porque o cliente fica sem entender por que o horario "sumiu".
 *
 * `degraded` sinaliza que o Google Calendar nao respondeu: os horarios ainda
 * sao exibidos, com aviso de que a confirmacao final acontece no envio.
 */
export function TimeStep({ date, serviceSlug, value, onChange }: TimeStepProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: 'loading' });

    const params = new URLSearchParams({ date, service: serviceSlug });

    fetch(`/api/availability?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as AvailabilityResponse;
      })
      .then((data) => setState({ kind: 'ready', slots: data.slots, degraded: data.degraded }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('[booking] falha ao carregar horários', error);
        setState({ kind: 'error' });
      });

    return () => controller.abort();
  }, [date, serviceSlug]);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Escolha o horário</legend>
      <p className={styles.help}>{formatIsoDateLong(date)}</p>

      {state.kind === 'loading' ? (
        <p className={styles.notice} role="status">
          Consultando a agenda…
        </p>
      ) : null}

      {state.kind === 'error' ? (
        <p className={styles.noticeError} role="alert">
          Não conseguimos consultar a agenda agora. Tente novamente em instantes ou fale com a
          Arena pelo WhatsApp.
        </p>
      ) : null}

      {state.kind === 'ready' && state.slots.length === 0 ? (
        <p className={styles.notice} role="status">
          Não há horário disponível neste dia para este serviço. Escolha outra data.
        </p>
      ) : null}

      {state.kind === 'ready' && state.slots.length > 0 ? (
        <>
          {state.degraded ? (
            <p className={styles.noticeWarning} role="status">
              A agenda externa não respondeu agora. Os horários abaixo são os que temos registrados
              — a confirmação final acontece no envio.
            </p>
          ) : null}

          <div className={styles.slotGrid}>
            {state.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                className={styles.slot}
                disabled={!slot.available}
                data-selected={value === slot.time}
                aria-pressed={value === slot.time}
                aria-label={
                  slot.available ? `${slot.time} — disponível` : `${slot.time} — indisponível`
                }
                onClick={() => onChange(slot.time)}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </fieldset>
  );
}
