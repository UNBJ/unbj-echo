import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { ok, badRequest, notFound, serverError } from '../../lib/response'

const schema = z.object({
  roomCode: z.string().min(6).max(10),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const reg = await verifyRegistrantToken(event)
  if (!reg) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Código de cuarto inválido.')
  }

  const { roomCode } = parsed.data
  const db = getDb()

  try {
    const allowedStatuses = ['payment_approved', 'fully_approved', 'checked_in']
    if (!allowedStatuses.includes(reg.status)) {
      return badRequest('Debes liquidar tu pago de inscripción antes de solicitar unirte a una habitación.')
    }

    if (reg.roomId) {
      return badRequest('Ya formas parte de una habitación actualmente. Debes salir de ella primero.')
    }

    const roomSnap = await db.collection('rooms').doc(roomCode).get()
    if (!roomSnap.exists) {
      return notFound('No se encontró ninguna habitación con el código proporcionado.')
    }

    const room = roomSnap.data()
    if (room?.status === 'full' || (room?.enrolledUsers?.length >= room?.capacity)) {
      return badRequest('La habitación seleccionada ya está llena.')
    }

    // Buscar si ya existe una solicitud pendiente de este usuario para esta habitación
    const existingReqSnap = await db
      .collection('room_requests')
      .where('userId', '==', reg.id)
      .where('roomId', '==', roomCode)
      .where('status', '==', 'pending')
      .get()

    if (!existingReqSnap.empty) {
      return badRequest('Ya has enviado una solicitud de ingreso a esta habitación que está pendiente de aprobación.')
    }

    // Crear solicitud de unión
    const requestRef = db.collection('room_requests').doc()
    const requestPayload = {
      id: requestRef.id,
      roomId: roomCode,
      roomName: room?.name,
      userId: reg.id,
      userName: reg.fullName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    await requestRef.set(requestPayload)

    return ok({
      success: true,
      message: 'Solicitud enviada al responsable de la habitación.',
    })
  } catch (err) {
    console.error('join-room error:', err)
    return serverError()
  }
}
