import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, badRequest, forbidden, serverError } from '../../lib/response'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const reg = await verifyRegistrantToken(event)
  if (!reg) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }

  if (!reg.roomId || reg.roomRole !== 'responsible') {
    return badRequest('No tienes permisos de responsable de habitación o no posees una.')
  }

  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.roomsEnabled) {
      return forbidden('La gestion de habitaciones esta deshabilitada temporalmente.')
    }

    const requestsSnap = await db
      .collection('room_requests')
      .where('roomId', '==', reg.roomId)
      .where('status', '==', 'pending')
      .get()

    const requests = requestsSnap.docs.map((doc) => doc.data())

    return ok({
      requests,
    })
  } catch (err) {
    console.error('list-room-requests error:', err)
    return serverError()
  }
}
