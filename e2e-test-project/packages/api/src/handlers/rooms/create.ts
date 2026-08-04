import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { ok, badRequest, serverError } from '../../lib/response'

const schema = z.object({
  type: z.enum(['single', 'double', 'triple', 'quadruple']),
  gender: z.enum(['M', 'F', 'mixed']),
  name: z.string().max(50).optional(),
})

// Función para generar un código único de cuarto tipo "H3K-98P"
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 3; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${part1}-${part2}`
}

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
    return badRequest('Datos de entrada inválidos. Revisa el tipo y género del cuarto.')
  }

  const { type, gender, name } = parsed.data
  const db = getDb()

  try {
    const allowedStatuses = ['payment_approved', 'fully_approved', 'checked_in']
    if (!allowedStatuses.includes(reg.status)) {
      return badRequest('Debes completar tu pago de inscripción antes de crear una habitación.')
    }

    const roomCode = generateRoomCode()
    const now = new Date().toISOString()
    const capacityMap = { single: 1, double: 2, triple: 3, quadruple: 4 }
    const capacity = capacityMap[type]

    const roomRef = db.collection('rooms').doc(roomCode)
    const userRef = db.collection('registrations').doc(reg.id)

    await db.runTransaction(async (transaction) => {
      // 1. Validar que el usuario no tenga cuarto ya asignado
      const userDoc = await transaction.get(userRef)
      const userData = userDoc.data()
      if (userData?.roomId) {
        throw new Error('Ya formas parte de otra habitación.')
      }

      // 2. Crear documento de la habitación
      const roomPayload = {
        id: roomCode,
        name: name || `Habitación de ${reg.fullName.split(' ')[0]}`,
        type,
        capacity,
        gender,
        responsibleUserId: reg.id,
        enrolledUsers: [
          {
            userId: reg.id,
            name: reg.fullName,
            joinedAt: now,
          },
        ],
        status: capacity === 1 ? 'full' : 'open',
        createdAt: now,
        updatedAt: now,
      }

      transaction.set(roomRef, roomPayload)

      // 3. Vincular al usuario responsable con el cuarto
      transaction.update(userRef, {
        roomId: roomCode,
        roomRole: 'responsible',
        updatedAt: now,
      })
    })

    return ok({
      success: true,
      roomCode,
    })
  } catch (err: any) {
    console.error('create-room error:', err)
    return badRequest(err.message || 'Error al crear la habitación')
  }
}
