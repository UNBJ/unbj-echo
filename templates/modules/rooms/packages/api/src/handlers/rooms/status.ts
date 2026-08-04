import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, forbidden, serverError } from '../../lib/response'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const reg = await verifyRegistrantToken(event)
  if (!reg) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }

  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.roomsEnabled) {
      return forbidden('La gestion de habitaciones esta deshabilitada temporalmente.')
    }

    const allowedStatuses = ['payment_approved', 'fully_approved', 'checked_in']
    const hasPaid = allowedStatuses.includes(reg.status)

    let roomData = null
    let pendingRequest = null

    // 1. Si el usuario ya está asignado a un cuarto
    if (reg.roomId) {
      const roomSnap = await db.collection('rooms').doc(reg.roomId).get()
      if (roomSnap.exists) {
        roomData = roomSnap.data()
      }
    }

    // 2. Si no tiene cuarto, buscar si tiene solicitudes pendientes para unirse a algún cuarto
    if (!roomData) {
      const reqSnap = await db
        .collection('room_requests')
        .where('userId', '==', reg.id)
        .where('status', '==', 'pending')
        .limit(1)
        .get()

      if (!reqSnap.empty) {
        pendingRequest = reqSnap.docs[0]?.data()
      }
    }

    return ok({
      canSelect: hasPaid,
      hasRoom: !!roomData,
      room: roomData,
      pendingRequest,
    })
  } catch (err) {
    console.error('get-room-status error:', err)
    return serverError()
  }
}
