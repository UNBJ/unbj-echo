import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, badRequest, serverError } from '../../lib/response'

const updateSchema = z.object({
  price: z.number().int().positive().optional(),
  registrationOpen: z.boolean().optional(),
  cashPaymentEnabled: z.boolean().optional(),
  registrationDeadline: z.string().optional(),
  paymentDeadline: z.string().optional(),
  cartaDeadline: z.string().optional(),
  contactPhone: z.string().optional(),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  const db = getDb()
  const ref = db.collection('config').doc('global')

  if (event.requestContext.http.method === 'GET') {
    try {
      const snap = await ref.get()
      return ok(snap.data() ?? {})
    } catch (err) {
      console.error('config GET error:', err)
      return serverError()
    }
  }

  // PATCH — solo super_admin puede modificar config
  if (admin.role !== 'super_admin') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Se requiere rol super_admin' }) }
  }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    await ref.set(
      { ...parsed.data, updatedAt: new Date().toISOString(), updatedBy: admin.email },
      { merge: true }
    )
    const snap = await ref.get()
    return ok(snap.data())
  } catch (err) {
    console.error('config PATCH error:', err)
    return serverError()
  }
}
