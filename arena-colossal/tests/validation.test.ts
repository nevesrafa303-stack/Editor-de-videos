import { describe, expect, it } from 'vitest';

import { bookingRequestSchema, fieldErrors } from '@/lib/validation/booking';

/**
 * Esta é a fronteira de confiança do sistema: qualquer um pode postar qualquer
 * coisa em `/api/bookings`. O que passa daqui vai para o banco, para o Google
 * Calendar e para o WhatsApp da Arena.
 */
const VALIDO = {
  name: 'João da Silva',
  phone: '(47) 99123-4567',
  email: 'Joao@Example.COM ',
  vehicleBrand: 'BMW',
  vehicleModel: '320i',
  vehicleYear: '2021',
  serviceSlug: 'polimento-tecnico',
  date: '2026-03-11',
  time: '09:30',
  notes: '  Pintura com marcas  ',
  consent: true,
};

describe('validação do agendamento', () => {
  it('aceita e normaliza um pedido legítimo', () => {
    const r = bookingRequestSchema.safeParse(VALIDO);
    expect(r.success).toBe(true);
    if (!r.success) return;

    expect(r.data.phone).toBe('5547991234567'); // E.164, só dígitos
    expect(r.data.email).toBe('joao@example.com'); // minúsculas, sem espaços
    expect(r.data.notes).toBe('Pintura com marcas'); // espaços colapsados
    expect(r.data.vehicleYear).toBe(2021);
  });

  it('aceita telefone já em E.164 e fixo de 10 dígitos', () => {
    for (const [entrada, esperado] of [
      ['5547991234567', '5547991234567'],
      ['+55 47 99123-4567', '5547991234567'],
      ['4733334444', '554733334444'],
    ] as const) {
      const r = bookingRequestSchema.safeParse({ ...VALIDO, phone: entrada });
      expect(r.success, `falhou para ${entrada}`).toBe(true);
      if (r.success) expect(r.data.phone).toBe(esperado);
    }
  });

  it('recusa telefone sem DDD ou curto demais', () => {
    for (const ruim of ['99123456', '123', '', '99123-4567']) {
      expect(bookingRequestSchema.safeParse({ ...VALIDO, phone: ruim }).success).toBe(false);
    }
  });

  it('recusa serviço fora do catálogo', () => {
    const r = bookingRequestSchema.safeParse({ ...VALIDO, serviceSlug: 'lavagem-magica' });
    expect(r.success).toBe(false);
  });

  it('exige o consentimento — marcado, não apenas presente', () => {
    expect(bookingRequestSchema.safeParse({ ...VALIDO, consent: false }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...VALIDO, consent: 'sim' }).success).toBe(false);
  });

  it('derruba o pedido quando o honeypot vem preenchido', () => {
    const r = bookingRequestSchema.safeParse({ ...VALIDO, website: 'http://spam.example' });
    expect(r.success).toBe(false);
  });

  it('aceita ano e observações ausentes', () => {
    const { vehicleYear: _ano, notes: _obs, ...semOpcionais } = VALIDO;
    const r = bookingRequestSchema.safeParse(semOpcionais);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.vehicleYear).toBeNull();
      expect(r.data.notes).toBeNull();
    }
  });

  it('recusa ano fora de um intervalo plausível', () => {
    expect(bookingRequestSchema.safeParse({ ...VALIDO, vehicleYear: '1800' }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...VALIDO, vehicleYear: '2200' }).success).toBe(false);
  });

  it('remove caracteres de controle do texto livre', () => {
    const r = bookingRequestSchema.safeParse({
      ...VALIDO,
      name: 'João\u0000 da\u001f Silva',
      notes: 'linha1\nlinha2',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe('João da Silva');
      expect(r.data.notes).not.toContain('\n');
    }
  });

  it('corta observações muito longas em vez de recusar o agendamento', () => {
    const r = bookingRequestSchema.safeParse({ ...VALIDO, notes: 'a'.repeat(5000) });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toHaveLength(600);
  });

  it('recusa data e horário malformados', () => {
    expect(bookingRequestSchema.safeParse({ ...VALIDO, date: '11/03/2026' }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...VALIDO, time: '25:00' }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...VALIDO, time: '9:30' }).success).toBe(false);
  });

  it('devolve um erro por campo, na forma que o formulário consome', () => {
    const r = bookingRequestSchema.safeParse({ ...VALIDO, name: 'Jo', email: 'nao-e-email' });
    expect(r.success).toBe(false);
    if (r.success) return;

    const erros = fieldErrors(r.error);
    expect(Object.keys(erros)).toEqual(expect.arrayContaining(['name', 'email']));
    expect(erros.name).toBeTruthy();
  });
});
