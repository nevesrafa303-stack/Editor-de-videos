import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRepository } from '@/db';
import { createBooking } from '@/services/booking';
import { getAvailability } from '@/services/booking/availability';
import type { BookingRequest } from '@/lib/validation/booking';

/**
 * Regras de negócio do agendamento, ponta a ponta, sobre o driver em memória.
 *
 * Sem banco e sem rede: o Google Calendar, o WhatsApp e o e-mail estão
 * desligados neste ambiente, então cada notificação é registrada como
 * `skipped` — que é exatamente o caminho que precisa continuar não derrubando
 * a reserva.
 */
const AGORA = new Date('2026-03-09T12:00:00.000Z'); // segunda, 09:00 em São Paulo
const QUARTA = '2026-03-11';

function pedido(sobrescreve: Partial<BookingRequest> = {}): BookingRequest {
  return {
    name: 'João da Silva',
    phone: '5547991234567',
    email: `cliente${Math.random().toString(36).slice(2)}@example.com`,
    vehicleBrand: 'BMW',
    vehicleModel: '320i',
    vehicleYear: 2021,
    serviceSlug: 'higienizacao-ar-condicionado', // 60 min
    date: QUARTA,
    time: '10:00',
    notes: null,
    consent: true,
    turnstileToken: null,
    ...sobrescreve,
  } as BookingRequest;
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
  // Zera o estado entre testes: o repositório em memória vive em globalThis.
  delete (globalThis as { arenaRepository?: unknown }).arenaRepository;
  await getRepository();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('criação de agendamento', () => {
  it('reserva o horário e devolve o resumo da confirmação', async () => {
    const r = await createBooking(pedido());
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.confirmation.time).toBe('10:00');
    expect(r.confirmation.timeRange).toBe('10:00 – 11:00');
    expect(r.confirmation.vehicle).toBe('BMW 320i 2021');
    expect(r.confirmation.startsAt).toBe('2026-03-11T13:00:00.000Z'); // 10:00 BRT
  });

  it('recusa o mesmo horário duas vezes', async () => {
    expect((await createBooking(pedido())).ok).toBe(true);

    const segundo = await createBooking(pedido());
    expect(segundo.ok).toBe(false);
    if (!segundo.ok) expect(segundo.reason).toBe('slot_taken');
  });

  it('recusa horário que apenas SOBREPÕE outro já reservado', async () => {
    // Polimento de 8h às 09:00 ocupa até 17:00.
    expect(
      (await createBooking(pedido({ serviceSlug: 'polimento-tecnico', time: '09:00' }))).ok,
    ).toBe(true);

    // Um serviço curto às 14:00 cai dentro daquele bloco.
    const conflito = await createBooking(pedido({ time: '14:00' }));
    expect(conflito.ok).toBe(false);
    if (!conflito.ok) expect(conflito.reason).toBe('slot_taken');
  });

  it('aceita horário encostado no fim do anterior, sem sobreposição', async () => {
    // 10:00–11:00 seguido de 11:00–12:00: os limites se tocam, não se cruzam.
    expect((await createBooking(pedido({ time: '10:00' }))).ok).toBe(true);
    expect((await createBooking(pedido({ time: '11:00' }))).ok).toBe(true);
  });

  it('recusa horário que não existe na grade', async () => {
    const r = await createBooking(pedido({ time: '07:00' })); // antes da abertura
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_slot');
  });

  it('recusa horário cujo serviço passaria do fechamento', async () => {
    // Polimento de 8h às 11:00 terminaria às 19:00.
    const r = await createBooking(pedido({ serviceSlug: 'polimento-tecnico', time: '11:00' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_slot');
  });

  it('recusa dia sem atendimento', async () => {
    const r = await createBooking(pedido({ date: '2026-03-15' })); // domingo
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_slot');
  });

  it('recusa data fora da janela de agendamento', async () => {
    const r = await createBooking(pedido({ date: '2026-09-01' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('out_of_window');
  });

  it('confirma a reserva mesmo com todas as integrações desligadas', async () => {
    const r = await createBooking(pedido());
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const repo = await getRepository();
    const reserva = await repo.getBooking(r.confirmation.id);
    expect(reserva?.status).toBe('confirmed');

    // Cada canal registrou o próprio resultado, sem derrubar o agendamento.
    const canais = await repo.listNotifications(r.confirmation.id);
    expect(canais.map((c) => c.channel).sort()).toEqual([
      'calendar',
      'email_customer',
      'email_internal',
      'whatsapp_internal',
    ]);
    expect(canais.every((c) => c.status === 'skipped')).toBe(true);
  });

  it('reaproveita o cliente pelo e-mail em vez de duplicar cadastro', async () => {
    const email = 'recorrente@example.com';
    const a = await createBooking(pedido({ email, time: '10:00' }));
    const b = await createBooking(pedido({ email, time: '13:00' }));
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;

    const repo = await getRepository();
    const r1 = await repo.getBooking(a.confirmation.id);
    const r2 = await repo.getBooking(b.confirmation.id);
    expect(r1?.customerId).toBe(r2?.customerId);
  });
});

describe('disponibilidade', () => {
  it('marca como ocupado o horário reservado e os que o sobrepõem', async () => {
    await createBooking(pedido({ serviceSlug: 'higienizacao-ar-condicionado', time: '10:00' }));

    const grade = await getAvailability(QUARTA, 'higienizacao-ar-condicionado');
    const ocupados = grade.slots.filter((s) => !s.available).map((s) => s.time);

    // A reserva vai de 10:00 a 11:00. Um serviço de 60 min começando às 09:30
    // terminaria às 10:30 — também colide.
    expect(ocupados).toEqual(['09:30', '10:00', '10:30']);
  });

  it('devolve a grade vazia em dia sem atendimento, sem quebrar', async () => {
    const grade = await getAvailability('2026-03-15', 'protecao-pneus');
    expect(grade.slots).toHaveLength(0);
    expect(grade.scheduleConfigured).toBe(true);
  });

  it('não marca nada como degradado quando o Calendar está desligado', async () => {
    const grade = await getAvailability(QUARTA, 'protecao-pneus');
    expect(grade.degraded).toBe(false);
    expect(grade.slots.every((s) => s.available)).toBe(true);
  });

  it('ignora serviço inexistente em vez de estourar', async () => {
    const grade = await getAvailability(QUARTA, 'servico-fantasma');
    expect(grade.slots).toHaveLength(0);
  });
});
