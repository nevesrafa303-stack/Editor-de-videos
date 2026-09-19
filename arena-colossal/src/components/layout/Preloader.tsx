'use client';

import { useEffect, useState } from 'react';

import styles from './Preloader.module.css';

/** Teto absoluto do preloader. Acima disso ele vira obstaculo, nao abertura. */
const MAX_DURATION_MS = 1400;
const SESSION_KEY = 'arena-preloader-seen';

/**
 * Abertura da marca.
 *
 * Regras que mantem isso elegante em vez de irritante:
 *   - some assim que a pagina fica pronta, com teto rigido de 1,4s;
 *   - roda uma vez por sessao (voltar do agendamento nao replica a animacao);
 *   - nao aparece com `prefers-reduced-motion`;
 *   - e' `aria-hidden` e sai do DOM no fim — nunca prende o foco nem o leitor
 *     de tela;
 *   - o conteudo da pagina ja esta renderizado atras dele: se o JS falhar, o
 *     site continua utilizavel.
 */
export function Preloader() {
  const [state, setState] = useState<'hidden' | 'running' | 'leaving'>('hidden');

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';
    if (prefersReducedMotion || alreadySeen) return;

    setState('running');
    document.body.dataset.locked = 'true';

    let leaveTimer: number | undefined;
    let removeTimer: number | undefined;

    const finish = () => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setState('leaving');
      document.body.dataset.locked = 'false';
      removeTimer = window.setTimeout(() => setState('hidden'), 700);
    };

    // O que vier primeiro: pagina pronta (+ respiro minimo) ou o teto de tempo.
    const minimumBeat = window.setTimeout(() => {
      if (document.readyState === 'complete') finish();
      else window.addEventListener('load', finish, { once: true });
    }, 650);

    leaveTimer = window.setTimeout(finish, MAX_DURATION_MS);

    return () => {
      window.clearTimeout(minimumBeat);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
      document.body.dataset.locked = 'false';
    };
  }, []);

  if (state === 'hidden') return null;

  return (
    <div className={styles.preloader} data-state={state} aria-hidden="true">
      <div className={styles.mark}>
        <span className={styles.word}>Arena</span>
        <span className={styles.word} data-accent="true">
          Colossal
        </span>
      </div>
      <div className={styles.track}>
        <span className={styles.bar} />
      </div>
    </div>
  );
}
