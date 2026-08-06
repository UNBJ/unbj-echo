import type { RegistrationStatus, DelegateType, PaymentMethod } from '@unbj/shared'

export const STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending_payment: 'Pendiente de pago',
  payment_submitted: 'Pago en proceso',
  payment_approved: 'Pago aprobado',
  payment_rejected: 'Pago rechazado',
  carta_pending: 'Carta pendiente',
  carta_submitted: 'Carta enviada',
  carta_rejected: 'Carta rechazada',
  fully_approved: 'Aprobado',
  checked_in: 'Check-in realizado',
  pending_onsite_payment: 'Pago en sitio pendiente',
}

export const STATUS_COLORS: Record<RegistrationStatus, string> = {
  pending_payment: 'bg-warning/10 text-warning',
  payment_submitted: 'bg-accent/10 text-accent',
  payment_approved: 'bg-success/10 text-success',
  payment_rejected: 'bg-error/10 text-error',
  carta_pending: 'bg-warning/10 text-warning',
  carta_submitted: 'bg-accent/10 text-accent',
  carta_rejected: 'bg-error/10 text-error',
  fully_approved: 'bg-success/10 text-success',
  checked_in: 'bg-success/10 text-success',
  pending_onsite_payment: 'bg-bg-subtle text-text-secondary',
}

export const DELEGATE_LABELS: Record<DelegateType, string> = {
  mensajero_acreditado: 'Mensajero',
  fraternal: 'Fraternal',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Tarjeta',
  oxxo: 'OXXO',
  google_pay: 'Google Pay',
  apple_pay: 'Apple Pay',
  cash: 'Efectivo',
}
