/** Modelo de dominio do agendamento — independente do driver de persistencia. */

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'failed';

export type NotificationChannel =
  | 'calendar'
  | 'whatsapp_internal'
  | 'email_internal'
  | 'email_customer';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: Date;
};

export type Vehicle = {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  year: number | null;
};

export type Booking = {
  id: string;
  customerId: string;
  vehicleId: string;
  /** Slug do catalogo em `src/lib/config/services.ts`. */
  serviceSlug: string;
  /** Data civil no fuso da operacao (`YYYY-MM-DD`). */
  date: string;
  /** Instantes UTC — a unica forma confiavel de comparar sobreposicao. */
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  notes: string | null;
  googleEventId: string | null;
  createdAt: Date;
};

export type BookingWithRelations = Booking & {
  customer: Customer;
  vehicle: Vehicle;
};

export type Notification = {
  id: string;
  bookingId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  detail: string | null;
  sentAt: Date | null;
};

export type CreateBookingInput = {
  customer: { name: string; phone: string; email: string };
  vehicle: { brand: string; model: string; year: number | null };
  serviceSlug: string;
  date: string;
  startsAt: Date;
  endsAt: Date;
  notes: string | null;
};

/**
 * Intervalo ocupado — usado no calculo de disponibilidade.
 *
 * `googleEventId` diz se este intervalo JA aparece no Google Calendar. Sem essa
 * informacao, um agendamento que gerou evento seria contado duas vezes (uma
 * pelo banco, outra pelo freeBusy) e derrubaria horarios validos da grade.
 */
export type BusyInterval = { start: Date; end: Date; googleEventId: string | null };

/**
 * Contrato de persistencia.
 *
 * Duas implementacoes: `prisma` (producao, PostgreSQL) e `memory`
 * (desenvolvimento sem banco). Qualquer driver novo so precisa satisfazer esta
 * interface — nenhum servico conhece o banco diretamente.
 */
export interface BookingRepository {
  readonly driver: 'prisma' | 'memory';

  /**
   * Cria cliente, veiculo e agendamento de uma vez.
   *
   * A implementacao PRECISA recusar o agendamento se o numero de reservas
   * ativas sobrepostas atingir `concurrency` — essa e' a barreira real contra
   * reserva dupla, ja que a validacao do frontend nao e' confiavel.
   */
  createBooking(
    input: CreateBookingInput,
    concurrency: number,
  ): Promise<{ ok: true; booking: BookingWithRelations } | { ok: false; reason: 'slot_taken' }>;

  /** Intervalos ocupados por agendamentos ativos dentro da janela. */
  findBusyIntervals(from: Date, to: Date): Promise<BusyInterval[]>;

  getBooking(id: string): Promise<BookingWithRelations | null>;

  updateBooking(
    id: string,
    patch: Partial<Pick<Booking, 'status' | 'googleEventId'>>,
  ): Promise<void>;

  recordNotification(input: {
    bookingId: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    detail?: string | null;
  }): Promise<void>;

  listNotifications(bookingId: string): Promise<Notification[]>;
}
