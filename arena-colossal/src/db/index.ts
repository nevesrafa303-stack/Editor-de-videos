import 'server-only';

import { serverEnv } from '@/lib/config/env';

import { MemoryBookingRepository } from './memory-repository';
import type { BookingRepository } from './types';

/**
 * O repositorio vive em `globalThis`, nao em uma variavel de modulo.
 *
 * O Next empacota rotas de API e paginas em bundles separados, e cada bundle
 * recebe a SUA copia dos modulos. Com o driver em memoria isso significava
 * dois Maps diferentes: a pagina de acompanhamento respondia 404 para um
 * agendamento que a rota `/api/bookings` acabara de criar.
 *
 * O mesmo cache tambem evita abrir um pool novo de conexoes a cada hot reload
 * em desenvolvimento.
 */
const globalForRepository = globalThis as unknown as { arenaRepository?: BookingRepository };

/**
 * Devolve o repositorio de agendamentos.
 *
 * Com `DATABASE_URL` definido usa PostgreSQL via Prisma; sem ele, cai no driver
 * em memoria para que o desenvolvimento local nao exija banco. O import do
 * Prisma e' dinamico de proposito: em modo memoria o client nem e' carregado,
 * entao o projeto roda mesmo sem `prisma generate` ter sido executado.
 */
export async function getRepository(): Promise<BookingRepository> {
  const existente = globalForRepository.arenaRepository;
  if (existente) return existente;

  if (serverEnv.databaseUrl === null) {
    const memoria = new MemoryBookingRepository();
    globalForRepository.arenaRepository = memoria;
    return memoria;
  }

  const { PrismaBookingRepository } = await import('./prisma-repository');
  const prisma = new PrismaBookingRepository();
  globalForRepository.arenaRepository = prisma;
  return prisma;
}

export type { BookingRepository } from './types';
