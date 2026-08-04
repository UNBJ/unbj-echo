import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, badRequest, forbidden, notFound, serverError } from '../../lib/response'

const schema = z.object({
  action: z.enum(['activate', 'close']),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) }
  }

  const id = event.pathParameters?.['id']
  if (!id) return notFound('Falta el ID de la propuesta')

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Acción inválida. Usa "activate" o "close".')
  }

  const { action } = parsed.data
  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.votingEnabled) {
      return forbidden('La votacion esta deshabilitada temporalmente.')
    }

    const pollRef = db.collection('polls').doc(id)
    const activeRef = db.collection('polls').doc('active')

    await db.runTransaction(async (transaction) => {
      // 1. Obtener la propuesta seleccionada
      const pollSnap = await transaction.get(pollRef)
      if (!pollSnap.exists) {
        throw new Error('La propuesta de votación especificada no existe.')
      }

      const poll = pollSnap.data()

      if (action === 'activate') {
        // Validar si ya hay una propuesta activa
        const activeSnap = await transaction.get(activeRef)
        if (activeSnap.exists) {
          const activePoll = activeSnap.data()
          if (activePoll?.status === 'active') {
            throw new Error('Ya existe una propuesta de votación activa actualmente. Ciérrala antes de activar otra.')
          }
        }

        // Activar la propuesta seleccionada
        const updatedPoll = {
          ...poll,
          status: 'active',
          updatedAt: new Date().toISOString(),
        }

        transaction.update(pollRef, {
          status: 'active',
          updatedAt: new Date().toISOString(),
        })

        // Escribir en el documento de control activo
        transaction.set(activeRef, updatedPoll)
      } else {
        // Cerrar la propuesta activa
        const activeSnap = await transaction.get(activeRef)
        if (!activeSnap.exists) {
          throw new Error('No hay ninguna votación activa en curso.')
        }

        const activePoll = activeSnap.data()
        if (activePoll?.proposalId !== id) {
          throw new Error('La propuesta activa actual no coincide con la solicitada.')
        }

        // Obtener resultados finales
        const finalResults = activePoll?.results || {}

        // Guardar resultados e historial en la propuesta original
        transaction.update(pollRef, {
          status: 'closed',
          results: finalResults,
          updatedAt: new Date().toISOString(),
        })

        // Limpiar o cerrar el documento activo
        transaction.update(activeRef, {
          status: 'closed',
          updatedAt: new Date().toISOString(),
        })
      }
    })

    return ok({
      success: true,
      message: `Propuesta ${action === 'activate' ? 'activada' : 'cerrada'} exitosamente.`,
    })
  } catch (err: any) {
    console.error('admin-toggle-poll error:', err)
    return badRequest(err.message || 'Error al procesar la propuesta.')
  }
}
