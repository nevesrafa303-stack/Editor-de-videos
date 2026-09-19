import { randomUUID } from 'node:crypto';

import type {
  BookingRepository,
  BookingWithRelations,
  BusyInterval,
  CreateBookingInput,
  Customer,
  Notification,
  Vehicle,
} from './types';

/**
 * Driver em memoria.
 *
 * Existe para que `npm run dev` funcione de ponta a ponta sem PostgreSQL: da
 * para percorrer o agendamento inteiro, ver horario sumir da grade e checar as
 * notificacoes.
 *
 * NAO SERVE PARA PRODUCAO — os dados morrem no restart e nao sao compartilhados
 * entre instancias. `/api/health` sinaliza isso explicitamente.
 */
export class MemoryBookingRepository implements BookingRepository {
  readonly driver = 'memory' as const;

  private readonly customers = new Map<string, Customer>();
  private readonly vehicles = new Map<string, Vehicle>();
  private readonly bookings = new Map<string, BookingWithRelations>();
  private readonly notifications: Notification[] = [];

  async createBooking(input: CreateBookingInput, concurrency: number) {
    const overlapping = [...this.bookings.values()].filter(
      (booking) =>
        booking.status !== 'cancelled' &&
        booking.status !== 'failed' &&
        booking.startsAt < input.endsAt &&
        booking.endsAt > input.startsAt,
    );

    if (overlapping.length >= concurrency) {
      return { ok: false as const, reason: 'slot_taken' as const };
    }

    const now = new Date();

    // Reaproveita o cliente pelo e-mail: o mesmo cliente nao vira dois cadastros.
    const existingCustomer = [...this.customers.values()].find(
      (customer) => customer.email === input.customer.email,
    );

    const customer: Customer = existingCustomer ?? {
      id: randomUUID(),
      name: input.customer.name,
      phone: input.customer.phone,
      email: input.customer.email,
      createdAt: now,
    };
    this.customers.set(customer.id, customer);

    const vehicle: Vehicle = {
      id: randomUUID(),
      customerId: customer.id,
      brand: input.vehicle.brand,
      model: input.vehicle.model,
      year: input.vehicle.year,
    };
    this.vehicles.set(vehicle.id, vehicle);

    const booking: BookingWithRelations = {
      id: randomUUID(),
      customerId: customer.id,
      vehicleId: vehicle.id,
      serviceSlug: input.serviceSlug,
      date: input.date,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: 'pending',
      notes: input.notes,
      googleEventId: null,
      createdAt: now,
      customer,
      vehicle,
    };

    this.bookings.set(booking.id, booking);
    return { ok: true as const, booking };
  }

  async findBusyIntervals(from: Date, to: Date): Promise<BusyInterval[]> {
    return [...this.bookings.values()]
      .filter(
        (booking) =>
          booking.status !== 'cancelled' &&
          booking.status !== 'failed' &&
          booking.startsAt < to &&
          booking.endsAt > from,
      )
      .map((booking) => ({
        start: booking.startsAt,
        end: booking.endsAt,
        googleEventId: booking.googleEventId,
      }));
  }

  async getBooking(id: string) {
    return this.bookings.get(id) ?? null;
  }

  async updateBooking(id: string, patch: Partial<BookingWithRelations>) {
    const booking = this.bookings.get(id);
    if (!booking) return;
    this.bookings.set(id, { ...booking, ...patch });
  }

  async recordNotification(input: {
    bookingId: string;
    channel: Notification['channel'];
    status: Notification['status'];
    detail?: string | null;
  }) {
    this.notifications.push({
      id: randomUUID(),
      bookingId: input.bookingId,
      channel: input.channel,
      status: input.status,
      detail: input.detail ?? null,
      sentAt: input.status === 'sent' ? new Date() : null,
    });
  }

  async listNotifications(bookingId: string) {
    return this.notifications.filter((notification) => notification.bookingId === bookingId);
  }
}
