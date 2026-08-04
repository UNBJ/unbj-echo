import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, badRequest, forbidden, serverError } from '../../lib/response'

const schema = z.object({
  optionId: z.string(),
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
    return badRequest('ID de opción inválido.')
  }

  const { optionId } = parsed.data
  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.votingEnabled) {
      return forbidden('La votacion esta deshabilitada temporalmente.')
    }

    const activeRef = db.collection('polls').doc('active')
    const userRef = db.collection('registrations').doc(reg.id)

    await db.runTransaction(async (transaction) => {
      // 1. Obtener la propuesta activa
      const activeSnap = await transaction.get(activeRef)
      if (!activeSnap.exists) {
        throw new Error('No hay ninguna propuesta de votación activa en este momento.')
      }

      const poll = activeSnap.data()
      if (!poll || poll.status !== 'active') {
        throw new Error('La votación ya ha sido cerrada o no está activa.')
      }

      const proposalId = poll.proposalId

      // 2. Obtener el usuario y verificar si ya votó
      const userSnap = await transaction.get(userRef)
      const userData = userSnap.data()
      const votedPolls = userData?.votedPolls || []

      if (votedPolls.includes(proposalId)) {
        throw new Error('Ya has emitido tu voto para esta propuesta anteriormente.')
      }

      // Validar que la opción seleccionada exista en la propuesta
      const options = poll.options || []
      const optionExists = options.some((o: any) => o.id === optionId)
      if (!optionExists) {
        throw new Error('La opción seleccionada no es válida para esta propuesta.')
      }

      // 3. Incrementar el contador de votos de la opción seleccionada
      const results = poll.results || {}
      results[optionId] = (results[optionId] ?? 0) + 1

      transaction.update(activeRef, {
        results,
        updatedAt: new Date().toISOString(),
      })

      // 4. Registrar que el usuario ya votó en esta propuesta
      const updatedVoted = [...votedPolls, proposalId]
      transaction.update(userRef, {
        votedPolls: updatedVoted,
        updatedAt: new Date().toISOString(),
      })
    })

    return ok({
      success: true,
      message: 'Voto registrado exitosamente.',
    })
  } catch (err: any) {
    console.error('submit-vote error:', err)
    return badRequest(err.message || 'Error al registrar el voto.')
  }
}
