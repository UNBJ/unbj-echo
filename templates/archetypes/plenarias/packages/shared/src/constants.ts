export const DEFAULT_MENSAJERO_QUOTA = 5

export const DELEGATE_TYPE_LABELS: Record<string, string> = {
  mensajero_acreditado: 'Mensajero Acreditado',
  fraternal: 'Fraternal',
}

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pago pendiente',
  payment_submitted: 'Pago en proceso',
  payment_approved: 'Pago aprobado',
  payment_rejected: 'Pago rechazado',
  carta_pending: 'Carta pendiente',
  carta_submitted: 'Carta en revisión',
  carta_rejected: 'Carta rechazada',
  fully_approved: 'Totalmente aprobado',
  checked_in: 'Presente',
  pending_onsite_payment: 'Pago en sitio pendiente',
}
