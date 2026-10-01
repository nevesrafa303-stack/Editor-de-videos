'use client';

import { useEffect, useRef } from 'react';

import { useIsDesktopPointer, usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery';

import styles from './CustomCursor.module.css';

/**
 * Cursor customizado — desktop com ponteiro fino, e so.
 *
 * O cursor nativo continua visivel: este anel acompanha por fora, entao nada
 * de precisao de clique e' perdido e o site segue usavel se o JS falhar.
 *
 * A posicao e' escrita em variaveis CSS dentro de um `requestAnimationFrame`,
 * nunca no evento — o `pointermove` dispara mais rapido que o quadro.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const isDesktopPointer = useIsDesktopPointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!isDesktopPointer || prefersReducedMotion) return;

    const ring = ringRef.current;
    if (!ring) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...target };
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      // Ate o primeiro movimento nao sabemos onde o ponteiro esta — mostrar o
      // anel no centro da tela seria um elemento estranho parado na pagina.
      ring.dataset.visible = 'true';

      // Estado visual vem do elemento sob o ponteiro: sem listeners por botao.
      const interactive = (event.target as Element | null)?.closest?.(
        'a, button, input, select, textarea, [role="button"], [data-cursor="grab"]',
      );
      ring.dataset.active = interactive ? 'true' : 'false';
      ring.dataset.mode = (interactive as HTMLElement | null)?.dataset?.cursor ?? 'default';
    };

    const render = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      ring.style.setProperty('--x', `${current.x}px`);
      ring.style.setProperty('--y', `${current.y}px`);
      frame = requestAnimationFrame(render);
    };

    const onLeave = () => {
      ring.dataset.visible = 'false';
    };
    const onEnter = () => {
      ring.dataset.visible = 'true';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);
    frame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
      cancelAnimationFrame(frame);
    };
  }, [isDesktopPointer, prefersReducedMotion]);

  if (!isDesktopPointer || prefersReducedMotion) return null;

  return <div ref={ringRef} className={styles.ring} data-visible="false" aria-hidden="true" />;
}
