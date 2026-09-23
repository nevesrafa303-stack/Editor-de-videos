import { describe, expect, it } from 'vitest';

import {
  addDays,
  isoDateWeekday,
  labelToMinutes,
  minutesToLabel,
  utcToIsoDate,
  utcToMinutes,
  zonedToUtc,
} from '@/lib/utils/timezone';

const TZ = 'America/Sao_Paulo';

/**
 * A conversão de fuso é a fundação do agendamento: se ela erra, o cliente
 * aparece na hora errada. Estes testes existem para que isso nunca dependa do
 * fuso da máquina onde o servidor roda.
 */
describe('conversão entre horário local e UTC', () => {
  it('converte horário de parede para UTC no fuso da operação', () => {
    // 10:00 em São Paulo (UTC-03) = 13:00 UTC.
    const instante = zonedToUtc('2026-03-12', 10 * 60, TZ);
    expect(instante.toISOString()).toBe('2026-03-12T13:00:00.000Z');
  });

  it('faz o caminho de volta sem perder informação', () => {
    const instante = zonedToUtc('2026-07-01', 14 * 60 + 30, TZ);
    expect(utcToIsoDate(instante, TZ)).toBe('2026-07-01');
    expect(utcToMinutes(instante, TZ)).toBe(14 * 60 + 30);
  });

  it('mantém a data civil correta na virada do dia', () => {
    // 23:30 local ainda é o mesmo dia local, embora já seja o dia seguinte UTC.
    const instante = zonedToUtc('2026-05-10', 23 * 60 + 30, TZ);
    expect(instante.toISOString()).toBe('2026-05-11T02:30:00.000Z');
    expect(utcToIsoDate(instante, TZ)).toBe('2026-05-10');
  });

  it('acerta o offset em fuso com horário de verão', () => {
    // Nova York: verão é UTC-04, inverno é UTC-05. A dupla passagem de
    // `zonedToUtc` existe justamente para casos assim.
    const verao = zonedToUtc('2026-07-01', 12 * 60, 'America/New_York');
    const inverno = zonedToUtc('2026-01-15', 12 * 60, 'America/New_York');
    expect(verao.toISOString()).toBe('2026-07-01T16:00:00.000Z');
    expect(inverno.toISOString()).toBe('2026-01-15T17:00:00.000Z');
  });

  it('calcula o dia da semana sem depender de fuso', () => {
    // 2026-03-12 é uma quinta-feira.
    expect(isoDateWeekday('2026-03-12')).toBe(4);
    expect(isoDateWeekday('2026-03-15')).toBe(0);
  });

  it('soma dias atravessando a virada de mês e de ano', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('converte entre rótulo e minutos', () => {
    expect(minutesToLabel(0)).toBe('00:00');
    expect(minutesToLabel(8 * 60 + 5)).toBe('08:05');
    expect(labelToMinutes('14:30')).toBe(870);
    expect(labelToMinutes('24:00')).toBeNull();
    expect(labelToMinutes('8:00')).toBeNull();
  });
});
