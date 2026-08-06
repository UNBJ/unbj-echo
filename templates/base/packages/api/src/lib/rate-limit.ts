import { createHash } from 'node:crypto'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { getDb } from './firebase'

interface RateLimitOptions {
  scope: string
  max: number
  windowSeconds: number
  key?: string
}

export async function isRateLimitExceeded(
  event: APIGatewayProxyEventV2,
  { scope, max, windowSeconds, key }: RateLimitOptions
): Promise<boolean> {
  const source = key ?? event.requestContext.http.sourceIp ?? 'unknown'
  const id = createHash('sha256').update(`${scope}:${source}`).digest('hex')
  const ref = getDb().collection('rate_limits').doc(id)
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  return getDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref)
    const data = snap.data() as { count?: number; windowStartedAt?: number } | undefined
    const windowStartedAt = data?.windowStartedAt ?? 0
    const isNewWindow = now - windowStartedAt >= windowMs
    const count = isNewWindow ? 0 : (data?.count ?? 0)

    if (count >= max) return true

    transaction.set(ref, {
      count: count + 1,
      windowStartedAt: isNewWindow ? now : windowStartedAt,
      expiresAt: now + windowMs * 2,
      scope,
    }, { merge: true })
    return false
  })
}
