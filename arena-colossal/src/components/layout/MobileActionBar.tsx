'use client';

import { useEffect, useState } from 'react';

import { track } from '@/lib/analytics';
import { site } from '@/lib/config/site';

import styles from './MobileActionBar.module.css';

/**
 * Barra de acao fixa — somente mobile.
 *
 * Nao e' popup e nao cobre conteudo: entra depois que o usuario passa do hero,
 * fica com 60px de altura e some quando ele chega no proprio agendamento (ter
 * um botao "agendar" sobre o formulario de agendamento e' ruido).
 */
export function MobileActionBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const booking = document.getElementById('agendamento');

    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.85;
      const atBooking =
        booking !== null && booking.getBoundingClientRect().top < window.innerHeight * 0.6;
      setVisible(pastHero && !atBooking);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={styles.bar} data-visible={visible} aria-hidden={!visible} inert={!visible}>
      <a
        href="#agendamento"
        className={styles.primary}
        onClick={() => track('start_booking', { source: 'mobile_bar' })}
      >
        Agendar serviço
      </a>

      {site.contact.whatsappLink ? (
        <a
          href={site.contact.whatsappLink}
          className={styles.secondary}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('click_whatsapp', { source: 'mobile_bar' })}
        >
          <span className="visually-hidden">Falar no WhatsApp</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.87 9.87 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.81.83-3.03-.2-.31a8.17 8.17 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.23-8.23 2.2 0 4.26.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.16 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
