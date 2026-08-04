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

    const activeSnap = await db.collection('polls').doc('active').get()
    const listSnap = await db.collection('polls').get()

    const polls = listSnap.docs
      .filter((doc) => doc.id !== 'active')
      .map((doc) => doc.data())
      .filter((p) => p.proposalId) // Filtrar por si acaso

    return ok({
      polls,
      activePoll: activeSnap.exists ? activeSnap.data() : null,
    })
  } catch (err) {
    console.error('admin-list-polls error:', err)
    return serverError()
  }
}
