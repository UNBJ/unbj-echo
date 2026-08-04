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
  pending_payment: 'bg-yellow-100 text-yellow-800',
  payment_submitted: 'bg-blue-100 text-blue-800',
  payment_approved: 'bg-green-100 text-green-800',
  payment_rejected: 'bg-red-100 text-red-800',
  carta_pending: 'bg-orange-100 text-orange-800',
  carta_submitted: 'bg-blue-100 text-blue-800',
  carta_rejected: 'bg-red-100 text-red-800',
  fully_approved: 'bg-green-100 text-green-800',
  checked_in: 'bg-emerald-100 text-emerald-800',
  pending_onsite_payment: 'bg-purple-100 text-purple-800',
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
