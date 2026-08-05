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

    const activeSnap = await db.collection('polls').doc('active').get()
    
    if (!activeSnap.exists) {
      return ok({ activePoll: null, hasVoted: false })
    }

    const poll = activeSnap.data()
    if (!poll || poll.status !== 'active') {
      return ok({ activePoll: null, hasVoted: false })
    }

    // Comprobar si el participante ya votó en esta propuesta
    const votedPolls = reg.votedPolls || []
    const hasVoted = votedPolls.includes(poll.proposalId)

    const safePoll = {
      proposalId: poll.proposalId,
      title: poll.title,
      description: poll.description || '',
      options: poll.options || [],
      chartType: poll.chartType || 'BAR',
      targetRole: poll.targetRole || 'all',
    }

    return ok({
      activePoll: safePoll,
      hasVoted,
    })
  } catch (err) {
    console.error('get-active-poll error:', err)
    return serverError()
  }
}
