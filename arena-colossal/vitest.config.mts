import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Testes do núcleo do agendamento.
 *
 * O ambiente é fixado aqui, e não em `.env`, porque as regras de agenda são
 * lidas uma única vez no import de `serverEnv`: um teste que dependesse da
 * máquina de quem roda não provaria nada.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      BOOKING_TIMEZONE: 'America/Sao_Paulo',
      // Seg–sex 08:00–18:00, sábado 08:00–12:00, domingo fechado.
      BOOKING_HOURS: '1:08:00-18:00,2:08:00-18:00,3:08:00-18:00,4:08:00-18:00,5:08:00-18:00,6:08:00-12:00',
      BOOKING_SLOT_MINUTES: '30',
      BOOKING_MIN_NOTICE_HOURS: '12',
      BOOKING_MAX_ADVANCE_DAYS: '60',
      BOOKING_CONCURRENCY: '1',
      BOOKING_BLACKOUT_DATES: '2026-12-25',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` existe para quebrar o build se um componente de cliente
      // importar código de servidor. Em Node, fora do bundler, ele não resolve.
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
});
