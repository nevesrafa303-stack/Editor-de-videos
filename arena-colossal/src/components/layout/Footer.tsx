import { navigation, site } from '@/lib/config/site';
import { describeBusinessHours } from '@/services/booking/schedule';

import { WhatsAppLink } from './WhatsAppLink';
import styles from './Footer.module.css';

/**
 * Rodape.
 *
 * Componente de servidor: le o horario de funcionamento direto da configuracao.
 * Quando `BOOKING_HOURS` esta vazio o bloco de horario simplesmente nao existe —
 * o site nao publica horario que ninguem confirmou.
 */
export function Footer() {
  const businessHours = describeBusinessHours();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <p className={styles.name}>
            Arena <em>Colossal</em>
          </p>
          <p className={styles.tagline}>Estética Automotiva</p>
          <p className={styles.city}>
            {site.location.city} — {site.location.state}
          </p>
          {site.location.fullAddress ? (
            <address className={styles.address}>{site.location.fullAddress}</address>
          ) : null}
        </div>

        <nav className={styles.column} aria-label="Navegação do rodapé">
          <h2 className={styles.columnTitle}>Navegação</h2>
          <ul className={styles.list}>
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={styles.link}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.column}>
          <h2 className={styles.columnTitle}>Contato</h2>
          <ul className={styles.list}>
            {site.contact.whatsappLink ? (
              <li>
                <WhatsAppLink className={styles.link} source="footer">
                  WhatsApp
                </WhatsAppLink>
              </li>
            ) : null}
            {site.contact.instagramUrl ? (
              <li>
                <a
                  href={site.contact.instagramUrl}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </li>
            ) : null}
            {site.contact.email ? (
              <li>
                <a href={`mailto:${site.contact.email}`} className={styles.link}>
                  {site.contact.email}
                </a>
              </li>
            ) : null}
            <li>
              <a href="#localizacao" className={styles.link}>
                Localização
              </a>
            </li>
            <li>
              <a href="#duvidas" className={styles.link}>
                Dúvidas frequentes
              </a>
            </li>
          </ul>
        </div>

        {businessHours.length > 0 ? (
          <div className={styles.column}>
            <h2 className={styles.columnTitle}>Atendimento</h2>
            <ul className={styles.list}>
              {businessHours.map((line) => (
                <li key={line.day} className={styles.hoursRow}>
                  <span>{line.day}</span>
                  <span className={styles.hoursValue}>{line.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© {year} Arena Colossal. Todos os direitos reservados.</p>
        <a href="/politica-de-privacidade" className={styles.link}>
          Política de privacidade
        </a>
      </div>
    </footer>
  );
}
