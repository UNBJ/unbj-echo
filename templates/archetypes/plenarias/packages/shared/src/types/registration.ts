export type DelegateType = 'mensajero_acreditado' | 'fraternal'

export type RegistrationStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_approved'
  | 'payment_rejected'
  | 'carta_pending'
  | 'carta_submitted'
  | 'carta_rejected'
  | 'fully_approved'
  | 'checked_in'
  | 'pending_onsite_payment'

export type PaymentMethod = 'card' | 'oxxo' | 'google_pay' | 'apple_pay' | 'cash'

export interface Convention {
  id: string
  name: string
  code: string
}

export interface Church {
  id: string
  name: string
  code: string | null
  conventionId: string
}

export interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea'
  required: boolean
  options?: string[]
  isBase: boolean
  order: number
}

export interface Registration {
  id: string
  token: string
  status: RegistrationStatus
  delegateType?: DelegateType | null

  // Datos personales
  fullName: string
  email: string
  phone: string
  birthDate: string
  age: number
  extraFields: Record<string, string>

  // Iglesia
  churchId: string
  churchName: string
  churchCode: string | null
  churchNotListed?: boolean
  churchNotListedName?: string
  // Convención
  conventionId: string
  conventionName: string
  conventionCode: string
  conventionNotListed?: boolean
  conventionNotListedName?: string

  // Pago
  paymentMethod?: PaymentMethod
  paymentAmount?: number
  stripePaymentIntentId?: string
  stripeOxxoVoucherUrl?: string
  stripeOxxoExpiresAt?: string
  paymentRejectedReason?: string
  paymentApprovedAt?: string
  paymentApprovedBy?: string

  // Carta (solo mensajero)
  cartaFileUrl?: string
  cartaFileName?: string
  cartaSubmittedAt?: string
  cartaRejectedReason?: string
  cartaApprovedAt?: string
  cartaApprovedBy?: string

  // Nombramiento
  nominationPdfUrl?: string
  nominationGeneratedAt?: string

  // Check-in
  checkedInAt?: string
  checkedInBy?: string

  // QR
  qrToken: string

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CheckInResult {
  status: 'valid' | 'already_scanned' | 'invalid' | 'offline'
  registration?: Pick<
    Registration,
    'fullName' | 'churchName' | 'delegateType' | 'checkedInAt' | 'checkedInBy'
  >
}
