import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { ok, badRequest, notFound, serverError } from '../../lib/response'

const schema = z.object({
  requestId: z.string(),
  action: z.enum(['accept', 'reject']),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const reg = await verifyRegistrantToken(event)
  if (!reg) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }

  if (!reg.roomId || reg.roomRole !== 'responsible') {
    return badRequest('No tienes permisos de responsable de habitación para responder a solicitudes.')
  }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Datos de respuesta inválidos.')
  }

  const { requestId, action } = parsed.data
  const db = getDb()

  try {
    const requestRef = db.collection('room_requests').doc(requestId)
    const roomRef = db.collection('rooms').doc(reg.roomId)

    await db.runTransaction(async (transaction) => {
      // 1. Obtener la solicitud
      const reqDoc = await transaction.get(requestRef)
      if (!reqDoc.exists) {
        throw new Error('La solicitud especificada no existe.')
      }

      const reqData = reqDoc.data()
      if (reqData?.status !== 'pending') {
        throw new Error('Esta solicitud ya ha sido procesada anteriormente.')
      }

      if (reqData?.roomId !== reg.roomId) {
        throw new Error('No estás autorizado para gestionar esta solicitud.')
      }

      // 2. Obtener el cuarto
      const roomDoc = await transaction.get(roomRef)
      if (!roomDoc.exists) {
        throw new Error('La habitación especificada no existe.')
      }

      const roomData = roomDoc.data()
      const enrolledUsers = roomData?.enrolledUsers || []
      const capacity = roomData?.capacity || 0

      if (action === 'accept') {
        // Validar cupo
        if (enrolledUsers.length >= capacity) {
          throw new Error('La habitación ya está llena. No puedes agregar más personas.')
        }

        const applicantRef = db.collection('registrations').doc(reqData.userId)
        const applicantDoc = await transaction.get(applicantRef)
        const applicantData = applicantDoc.data()

        // Validar que el aplicante no se haya metido a otra habitación mientras
        if (applicantData?.roomId) {
          transaction.update(requestRef, { status: 'rejected', updatedAt: new Date().toISOString() })
          throw new Error('El participante ya se ha unido a otra habitación.')
        }

        // Agregar al participante al cuarto
        const updatedEnrolled = [
          ...enrolledUsers,
          {
            userId: reqData.userId,
            name: reqData.userName,
            joinedAt: new Date().toISOString(),
          },
        ]

        transaction.update(roomRef, {
          enrolledUsers: updatedEnrolled,
          status: updatedEnrolled.length >= capacity ? 'full' : 'open',
          updatedAt: new Date().toISOString(),
        })

        // Vincular al aplicante con el cuarto
        transaction.update(applicantRef, {
          roomId: reg.roomId,
          roomRole: 'member',
          updatedAt: new Date().toISOString(),
        })

        // Marcar solicitud como aceptada
        transaction.update(requestRef, {
          status: 'accepted',
          updatedAt: new Date().toISOString(),
        })
      } else {
        // Rechazar solicitud
        transaction.update(requestRef, {
          status: 'rejected',
          updatedAt: new Date().toISOString(),
        })
      }
    })

    return ok({
      success: true,
      message: `Solicitud ${action === 'accept' ? 'aceptada' : 'rechazada'} con éxito.`,
    })
  } catch (err: any) {
    console.error('respond-room-request error:', err)
    return badRequest(err.message || 'Error al procesar la solicitud.')
  }
}
