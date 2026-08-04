import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, forbidden, serverError } from '../../lib/response'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) }
  }

  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.votingEnabled) {
      return forbidden('La votacion esta deshabilitada temporalmente.')
    }

    const listSnap = await db
      .collection('polls')
      .where('id', '!=', 'active') // Omitir el documento de control activo
      .get()

    const polls = listSnap.docs
      .map((doc) => doc.data())
      .filter((p) => p.proposalId) // Filtrar por si acaso

    return ok({
      polls,
    })
  } catch (err) {
    console.error('admin-list-polls error:', err)
    return serverError()
  }
}
