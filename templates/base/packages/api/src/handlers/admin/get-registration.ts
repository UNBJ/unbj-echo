import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, notFound, serverError } from '../../lib/response'
import type { Registration } from '@unbj/shared'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const id = event.pathParameters?.['id']
  if (!id) return notFound()

  try {
    const db = getDb()
    const snap = await db.collection('registrations').doc(id).get()
    if (!snap.exists) return notFound('Registro no encontrado')

    const data = snap.data() as Registration
    const { qrToken: _q, ...registration } = data

    return ok({ registration })
  } catch (err) {
    console.error('get-registration error:', err)
    return serverError()
  }
}
