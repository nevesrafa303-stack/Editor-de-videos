import { getService } from '@/lib/config/services';
import type { BookingWithRelations } from '@/db/types';
import { formatIsoDateLong } from '@/lib/utils/format';
import { formatBookingTimeRange } from '@/services/booking/format';

/**
 * Corpo da mensagem interna de novo agendamento.
 *
 * Mantido fora do transporte de proposito: trocar de provedor de WhatsApp nao
 * deve exigir reescrever a mensagem, e a mensagem nao deve depender de detalhe
 * de API.
 */
export function buildInternalBookingMessage(booking: BookingWithRelations): string {
  const service = getService(booking.serviceSlug);
  const vehicle = [booking.vehicle.brand, booking.vehicle.model, booking.vehicle.year]
    .filter((part) => part !== null && part !== '')
    .join(' ');

  return [
    'NOVO AGENDAMENTO — ARENA COLOSSAL',
    '',
    `Cliente: ${booking.customer.name}`,
    `WhatsApp: ${booking.customer.phone.startsWith('55') ? `+${booking.customer.phone}` : booking.customer.phone}`,
    `E-mail: ${booking.customer.email}`,
    '',
    `Veículo: ${vehicle}`,
    `Serviço: ${service?.name ?? booking.serviceSlug}`,
    `Data: ${formatIsoDateLong(booking.date)}`,
    `Horário: ${formatBookingTimeRange(booking)}`,
    '',
    `Observações: ${booking.notes && booking.notes.length > 0 ? booking.notes : '—'}`,
  ].join('\n');
}

/**
 * Parametros posicionais para um template aprovado na Meta.
 *
 * A ordem precisa bater com os `{{1}}`, `{{2}}`... cadastrados no template.
 * Veja README > "WhatsApp" para o corpo sugerido.
 */
export function buildInternalTemplateParams(booking: BookingWithRelations): string[] {
  const service = getService(booking.serviceSlug);
  const vehicle = [booking.vehicle.brand, booking.vehicle.model, booking.vehicle.year]
    .filter((part) => part !== null && part !== '')
    .join(' ');

  return [
    booking.customer.name,
    booking.customer.phone,
    service?.name ?? booking.serviceSlug,
    vehicle,
    formatIsoDateLong(booking.date),
    formatBookingTimeRange(booking),
  ];
}
