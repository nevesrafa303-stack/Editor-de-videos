import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';
import { getRepository } from '@/db';
import type { NotificationChannel, NotificationStatus } from '@/db/types';
import { getService } from '@/lib/config/services';
import { site } from '@/lib/config/site';
import { formatIsoDateLong } from '@/lib/utils/format';
import { formatBookingTimeRange } from '@/services/booking/format';

import styles from './page.module.css';

type Params = { params: Promise<{ id: string }> };

/** O estado do agendamento muda; a página nunca pode vir de cache. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Seu agendamento',
  description: 'Acompanhe o horário reservado na Arena Colossal.',
  // Link privado: não deve entrar em índice de busca nenhum.
  robots: { index: false, follow: false },
};

const ROTULO_CANAL: Record<NotificationChannel, string> = {
  calendar: 'Agenda da Arena',
  whatsapp_internal: 'Aviso para a equipe',
  email_internal: 'Cópia interna',
  email_customer: 'Confirmação por e-mail',
};

const ROTULO_STATUS: Record<NotificationStatus, string> = {
  sent: 'Enviado',
  pending: 'Em fila',
  failed: 'Falhou',
  skipped: 'Não configurado',
};

/**
 * Acompanhamento do agendamento.
 *
 * É o link que o cliente guarda depois de confirmar: ele volta aqui e vê o
 * horário reservado sem precisar procurar e-mail nem chamar no WhatsApp.
 *
 * DECISÃO DE PRIVACIDADE: esta página NÃO mostra nome, telefone nem e-mail. O
 * identificador circula por e-mail, aparece na barra de endereço e vai parar
 * em histórico de navegador — ele não pode virar chave de acesso a dado
 * pessoal de ninguém. Mostra o compromisso, não a pessoa.
 */
export default async function BookingStatusPage({ params }: Params) {
  const { id } = await params;

  if (id.length === 0 || id.length > 64) notFound();

  const repository = await getRepository();
  const booking = await repository.getBooking(id);

  if (booking === null) notFound();

  const service = getService(booking.serviceSlug);
  const notifications = await repository.listNotifications(booking.id);

  const cancelado = booking.status === 'cancelled';

  return (
    <div className={`container-narrow ${styles.pagina}`}>
      <header className={styles.topo}>
        <p className="eyebrow">Arena Colossal</p>
        <h1 className={styles.titulo}>{cancelado ? 'Agendamento cancelado.' : 'Seu horário está reservado.'}</h1>
        <p className={styles.subtitulo}>
          {cancelado
            ? 'Este horário foi liberado na agenda. Se foi engano, fale com a Arena.'
            : 'Guarde este link: ele mostra o estado atual do seu agendamento a qualquer momento.'}
        </p>
      </header>

      <dl className={styles.ficha}>
        <div className={styles.linha}>
          <dt>Serviço</dt>
          <dd>{service?.name ?? booking.serviceSlug}</dd>
        </div>
        <div className={styles.linha}>
          <dt>Data</dt>
          <dd>{formatIsoDateLong(booking.date)}</dd>
        </div>
        <div className={styles.linha}>
          <dt>Horário</dt>
          <dd>{formatBookingTimeRange(booking)}</dd>
        </div>
        <div className={styles.linha}>
          <dt>Veículo</dt>
          <dd>
            {[booking.vehicle.brand, booking.vehicle.model, booking.vehicle.year]
              .filter((parte) => parte !== null && parte !== '')
              .join(' ')}
          </dd>
        </div>
        <div className={styles.linha}>
          <dt>Local</dt>
          <dd>
            {site.location.fullAddress ?? `${site.location.city} — ${site.location.state}`}
          </dd>
        </div>
      </dl>

      {notifications.length > 0 ? (
        <section className={styles.entrega} aria-label="Confirmações enviadas">
          <h2 className={styles.entregaTitulo}>Confirmações</h2>
          <ul className={styles.canais}>
            {notifications.map((notification) => (
              <li key={notification.id} className={styles.canal} data-status={notification.status}>
                <span>{ROTULO_CANAL[notification.channel]}</span>
                <span className={styles.canalStatus}>{ROTULO_STATUS[notification.status]}</span>
              </li>
            ))}
          </ul>
          <p className={styles.entregaNota}>
            Uma confirmação que não saiu não afeta o seu horário: ele já está reservado na agenda.
          </p>
        </section>
      ) : null}

      <footer className={styles.acoes}>
        <Button href="/" variant="outline">
          Voltar ao site
        </Button>
        <WhatsAppLink source="acompanhamento" className={styles.whats}>
          Remarcar ou tirar dúvida no WhatsApp
        </WhatsAppLink>
      </footer>

      <p className={styles.codigo}>Agendamento #{booking.id}</p>
    </div>
  );
}
