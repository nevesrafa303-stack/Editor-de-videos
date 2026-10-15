import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, type Prisma } from '@/generated/prisma/client';
import { serverEnv } from '@/lib/config/env';

import type {
  BookingRepository,
  BookingStatus,
  BookingWithRelations,
  BusyInterval,
  CreateBookingInput,
  Notification,
} from './types';

/**
 * Em desenvolvimento o hot reload recria modulos a cada edicao; sem este cache
 * global cada recarga abriria um novo pool de conexoes ate estourar o limite do
 * Postgres.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing) return existing;

  // Este driver so e' instanciado quando `DATABASE_URL` existe (ver src/db/index.ts).
  const connectionString = serverEnv.databaseUrl ?? '';

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
  return client;
}

/** Status que ocupam horario na agenda. */
const ACTIVE_STATUSES = ['pending', 'confirmed'] as const;

export class PrismaBookingRepository implements BookingRepository {
  readonly driver = 'prisma' as const;

  private readonly prisma = getClient();

  /**
   * Cria o agendamento dentro de uma transacao SERIALIZABLE.
   *
   * A checagem de sobreposicao e a insercao precisam ser atomicas: duas pessoas
   * confirmando o mesmo horario ao mesmo tempo passariam as duas por uma
   * verificacao feita fora da transacao. Com `Serializable`, a segunda
   * transacao e' abortada pelo banco e o cliente recebe "horario acabou de ser
   * reservado" — que e' exatamente a mensagem prevista no fluxo de erro.
   */
  async createBooking(input: CreateBookingInput, concurrency: number) {
    try {
      const booking = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const overlapping = await tx.booking.count({
            where: {
              status: { in: [...ACTIVE_STATUSES] },
              startsAt: { lt: input.endsAt },
              endsAt: { gt: input.startsAt },
            },
          });

          if (overlapping >= concurrency) return null;

          const customer = await tx.customer.upsert({
            where: { email: input.customer.email },
            update: { name: input.customer.name, phone: input.customer.phone },
            create: {
              name: input.customer.name,
              phone: input.customer.phone,
              email: input.customer.email,
            },
          });

          const vehicle = await tx.vehicle.create({
            data: {
              customerId: customer.id,
              brand: input.vehicle.brand,
              model: input.vehicle.model,
              year: input.vehicle.year,
            },
          });

          return tx.booking.create({
            data: {
              customerId: customer.id,
              vehicleId: vehicle.id,
              serviceSlug: input.serviceSlug,
              date: input.date,
              startsAt: input.startsAt,
              endsAt: input.endsAt,
              status: 'pending',
              notes: input.notes,
            },
            include: { customer: true, vehicle: true },
          });
        },
        { isolationLevel: 'Serializable' },
      );

      if (booking === null) return { ok: false as const, reason: 'slot_taken' as const };
      return { ok: true as const, booking: toDomain(booking) };
    } catch (error) {
      // Conflito de serializacao = outra reserva ganhou a corrida.
      if (isSerializationFailure(error)) {
        return { ok: false as const, reason: 'slot_taken' as const };
      }
      throw error;
    }
  }

  async findBusyIntervals(from: Date, to: Date): Promise<BusyInterval[]> {
    const [bookings, blocks] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          status: { in: [...ACTIVE_STATUSES] },
          startsAt: { lt: to },
          endsAt: { gt: from },
        },
        select: { startsAt: true, endsAt: true, googleEventId: true },
      }),
      this.prisma.availabilityBlock.findMany({
        where: { startsAt: { lt: to }, endsAt: { gt: from } },
        select: { startsAt: true, endsAt: true },
      }),
    ]);

    return [
      ...bookings.map((row) => ({
        start: row.startsAt,
        end: row.endsAt,
        googleEventId: row.googleEventId,
      })),
      // Bloqueios manuais nunca tem evento no Google: contam sempre.
      ...blocks.map((row) => ({ start: row.startsAt, end: row.endsAt, googleEventId: null })),
    ];
  }

  async getBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { customer: true, vehicle: true },
    });
    return booking ? toDomain(booking) : null;
  }

  async updateBooking(id: string, patch: { status?: BookingStatus; googleEventId?: string | null }) {
    await this.prisma.booking.update({ where: { id }, data: patch });
  }

  async recordNotification(input: {
    bookingId: string;
    channel: Notification['channel'];
    status: Notification['status'];
    detail?: string | null;
  }) {
    await this.prisma.notification.create({
      data: {
        bookingId: input.bookingId,
        channel: input.channel,
        status: input.status,
        detail: input.detail ?? null,
        sentAt: input.status === 'sent' ? new Date() : null,
      },
    });
  }

  async listNotifications(bookingId: string): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      channel: row.channel,
      status: row.status,
      detail: row.detail,
      sentAt: row.sentAt,
    }));
  }
}

type PrismaBookingRow = Awaited<
  ReturnType<PrismaClient['booking']['findUniqueOrThrow']>
> & {
  customer: { id: string; name: string; phone: string; email: string; createdAt: Date };
  vehicle: { id: string; customerId: string; brand: string; model: string; year: number | null };
};

function toDomain(row: PrismaBookingRow): BookingWithRelations {
  return {
    id: row.id,
    customerId: row.customerId,
    vehicleId: row.vehicleId,
    serviceSlug: row.serviceSlug,
    date: row.date,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status,
    notes: row.notes,
    googleEventId: row.googleEventId,
    createdAt: row.createdAt,
    customer: row.customer,
    vehicle: row.vehicle,
  };
}

/** `40001` e' o codigo do Postgres para falha de serializacao. */
function isSerializationFailure(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: unknown }).code;
  return code === 'P2034' || code === '40001';
}
