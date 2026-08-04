export type AdminRole = 'admin' | 'super_admin'

export interface Admin {
  uid: string
  email: string
  name: string
  role: AdminRole
  active: boolean
  createdAt: string
}

export interface GlobalConfig {
  price: number
  registrationDeadline: string
  paymentDeadline: string
  cartaDeadline: string
  registrationOpen: boolean
  cashPaymentEnabled: boolean
  contactPhone: string
  formFields: import('./registration').FormField[]
}

export interface ChurchException {
  churchId: string
  churchName: string
  extraQuota: number
  reason: string
  createdBy: string
  createdAt: string
}
