import type { Convention, Church, Registration } from '@unbj/shared'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = await res.json() as T & { error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
  return data
}

export async function getConventions(): Promise<Convention[]> {
  const res = await apiFetch<{ conventions: Convention[] }>('/conventions')
  return res.conventions
}

export async function searchChurches(params: { conventionId: string; query: string }): Promise<{ churches: Church[] }> {
  return apiFetch('/churches/search', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export interface CreateRegistrationInput {
  // Convención
  conventionId?: string
  conventionName?: string
  conventionCode?: string
  conventionNotListed?: boolean
  conventionNotListedName?: string
  // Iglesia
  churchId?: string
  churchName?: string
  churchCode?: string | null
  churchNotListed?: boolean
  churchNotListedName?: string
  // Entrada (Roles)
  ticketTier?: 'general' | 'student' | 'vip'
  // Datos personales
  fullName: string
  email: string
  phone: string
  birthDate: string
  extraFields?: Record<string, string>
}

export interface CreateRegistrationResult {
  token: string
  delegateType: 'mensajero_acreditado' | 'fraternal'
  registrationId: string
}

export async function createRegistration(input: CreateRegistrationInput): Promise<CreateRegistrationResult> {
  return apiFetch('/registrations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getRegistration(token: string): Promise<Omit<Registration, 'qrToken'>> {
  return apiFetch(`/registrations/${token}`)
}

export interface CreatePaymentIntentResult {
  clientSecret: string
  amount: number
  currency: string
}

export async function createPaymentIntent(token: string): Promise<CreatePaymentIntentResult> {
  return apiFetch('/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function submitCarta(token: string, filePath: string, fileName: string): Promise<void> {
  await apiFetch('/registrations/carta-submit', {
    method: 'POST',
    body: JSON.stringify({ token, filePath, fileName }),
  })
}
