'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { track } from '@/lib/analytics';
import { isServiceSlug } from '@/lib/config/services';
import { bookingRequestSchema, fieldErrors } from '@/lib/validation/booking';

import { Confirmation } from './Confirmation';
import { DateStep } from './DateStep';
import { DetailsStep } from './DetailsStep';
import { ProgressSteps, STEP_LABELS } from './ProgressSteps';
import { ReviewStep } from './ReviewStep';
import { EVENTO_SELECIONAR_SERVICO } from './ServiceShortcut';
import { ServiceStep } from './ServiceStep';
import { TimeStep } from './TimeStep';
import styles from './booking.module.css';
import { EMPTY_DRAFT, type BookingConfirmation, type BookingDraft, type PublicBookingConfig } from './types';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string; recoverable: 'slot' | 'generic' };

/**
 * Formulario de agendamento em cinco etapas.
 *
 * Decisoes que sustentam o fluxo:
 *   - UMA etapa por tela, inclusive no desktop: o cliente nunca ve um formulario
 *     de doze campos de uma vez;
 *   - o rascunho e' mantido inteiro em memoria, entao voltar uma etapa nao
 *     apaga nada;
 *   - a validacao usa o MESMO schema zod do backend — a mensagem que o cliente
 *     ve no campo e' a mesma regra que o servidor aplica;
 *   - quando o backend responde "horário ocupado", o fluxo volta sozinho para a
 *     etapa de horario com o aviso, em vez de deixar o cliente preso no fim.
 */
