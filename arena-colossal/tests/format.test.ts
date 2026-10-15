import { describe, expect, it } from 'vitest';

import { buildIcs } from '@/lib/utils/ics';
import {
  formatDuration,
  formatIsoDateLong,
  maskPhoneBR,
  toE164BR,
} from '@/lib/utils/format';

describe('formatação', () => {
  it('aplica a máscara de telefone progressivamente', () => {
    expect(maskPhoneBR('47')).toBe('47');
    expect(maskPhoneBR('4799')).toBe('(47) 99');
    expect(maskPhoneBR('4733334444')).toBe('(47) 3333-4444');
    expect(maskPhoneBR('47991234567')).toBe('(47) 99123-4567');
    // Não deixa passar do tamanho máximo, mesmo colando texto grande.
    expect(maskPhoneBR('479912345678999')).toBe('(47) 99123-4567');
  });

  it('normaliza telefone para E.164 ou recusa', () => {
    expect(toE164BR('(47) 99123-4567')).toBe('5547991234567');
    expect(toE164BR('+55 47 99123 4567')).toBe('5547991234567');
    expect(toE164BR('991234567')).toBeNull();
  });

  it('formata duração em linguagem de gente', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h30');
    expect(formatDuration(480)).toBe('8h');
  });

  it('formata a data civil sem escorregar de dia por causa do fuso', () => {
    // Datas civis são "a data da Arena": não podem ser reinterpretadas no fuso
    // do navegador de quem acessa de outro lugar.
    expect(formatIsoDateLong('2026-03-12')).toContain('12');
    expect(formatIsoDateLong('2026-01-01')).toContain('1');
  });
});

describe('arquivo de calendário (.ics)', () => {
  const ics = buildIcs({
    uid: 'abc123',
    title: 'Arena Colossal — Polimento; Técnico',
    description: 'Cliente: João\nVeículo: BMW, 320i',
    location: 'Rua X, 100',
    startsAt: '2026-03-11T13:00:00.000Z',
    endsAt: '2026-03-11T21:00:00.000Z',
  });

  it('gera um calendário válido', () => {
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('UID:abc123@arenacolossal');
    expect(ics.split('\r\n').length).toBeGreaterThan(10);
  });

  it('converte os instantes para o formato do RFC 5545', () => {
    expect(ics).toContain('DTSTART:20260311T130000Z');
    expect(ics).toContain('DTEND:20260311T210000Z');
  });

  it('escapa vírgula, ponto e vírgula e quebra de linha', () => {
    // `String.raw` porque o esperado é a CONTRABARRA literal: escrita como
    // escape comum, o JavaScript a consumiria antes da comparação.
    // Sem escapar, um ponto e vírgula no título quebra o parser do calendário.
    expect(ics).toContain(String.raw`SUMMARY:Arena Colossal — Polimento\; Técnico`);
    expect(ics).toContain(String.raw`\nVeículo: BMW\, 320i`);
    expect(ics).toContain(String.raw`LOCATION:Rua X\, 100`);
  });
});
