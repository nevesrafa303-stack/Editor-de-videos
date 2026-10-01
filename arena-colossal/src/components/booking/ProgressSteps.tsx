'use client';

import styles from './booking.module.css';

export const STEP_LABELS = ['Serviço', 'Data', 'Horário', 'Dados', 'Confirmação'] as const;

type ProgressStepsProps = {
  /** Indice da etapa atual (0-based). */
  current: number;
  /** Permite voltar para etapas ja preenchidas. */
  onNavigate: (step: number) => void;
  maxReached: number;
};

/**
 * Indicador de progresso.
 *
 * Etapas ja concluidas viram botao (voltar sem perder o que foi preenchido);
 * as futuras ficam desabilitadas. `aria-current="step"` marca onde o usuario
 * esta para quem navega por leitor de tela.
 */
export function ProgressSteps({ current, onNavigate, maxReached }: ProgressStepsProps) {
  return (
    <nav className={styles.progress} aria-label="Etapas do agendamento">
      <ol className={styles.progressList}>
        {STEP_LABELS.map((label, index) => {
          const state = index === current ? 'current' : index < maxReached ? 'done' : 'todo';

          return (
            <li key={label} className={styles.progressItem} data-state={state}>
              <button
                type="button"
                className={styles.progressButton}
                disabled={index > maxReached}
                aria-current={index === current ? 'step' : undefined}
                onClick={() => onNavigate(index)}
              >
                <span className={styles.progressIndex}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.progressLabel}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={styles.progressBar} aria-hidden="true">
        <span
          className={styles.progressBarFill}
          style={{ transform: `scaleX(${(current + 1) / STEP_LABELS.length})` }}
        />
      </div>
    </nav>
  );
}