export function BookingWizard() {
  const [config, setConfig] = useState<PublicBookingConfig | null>(null);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const turnstileTokenRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // A janela de datas comeca "hoje", entao ela nao pode vir congelada do build:
  // e' buscada ao montar o formulario.
  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/booking-config', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as { config: PublicBookingConfig };
      })
      .then((data) => setConfig(data.config))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('[booking] falha ao carregar a configuração da agenda', error);
        setConfig(UNAVAILABLE_CONFIG);
      });

    return () => controller.abort();
  }, []);

  /**
   * Serviço escolhido fora do formulário: pelos atalhos da seção "Quando
   * procurar a Arena" ou por um link compartilhado com `?servico=`.
   *
   * O slug é validado contra o catálogo antes de entrar no rascunho — a query
   * string é digitável por qualquer um e não pode virar estado inválido.
   */
  useEffect(() => {
    const escolher = (slug: string) => {
      if (!isServiceSlug(slug)) return;
      setDraft((current) => ({ ...current, serviceSlug: slug, time: null }));
      setErrors({});
      setStep(1);
      setMaxReached((current) => Math.max(current, 1));
    };

    const aoReceber = (event: Event) => {
      const slug = (event as CustomEvent<string>).detail;
      if (typeof slug === 'string') escolher(slug);
    };

    window.addEventListener(EVENTO_SELECIONAR_SERVICO, aoReceber);

    const daUrl = new URLSearchParams(window.location.search).get('servico');
    if (daUrl !== null) escolher(daUrl);

    return () => window.removeEventListener(EVENTO_SELECIONAR_SERVICO, aoReceber);
  }, []);

  const update = useCallback(
    <K extends keyof BookingDraft>(fieldName: K, value: BookingDraft[K]) => {
      setDraft((current) => ({ ...current, [fieldName]: value }));
      setErrors((current) => {
        if (!(fieldName in current)) return current;
        const next = { ...current };
        delete next[fieldName as string];
        return next;
      });
    },
    [],
  );

  const goTo = useCallback((next: number) => {
    setStep(next);
    setMaxReached((current) => Math.max(current, next));
    // Traz a etapa nova para a vista sem jogar a pagina toda para o topo.
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, []);

  /** Validacao da etapa atual. Devolve `true` quando da para avancar. */
  const validateStep = (): boolean => {
    if (step === 0) {
      if (draft.serviceSlug === null) {
        setErrors({ serviceSlug: 'Escolha um serviço para continuar.' });
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (draft.date === null) {
        setErrors({ date: 'Escolha uma data para continuar.' });
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (draft.time === null) {
        setErrors({ time: 'Escolha um horário disponível.' });
        return false;
      }
      return true;
    }

    if (step === 3) {
      const parsed = bookingRequestSchema.safeParse(toPayload(draft, null));
      if (!parsed.success) {
        const found = fieldErrors(parsed.error);
        // Etapas anteriores ja validaram servico/data/horario.
        delete found.serviceSlug;
        delete found.date;
        delete found.time;

        if (Object.keys(found).length > 0) {
          setErrors(found);
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setErrors({});

    if (step === 0 && draft.serviceSlug !== null) {
      track('select_service', { service: draft.serviceSlug });
    }
    if (step === 1 && draft.date !== null) {
      track('select_date', { date: draft.date });
    }
    if (step === 2 && draft.time !== null) {
      track('select_time', { time: draft.time });
    }

    goTo(Math.min(step + 1, STEP_LABELS.length - 1));
  };

  const handleSubmit = async () => {
    setSubmitState({ kind: 'submitting' });
    track('booking_submitted', { service: draft.serviceSlug ?? '' });

    const payload = toPayload(draft, turnstileTokenRef.current);
    const parsed = bookingRequestSchema.safeParse(payload);

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setSubmitState({
        kind: 'error',
        message: 'Confira os dados informados e tente novamente.',
        recoverable: 'generic',
      });
      goTo(3);
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok: boolean;
        code?: string;
        message?: string;
        fields?: Record<string, string> | null;
        booking?: BookingConfirmation;
      };

      if (response.ok && data.ok && data.booking) {
        setConfirmation(data.booking);
        setSubmitState({ kind: 'idle' });
        track('booking_confirmed', {
          service: data.booking.serviceSlug,
          date: data.booking.date,
        });
        return;
      }

      track('booking_failed', { reason: data.code ?? 'unknown' });

      if (data.fields) setErrors(data.fields);

      const message = data.message ?? 'Não foi possível concluir o agendamento.';

      if (data.code === 'slot_taken' || data.code === 'invalid_slot') {
        setSubmitState({ kind: 'error', message, recoverable: 'slot' });
        // O horario morreu: devolve o cliente para a grade, ja atualizada.
        goTo(2);
        setDraft((current) => ({ ...current, time: null }));
        return;
      }

      setSubmitState({ kind: 'error', message, recoverable: 'generic' });
      if (data.fields) goTo(3);
    } catch (error) {
      console.error('[booking] falha de rede no envio', error);
      track('booking_failed', { reason: 'network' });
      setSubmitState({
        kind: 'error',
        message:
          'Não conseguimos confirmar esse horário agora. Tente novamente ou fale diretamente com a Arena pelo WhatsApp.',
        recoverable: 'generic',
      });
    }
  };

  const restart = () => {
    setDraft(EMPTY_DRAFT);
    setConfirmation(null);
    setErrors({});
    setSubmitState({ kind: 'idle' });
    setMaxReached(0);
    setStep(0);
  };

  if (confirmation !== null) {
    return <Confirmation confirmation={confirmation} onRestart={restart} />;
  }

  const isSubmitting = submitState.kind === 'submitting';

  return (
    <div className={styles.wizard}>
      <ProgressSteps current={step} maxReached={maxReached} onNavigate={goTo} />

      <div ref={panelRef} className={styles.panel}>
        {step === 0 ? (
          <ServiceStep value={draft.serviceSlug} onChange={(slug) => update('serviceSlug', slug)} />
        ) : null}

        {step === 1 ? (
          config === null ? (
            <p className={styles.notice} role="status">
              Carregando a agenda…
            </p>
          ) : (
            <DateStep config={config} value={draft.date} onChange={(date) => update('date', date)} />
          )
        ) : null}

        {step === 2 && draft.date !== null && draft.serviceSlug !== null ? (
          <TimeStep
            date={draft.date}
            serviceSlug={draft.serviceSlug}
            value={draft.time}
            onChange={(time) => update('time', time)}
          />
        ) : null}

        {step === 3 ? <DetailsStep draft={draft} errors={errors} onChange={update} /> : null}

        {step === 4 ? (
          <ReviewStep
            draft={draft}
            onTurnstileToken={(token) => {
              turnstileTokenRef.current = token;
            }}
          />
        ) : null}

        {/* Erro de etapa (sem campo proprio) e erro de envio. */}
        {errors.serviceSlug || errors.date || errors.time ? (
          <p className={styles.noticeError} role="alert">
            {errors.serviceSlug ?? errors.date ?? errors.time}
          </p>
        ) : null}

        {submitState.kind === 'error' ? (
          <p className={styles.noticeError} role="alert">
            {submitState.message}
          </p>
        ) : null}
      </div>

      <div className={styles.actions}>
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            magnetic={false}
            disabled={isSubmitting}
            onClick={() => goTo(step - 1)}
          >
            Voltar
          </Button>
        ) : (
          <span />
        )}

        {step < STEP_LABELS.length - 1 ? (
          <Button type="button" magnetic={false} onClick={handleNext}>
            Continuar
          </Button>
        ) : (
          <Button type="button" magnetic={false} disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Confirmando…' : 'Confirmar agendamento'}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Config usada quando a agenda nao pode ser consultada: o passo avisa e oferece o WhatsApp. */
const UNAVAILABLE_CONFIG: PublicBookingConfig = {
  firstDate: '',
  lastDate: '',
  openWeekdays: [],
  blackoutDates: [],
  scheduleConfigured: false,
  timezone: 'America/Sao_Paulo',
};

/** Converte o rascunho no corpo aceito por `POST /api/bookings`. */
function toPayload(draft: BookingDraft, turnstileToken: string | null) {
  return {
    name: draft.name,
    phone: draft.phone,
    email: draft.email,
    vehicleBrand: draft.vehicleBrand,
    vehicleModel: draft.vehicleModel,
    vehicleYear: draft.vehicleYear === '' ? null : draft.vehicleYear,
    serviceSlug: draft.serviceSlug ?? '',
    date: draft.date ?? '',
    time: draft.time ?? '',
    notes: draft.notes === '' ? null : draft.notes,
    consent: draft.consent,
    turnstileToken,
    website: draft.website,
  };
}
