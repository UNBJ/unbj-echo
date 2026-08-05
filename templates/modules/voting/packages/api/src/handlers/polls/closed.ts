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
    if (!flags.votingEnabled) {
      return forbidden('La votacion esta deshabilitada temporalmente.')
    }

    const snapshot = await db.collection('polls').where('status', '==', 'closed').get()
    const polls = snapshot.docs
      .filter((doc) => doc.id !== 'active')
      .map((doc) => doc.data())
      .filter((poll) => poll.proposalId)
      .map((poll) => {
        const results = poll.results || {}
        const totalVotes = Object.values(results).reduce((total: number, value: unknown) => {
          return total + (typeof value === 'number' ? value : 0)
        }, 0)

        return {
          proposalId: poll.proposalId,
          title: poll.title,
          description: poll.description || '',
          options: poll.options || [],
          results,
          totalVotes,
          closedAt: poll.closedAt || poll.updatedAt || poll.createdAt || null,
        }
      })
      .sort((a, b) => String(b.closedAt || '').localeCompare(String(a.closedAt || '')))

    return ok({ polls })
  } catch (err) {
    console.error('get-closed-polls error:', err)
    return serverError()
  }
}
