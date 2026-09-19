import { getService } from '@/lib/config/services';
import { site } from '@/lib/config/site';
import type { BookingWithRelations } from '@/db/types';
import { formatE164BR, formatIsoDateLong } from '@/lib/utils/format';
import { formatBookingTimeRange } from '@/services/booking/format';

/**
 * Templates de e-mail em HTML inline.
 *
 * Cliente de e-mail nao tem CSS moderno: nada de flexbox, grid ou variavel CSS
 * aqui. Tabela, estilo inline e um fallback em texto puro — que tambem melhora
 * entregabilidade.
 */

type EmailContent = { subject: string; html: string; text: string };

function rows(booking: BookingWithRelations): [string, string][] {
  const service = getService(booking.serviceSlug);
  const vehicle = [booking.vehicle.brand, booking.vehicle.model, booking.vehicle.year]
    .filter((part) => part !== null && part !== '')
    .join(' ');

  return [
    ['Serviço', service?.name ?? booking.serviceSlug],
    ['Data', formatIsoDateLong(booking.date)],
    ['Horário', formatBookingTimeRange(booking)],
    ['Veículo', vehicle],
    ['Cliente', booking.customer.name],
    ['WhatsApp', formatE164BR(booking.customer.phone)],
    ['E-mail', booking.customer.email],
    ['Observações', booking.notes && booking.notes.length > 0 ? booking.notes : '—'],
  ];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(title: string, intro: string, booking: BookingWithRelations): string {
  const body = rows(booking)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1f1f24;color:#8b8b93;font-size:12px;letter-spacing:.12em;text-transform:uppercase;width:150px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #1f1f24;color:#f2f2f4;font-size:15px;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#070708;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#0d0d10;border:1px solid #1f1f24;">
      <tr>
        <td style="padding:32px 32px 8px;">
          <p style="margin:0;color:#c9a227;font-size:11px;letter-spacing:.32em;text-transform:uppercase;">Arena Colossal</p>
          <h1 style="margin:14px 0 0;color:#ffffff;font-size:24px;line-height:1.2;">${escapeHtml(title)}</h1>
          <p style="margin:12px 0 0;color:#a9a9b0;font-size:14px;line-height:1.6;">${escapeHtml(intro)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${body}</table>
          <p style="margin:24px 0 0;color:#6e6e77;font-size:12px;line-height:1.6;">
            Agendamento #${escapeHtml(booking.id)}<br />
            ${escapeHtml(site.location.city)} — ${escapeHtml(site.location.state)}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function plain(title: string, booking: BookingWithRelations): string {
  return [title, '', ...rows(booking).map(([label, value]) => `${label}: ${value}`), '', `Agendamento #${booking.id}`].join('\n');
}

/** Copia interna — e' o e-mail que a equipe da Arena recebe. */
export function internalBookingEmail(booking: BookingWithRelations): EmailContent {
  const service = getService(booking.serviceSlug);
  const title = 'Novo agendamento';
  const intro = `${booking.customer.name} reservou um horário pelo site.`;

  return {
    subject: `Novo agendamento — ${service?.name ?? booking.serviceSlug} — ${formatIsoDateLong(booking.date)}`,
    html: layout(title, intro, booking),
    text: plain('NOVO AGENDAMENTO — ARENA COLOSSAL', booking),
  };
}

/** Confirmacao enviada ao cliente. */
export function customerBookingEmail(booking: BookingWithRelations): EmailContent {
  const title = 'Agendamento confirmado';
  const intro = 'Seu horário na Arena Colossal está reservado. Abaixo, o resumo do que combinamos.';

  return {
    subject: `Agendamento confirmado — Arena Colossal — ${formatIsoDateLong(booking.date)}`,
    html: layout(title, intro, booking),
    text: plain('AGENDAMENTO CONFIRMADO — ARENA COLOSSAL', booking),
  };
}
