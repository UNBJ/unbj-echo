import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { serverError } from '../../lib/response'
import type { Registration } from '@plenarias/shared'

const STATUS_LABELS: Record<string, string> = {
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

function escapeCsv(val: unknown): string {
  const str = val === undefined || val === null ? '' : String(val)
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  try {
    const db = getDb()
    const snap = await db.collection('registrations').orderBy('createdAt', 'desc').get()
    const registrations = snap.docs.map((d) => d.data() as Registration)

    const headers = [
      'Nombre', 'Correo', 'Teléfono', 'Fecha de nacimiento', 'Edad',
      'Iglesia', 'Convención', 'Tipo de delegado', 'Estado',
      'Método de pago', 'Monto', 'Pago aprobado', 'Registro creado',
    ]

    const rows = registrations.map((r) => [
      escapeCsv(r.fullName),
      escapeCsv(r.email),
      escapeCsv(r.phone),
      escapeCsv(r.birthDate),
      escapeCsv(r.age),
      escapeCsv(r.churchName),
      escapeCsv(r.conventionName),
      escapeCsv(r.delegateType === 'mensajero_acreditado' ? 'Mensajero Acreditado' : r.delegateType === 'fraternal' ? 'Fraternal' : 'Sin asignar'),
      escapeCsv(STATUS_LABELS[r.status] ?? r.status),
      escapeCsv(r.paymentMethod ?? ''),
      escapeCsv(r.paymentAmount ?? ''),
      escapeCsv(r.paymentApprovedAt ?? ''),
      escapeCsv(r.createdAt),
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="registros-plenarias-2026.csv"',
        'Access-Control-Allow-Origin': '*',
      },
      body: csv,
    }
  } catch (err) {
    console.error('export error:', err)
    return serverError()
  }
}
