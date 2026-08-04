import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, badRequest, notFound, serverError } from '../../lib/response'
import type { DelegateType } from '@plenarias/shared'

const schema = z.object({
  delegateType: z.enum(['mensajero_acreditado', 'fraternal']),
})

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

    await ref.update({
      delegateType: parsed.data.delegateType as DelegateType,
      updatedAt: new Date().toISOString(),
    })

    return ok({ success: true })
  } catch (err) {
    console.error('update-delegate-type error:', err)
    return serverError()
  }
}
