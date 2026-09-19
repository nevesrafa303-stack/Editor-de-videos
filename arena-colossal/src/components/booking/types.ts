import type { PublicBookingConfig } from '@/services/booking/schedule';

export type { PublicBookingConfig };

/** Estado do formulario, enquanto o cliente preenche. */
export type BookingDraft = {
  serviceSlug: string | null;
  date: string | null;
  time: string | null;
  name: string;
  phone: string;
  email: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  notes: string;
  consent: boolean;
  /** Honeypot — precisa ficar vazio. */
  website: string;
};

export const EMPTY_DRAFT: BookingDraft = {
  serviceSlug: null,
  date: null,
  time: null,
  name: '',
  phone: '',
  email: '',
  vehicleBrand: '',
  vehicleModel: '',
  vehicleYear: '',
  notes: '',
  consent: false,
  website: '',
};

/** Resumo devolvido pela API apos a criacao do agendamento. */
export type BookingConfirmation = {
  id: string;
  serviceName: string;
  serviceSlug: string;
  date: string;
  time: string;
  timeRange: string;
  vehicle: string;
  customerName: string;
  startsAt: string;
  endsAt: string;
};

export type SlotView = { time: string; available: boolean };

export type AvailabilityResponse = {
  ok: true;
  date: string;
  service: string;
  timezone: string;
  scheduleConfigured: boolean;
  degraded: boolean;
  slots: SlotView[];
};
