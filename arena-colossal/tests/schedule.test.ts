import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDaySlots,
  describeBusinessHours,
  getBookingWindow,
  isBlackoutDate,
  isWithinBookingWindow,
} from '@/services/booking/schedule';

/**
 * A grade de horários é o que o cliente vê antes de decidir. Um erro aqui
 * oferece um horário que a Arena não consegue cumprir — pior que não oferecer
 * horário nenhum.
 *
 * O relógio é congelado em todos os testes: a grade depende de "agora" por
 * causa da antecedência mínima, e um teste que dependesse do relógio real
 * passaria de manhã e falharia à noite.
 */
const AGORA = new Date('2026-03-09T12:00:00.000Z'); // segunda, 09:00 em São Paulo

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('grade de horários do dia', () => {
  it('gera a grade completa de um dia útil', () => {
    // Quarta-feira, bem além da antecedência mínima. Serviço de 60 min,
    // janela 08:00–18:00, passo de 30 min: de 08:00 até 17:00.
    const slots = buildDaySlots('2026-03-11', 60);
    expect(slots[0]?.time).toBe('08:00');
    expect(slots.at(-1)?.time).toBe('17:00');
    expect(slots).toHaveLength(19);
  });

  it('não oferece horário cujo serviço termine depois do fechamento', () => {
    // Serviço de 8h numa janela de 10h: o último início possível é 10:00.
    const slots = buildDaySlots('2026-03-11', 480);
    expect(slots.at(-1)?.time).toBe('10:00');
    for (const slot of slots) {
      expect(slot.endsAt.getTime() - slot.startsAt.getTime()).toBe(480 * 60_000);
    }
  });

  it('respeita a janela menor do sábado', () => {
    // Sábado 08:00–12:00. Serviço de 3h: último início às 09:00.
    const slots = buildDaySlots('2026-03-14', 180);
    expect(slots[0]?.time).toBe('08:00');
    expect(slots.at(-1)?.time).toBe('09:00');
  });

  it('não gera horário em dia sem atendimento', () => {
    expect(buildDaySlots('2026-03-15', 60)).toHaveLength(0); // domingo
  });

  it('não gera horário em data bloqueada', () => {
    expect(isBlackoutDate('2026-12-25')).toBe(true);
    expect(buildDaySlots('2026-12-25', 60)).toHaveLength(0);
  });

  it('aplica a antecedência mínima', () => {
    // Agora: segunda 09:00 local. Com 12h de antecedência, o primeiro horário
    // possível é 21:00 de hoje — depois do fechamento. Hoje fica sem grade.
    expect(buildDaySlots('2026-03-09', 60)).toHaveLength(0);

    // Terça já está inteiramente além do limite.
    expect(buildDaySlots('2026-03-10', 60).length).toBeGreaterThan(0);
  });

  it('marca os horários com instantes UTC coerentes com o fuso local', () => {
    const [primeiro] = buildDaySlots('2026-03-11', 60);
    expect(primeiro?.startsAt.toISOString()).toBe('2026-03-11T11:00:00.000Z'); // 08:00 BRT
  });
});

describe('janela de agendamento', () => {
  it('começa depois da antecedência mínima, não hoje de manhã', () => {
    // Agora é segunda 09:00 local; +12h ainda cai na segunda.
    expect(getBookingWindow().first).toBe('2026-03-09');
  });

  it('empurra o primeiro dia quando a antecedência atravessa a meia-noite', () => {
    vi.setSystemTime(new Date('2026-03-09T23:00:00.000Z')); // 20:00 local
    // +12h = 08:00 do dia seguinte.
    expect(getBookingWindow().first).toBe('2026-03-10');
  });

  it('limita a janela pelo máximo de dias de antecedência', () => {
    const { first, last } = getBookingWindow();
    expect(last).toBe('2026-05-08'); // 2026-03-09 + 60 dias
    expect(isWithinBookingWindow(first)).toBe(true);
    expect(isWithinBookingWindow(last)).toBe(true);
    expect(isWithinBookingWindow('2026-05-09')).toBe(false);
    expect(isWithinBookingWindow('2026-03-08')).toBe(false);
  });
});

describe('horário de funcionamento para exibição', () => {
  it('agrupa dias seguidos com a mesma janela', () => {
    const linhas = describeBusinessHours();
    expect(linhas).toEqual([
      { day: 'Segunda a Sexta', hours: '08:00 – 18:00' },
      { day: 'Sábado', hours: '08:00 – 12:00' },
    ]);
  });
});
