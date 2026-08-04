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

  if (!reg.roomId) {
    return badRequest('No formas parte de ninguna habitación.')
  }

  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.roomsEnabled) {
      return forbidden('La gestion de habitaciones esta deshabilitada temporalmente.')
    }

    const roomRef = db.collection('rooms').doc(reg.roomId)
    const userRef = db.collection('registrations').doc(reg.id)

    await db.runTransaction(async (transaction) => {
      const roomDoc = await transaction.get(roomRef)
      if (!roomDoc.exists) {
        // Si el cuarto no existe, solo desvincular al usuario
        transaction.update(userRef, { roomId: null, roomRole: null, updatedAt: new Date().toISOString() })
        return
      }

      const room = roomDoc.data()
      const enrolledUsers = room?.enrolledUsers || []
      const remainingUsers = enrolledUsers.filter((u: any) => u.userId !== reg.id)

      if (reg.roomRole === 'responsible') {
        if (remainingUsers.length === 0) {
          // El responsable es el único en la habitación -> Eliminar habitación
          transaction.delete(roomRef)
          
          // También cancelar solicitudes pendientes para este cuarto
          const reqs = await db.collection('room_requests').where('roomId', '==', reg.roomId).where('status', '==', 'pending').get()
          for (const reqDoc of reqs.docs) {
            transaction.update(reqDoc.ref, { status: 'rejected', updatedAt: new Date().toISOString() })
          }
        } else {
          // Transferir rol de responsable al primer miembro restante
          const nextResponsible = remainingUsers[0]
          const nextUserRef = db.collection('registrations').doc(nextResponsible.userId)

          transaction.update(roomRef, {
            responsibleUserId: nextResponsible.userId,
            enrolledUsers: remainingUsers,
            status: 'open',
            updatedAt: new Date().toISOString(),
          })

          transaction.update(nextUserRef, {
            roomRole: 'responsible',
            updatedAt: new Date().toISOString(),
          })
        }
      } else {
        // Miembro normal -> Simplemente remover del cuarto
        transaction.update(roomRef, {
          enrolledUsers: remainingUsers,
          status: 'open',
          updatedAt: new Date().toISOString(),
        })
      }

      // Desvincular al usuario que sale
      transaction.update(userRef, {
        roomId: null,
        roomRole: null,
        updatedAt: new Date().toISOString(),
      })
    })

    return ok({
      success: true,
      message: 'Has salido de la habitación correctamente.',
    })
  } catch (err: any) {
    console.error('leave-room error:', err)
    return badRequest(err.message || 'Error al salir de la habitación.')
  }
}
