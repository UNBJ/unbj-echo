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
    const portalLiveRef = db.collection('portal_live').doc('active')
    const portalResultsRef = db.collection('portal_results').doc(id)

    await db.runTransaction(async (transaction) => {
      // 1. Obtener la propuesta seleccionada
      const pollSnap = await transaction.get(pollRef)
      if (!pollSnap.exists) {
        throw new Error('La propuesta de votación especificada no existe.')
      }

      const poll = pollSnap.data() as Record<string, any>

      if (action === 'activate') {
        if (poll?.status !== 'draft') {
          throw new Error('Solo las propuestas en borrador pueden activarse. Las votaciones cerradas son definitivas.')
        }

        // Validar si ya hay una propuesta activa
        const activeSnap = await transaction.get(activeRef)
        if (activeSnap.exists) {
          const activePoll = activeSnap.data()
          if (activePoll?.status === 'active') {
            throw new Error('Ya existe una propuesta de votación activa actualmente. Ciérrala antes de activar otra.')
          }
        }

        // Activar la propuesta seleccionada
        const updatedPoll: Record<string, any> = {
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
        transaction.set(portalLiveRef, {
          proposalId: updatedPoll.proposalId,
          title: updatedPoll.title,
          description: updatedPoll.description || '',
          options: updatedPoll.options || [],
          status: 'active',
          activatedAt: updatedPoll.updatedAt,
        })
      } else {
        // Cerrar la propuesta activa
        const activeSnap = await transaction.get(activeRef)
        if (!activeSnap.exists) {
          throw new Error('No hay ninguna votación activa en curso.')
        }

        const activePoll = activeSnap.data() as Record<string, any>
        if (activePoll?.proposalId !== id) {
          throw new Error('La propuesta activa actual no coincide con la solicitada.')
        }

        // Obtener resultados finales
        const finalResults = activePoll?.results || {}
        const closedAt = new Date().toISOString()

        // Guardar resultados e historial en la propuesta original
        transaction.update(pollRef, {
          status: 'closed',
          results: finalResults,
          closedAt,
          updatedAt: closedAt,
        })

        // Limpiar o cerrar el documento activo
        transaction.update(activeRef, {
          status: 'closed',
          updatedAt: closedAt,
        })
        transaction.delete(portalLiveRef)
        transaction.set(portalResultsRef, {
          proposalId: poll.proposalId,
          title: poll.title,
          description: poll.description || '',
          options: poll.options || [],
          results: finalResults,
          closedAt,
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
