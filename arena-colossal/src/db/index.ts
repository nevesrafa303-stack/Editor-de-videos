import 'server-only';

import { serverEnv } from '@/lib/config/env';

import { MemoryBookingRepository } from './memory-repository';
import type { BookingRepository } from './types';

let cached: BookingRepository | null = null;

/**
 * Devolve o repositorio de agendamentos.
 *
 * Com `DATABASE_URL` definido usa PostgreSQL via Prisma; sem ele, cai no driver
 * em memoria para que o desenvolvimento local nao exija banco. O import do
 * Prisma e' dinamico de proposito: em modo memoria o client nem e' carregado,
 * entao o projeto roda mesmo sem `prisma generate` ter sido executado.
 */
export async function getRepository(): Promise<BookingRepository> {
  if (cached) return cached;

  if (serverEnv.databaseUrl === null) {
    cached = new MemoryBookingRepository();
    return cached;
  }

  const { PrismaBookingRepository } = await import('./prisma-repository');
  cached = new PrismaBookingRepository();
  return cached;
}

export type { BookingRepository } from './types';
