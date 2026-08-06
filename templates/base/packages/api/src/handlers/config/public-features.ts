import type { APIGatewayProxyResultV2 } from 'aws-lambda'
import { getFeatureFlags } from '../../lib/features'
import { ok, serverError } from '../../lib/response'

export async function handler(): Promise<APIGatewayProxyResultV2> {
  try {
    // Las flags no contienen datos personales ni secretos. Se exponen por API
    // para que Firestore pueda permanecer cerrado a clientes web.
    return ok(await getFeatureFlags())
  } catch (err) {
    console.error('public-features error:', err)
    return serverError()
  }
}
