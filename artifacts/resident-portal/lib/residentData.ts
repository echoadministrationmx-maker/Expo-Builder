export type PaymentSummary = {
  estado: string;
  fecha_vencimiento: string;
};

export type RequestStatus = 'pendiente' | 'en_proceso' | 'resuelto';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseResidentDate(value: string): Date {
  return new Date(DATE_ONLY_PATTERN.test(value) ? `${value}T12:00:00` : value);
}

export function formatResidentDate(value: string): string {
  const date = parseResidentDate(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getNextPendingPayment<T extends PaymentSummary>(payments: T[]): T | undefined {
  let next: T | undefined;

  for (const payment of payments) {
    if (payment.estado !== 'pendiente') continue;
    if (
      !next ||
      parseResidentDate(payment.fecha_vencimiento).getTime() < parseResidentDate(next.fecha_vencimiento).getTime()
    ) {
      next = payment;
    }
  }

  return next;
}

export function normalizeRequestStatus(status: string | null): RequestStatus {
  const normalized = status?.trim().toLowerCase().replaceAll(' ', '_');

  if (normalized === 'en_proceso') return 'en_proceso';
  if (normalized === 'resuelto' || normalized === 'resuelta') return 'resuelto';
  return 'pendiente';
}

export function requestStatusLabel(status: RequestStatus): string {
  if (status === 'en_proceso') return 'En proceso';
  if (status === 'resuelto') return 'Resuelto';
  return 'Pendiente';
}
