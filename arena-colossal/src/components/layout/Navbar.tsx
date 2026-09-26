'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { track } from '@/lib/analytics';
import { navigation, site } from '@/lib/config/site';

import styles from './Navbar.module.css';

/** A partir de quantos pixels a navbar deixa de ser transparente. */
const SOLID_AFTER_PX = 80;

export function Navbar() {
  const [isSolid, setIsSolid] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setIsSolid(window.scrollY > SOLID_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Menu fullscreen: trava o scroll, fecha no Esc e prende o foco dentro dele.
  useEffect(() => {
    if (!isMenuOpen) {
      document.body.dataset.locked = 'false';
      return;
    }

    document.body.dataset.locked = 'true';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    // Leva o foco para dentro do menu assim que ele abre.
    menuRef.current?.querySelector<HTMLElement>('a[href]')?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.dataset.locked = 'false';
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <header className={styles.header} data-solid={isSolid} data-menu-open={isMenuOpen}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo} aria-label="Arena Colossal — início">
          <span className={styles.logoMark}>AC</span>
          <span className={styles.logoText}>
            Arena <em>Colossal</em>
          </span>
        </a>

        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <ul className={styles.navList}>
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={styles.navLink}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <Button
            href="/#agendamento"
            size="md"
            className={styles.cta}
            onClick={() => track('start_booking', { source: 'navbar' })}
          >
            Agendar
          </Button>

          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-expanded={isMenuOpen}
            aria-controls="menu-mobile"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="visually-hidden">{isMenuOpen ? 'Fechar menu' : 'Abrir menu'}</span>
            <span className={styles.toggleBar} data-bar="top" aria-hidden="true" />
            <span className={styles.toggleBar} data-bar="bottom" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id="menu-mobile"
        ref={menuRef}
        className={styles.mobileMenu}
        data-open={isMenuOpen}
        // Fora da arvore de acessibilidade quando fechado — nada de foco fantasma.
        inert={!isMenuOpen}
      >
        <nav aria-label="Navegação principal (mobile)">
          <ul className={styles.mobileList}>
            {navigation.map((item, index) => (
              <li key={item.href} style={{ transitionDelay: `${90 + index * 55}ms` }}>
                <a href={item.href} className={styles.mobileLink} onClick={closeMenu}>
                  <span className={styles.mobileIndex}>{String(index + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.mobileFooter}>
          <Button href="/#agendamento" size="lg" magnetic={false} onClick={closeMenu}>
            Agendar serviço
          </Button>

          {site.contact.whatsappLink ? (
            <a
              className={styles.mobileWhats}
              href={site.contact.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track('click_whatsapp', { source: 'menu_mobile' });
                closeMenu();
              }}
            >
              Falar no WhatsApp
            </a>
          ) : null}

          <p className={styles.mobileLocation}>
            {site.location.city} — {site.location.state}
          </p>
        </div>
      </div>
    </header>
  );
}
