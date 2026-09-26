import path from 'node:path';

import { defineConfig } from 'prisma/config';

/**
 * Configuracao do Prisma CLI.
 *
 * `DATABASE_URL` ganha um fallback inofensivo porque `prisma generate` precisa
 * de uma URL sintaticamente valida mas NAO conecta no banco — assim o projeto
 * continua gerando o client (e compilando) em ambientes sem banco, como CI.
 * Comandos que realmente conectam (`db:push`, `db:migrate`) falham de forma
 * clara se a variavel real nao estiver definida.
 *
 * O Prisma CLI nao le `.env.local` (esse arquivo e' do Next). Para os comandos
 * de banco, exporte `DATABASE_URL` no shell ou use um `.env`.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/arena_colossal',
  },
});
