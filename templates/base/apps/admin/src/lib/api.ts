import type { Registration, CheckInResult } from '@unbj/shared'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, options: RequestInit & { token: string }): Promise<T> {
  const { token, ...rest } = options
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...rest.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'API error')
  return data as T
}

export interface ListRegistrationsParams {
  status?: string
  delegateType?: string
  search?: string
  page?: number
}

export interface ListRegistrationsResponse {
  registrations: Omit<Registration, 'qrToken'>[]
  total: number
  page: number
  pageSize: number
}

export async function listRegistrations(
  token: string,
  params: ListRegistrationsParams = {}
): Promise<ListRegistrationsResponse> {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.delegateType) qs.set('delegateType', params.delegateType)
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', String(params.page))
  return apiFetch(`/admin/registrations?${qs}`, { token, method: 'GET' })
}

export async function getRegistrationDetail(
  token: string,
  id: string
): Promise<{ registration: Omit<Registration, 'qrToken'> }> {
  return apiFetch(`/admin/registrations/${id}`, { token, method: 'GET' })
}

export async function resendAccessLink(
  token: string,
  id: string
): Promise<{ success: true; recipient: string; sentAt: string }> {
  return apiFetch(`/admin/registrations/${id}/resend-access`, { token, method: 'POST' })
}

export async function approvePayment(token: string, id: string): Promise<void> {
  await apiFetch(`/admin/registrations/${id}/payment`, {
    token,
    method: 'PATCH',
    body: JSON.stringify({ action: 'approve' }),
  })
}

export async function rejectPayment(token: string, id: string, reason: string): Promise<void> {
  await apiFetch(`/admin/registrations/${id}/payment`, {
    token,
    method: 'PATCH',
    body: JSON.stringify({ action: 'reject', reason }),
  })
}

export async function approveCarta(token: string, id: string): Promise<void> {
  await apiFetch(`/admin/registrations/${id}/carta`, {
    token,
    method: 'PATCH',
    body: JSON.stringify({ action: 'approve' }),
  })
}

export async function rejectCarta(token: string, id: string, reason: string): Promise<void> {
  await apiFetch(`/admin/registrations/${id}/carta`, {
    token,
    method: 'PATCH',
    body: JSON.stringify({ action: 'reject', reason }),
  })
}

// --- Stats ---
export interface StatsResponse {
  total: number
  byStatus: Record<string, number>
  byDelegate: Record<string, number>
  byConvention: Record<string, number>
  topChurches: { name: string; count: number }[]
}

export async function getStats(token: string): Promise<StatsResponse> {
  return apiFetch('/admin/stats', { token, method: 'GET' })
}

export async function getExportUrl(token: string): Promise<string> {
  const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'
  return `${API_URL}/admin/export?_token=${encodeURIComponent(token)}`
}

// --- Config ---
export interface GlobalConfig {
  price?: number
  registrationOpen?: boolean
  cashPaymentEnabled?: boolean
  registrationDeadline?: string
  paymentDeadline?: string
  cartaDeadline?: string
  contactPhone?: string
  tshirtEnabled?: boolean
  workshopsEnabled?: boolean
  roomsEnabled?: boolean
  votingEnabled?: boolean
  stripePaymentEnabled?: boolean
  oxxoPaymentEnabled?: boolean
}

export async function getConfig(token: string): Promise<GlobalConfig> {
  return apiFetch('/admin/config', { token, method: 'GET' })
}

export async function updateConfig(token: string, data: GlobalConfig): Promise<GlobalConfig> {
  return apiFetch('/admin/config', { token, method: 'PATCH', body: JSON.stringify(data) })
}

// --- Excepciones ---
export interface ChurchException {
  churchId: string
  churchName: string
  extraQuota: number
  reason: string
  createdBy: string
  createdAt: string
}

export async function listExceptions(token: string): Promise<{ exceptions: ChurchException[] }> {
  return apiFetch('/admin/exceptions', { token, method: 'GET' })
}

export async function createException(
  token: string,
  data: Pick<ChurchException, 'churchId' | 'churchName' | 'extraQuota' | 'reason'>
): Promise<{ exception: ChurchException }> {
  return apiFetch('/admin/exceptions', { token, method: 'POST', body: JSON.stringify(data) })
}

export async function deleteException(token: string, churchId: string): Promise<void> {
  await apiFetch(`/admin/exceptions/${churchId}`, { token, method: 'DELETE' })
}

// --- Usuarios admin ---
export interface AdminUser {
  uid: string
  email: string
  name: string
  role: 'admin' | 'super_admin'
  disabled: boolean
  createdAt: string
}

export async function listUsers(token: string): Promise<{ users: AdminUser[] }> {
  return apiFetch('/admin/users', { token, method: 'GET' })
}

export async function createUser(
  token: string,
  data: { email: string; name: string; password: string; role: 'admin' | 'super_admin' }
): Promise<{ uid: string; email: string }> {
  return apiFetch('/admin/users', { token, method: 'POST', body: JSON.stringify(data) })
}

export async function deleteUser(token: string, uid: string): Promise<void> {
  await apiFetch(`/admin/users/${uid}`, { token, method: 'DELETE' })
}

// --- Check-in ---
export { type CheckInResult }

export async function checkIn(token: string, qrToken: string): Promise<CheckInResult> {
  return apiFetch('/admin/checkin', { token, method: 'POST', body: JSON.stringify({ qrToken }) })
}
