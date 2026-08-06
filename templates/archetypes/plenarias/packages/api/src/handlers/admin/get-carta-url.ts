import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { getSignedReadUrl } from '../../lib/storage'
import { ok, badRequest, notFound, serverError } from '../../lib/response'
import type { Registration } from '@unbj/shared'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) }

  const id = event.pathParameters?.['id']
  if (!id) return notFound()

  try {
    const snap = await getDb().collection('registrations').doc(id).get()
    if (!snap.exists) return notFound('Registro no encontrado')

    const registration = snap.data() as Registration
    const filePath = registration.cartaFilePath
    if (!filePath || !filePath.startsWith(`cartas/${registration.id}/`)) {
      return badRequest('No hay una carta disponible para este registro')
    }

    const url = await getSignedReadUrl(filePath)
    return ok({ url })
  } catch (err) {
    console.error('get-carta-url error:', err)
    return serverError()
  }
}
