import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, badRequest, notFound, serverError } from '../../lib/response'
import { generateAndSaveNomination } from '../../lib/nomination'
import type { Registration, RegistrationStatus } from '@unbj/shared'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.string().min(1) }),
])

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  const id = event.pathParameters?.['id']
  if (!id) return notFound()

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  const db = getDb()
  const ref = db.collection('registrations').doc(id)

  try {
    const snap = await ref.get()
    if (!snap.exists) return notFound('Registro no encontrado')

    const reg = snap.data() as Registration

    if (reg.status !== 'carta_submitted') {
      return badRequest('La carta no está en revisión')
    }

    const now = new Date().toISOString()

    if (parsed.data.action === 'approve') {
      await ref.update({
        cartaApprovedAt: now,
        cartaApprovedBy: admin.email,
        updatedAt: now,
      })

      // Genera PDF y actualiza a fully_approved (puede tardar segundos)
      await generateAndSaveNomination(db, ref, reg)
    } else {
      await ref.update({
        status: 'carta_rejected' as RegistrationStatus,
        cartaRejectedReason: parsed.data.reason,
        updatedAt: now,
      })
    }

    return ok({ success: true })
  } catch (err) {
    console.error('update-carta error:', err)
    return serverError()
  }
}
