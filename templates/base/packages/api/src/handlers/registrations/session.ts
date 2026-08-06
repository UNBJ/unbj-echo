import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getFirebase } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { ok, tooManyRequests } from '../../lib/response'
import { isRateLimitExceeded } from '../../lib/rate-limit'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const registration = await verifyRegistrantToken(event)
  if (!registration) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }
  if (await isRateLimitExceeded(event, { scope: 'portal-session', key: registration.id, max: 10, windowSeconds: 3600 })) {
    return tooManyRequests()
  }

  try {
    const customToken = await getFirebase().auth().createCustomToken(registration.id, {
      portal_access: true,
    })
    return ok({ customToken, votedPolls: registration.votedPolls ?? [] })
  } catch (err) {
    console.error('portal-session error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo iniciar la sesión en tiempo real' }) }
  }
}
