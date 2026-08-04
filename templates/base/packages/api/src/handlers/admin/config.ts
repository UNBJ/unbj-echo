import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, badRequest, serverError } from '../../lib/response'
import { featuresConfig } from '../../config/features'

const updateSchema = z.object({
  price: z.number().int().positive().optional(),
  registrationOpen: z.boolean().optional(),
  cashPaymentEnabled: z.boolean().optional(),
  registrationDeadline: z.string().optional(),
  paymentDeadline: z.string().optional(),
  cartaDeadline: z.string().optional(),
  contactPhone: z.string().optional(),
  tshirtEnabled: z.boolean().optional(),
  workshopsEnabled: z.boolean().optional(),
  roomsEnabled: z.boolean().optional(),
  votingEnabled: z.boolean().optional(),
  stripePaymentEnabled: z.boolean().optional(),
  oxxoPaymentEnabled: z.boolean().optional(),
})

const featureKeys = [
  'tshirtEnabled',
  'workshopsEnabled',
  'roomsEnabled',
  'votingEnabled',
  'stripePaymentEnabled',
  'oxxoPaymentEnabled',
] as const

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  const db = getDb()
  const globalRef = db.collection('config').doc('global')
  const featuresRef = db.collection('config').doc('features')

  if (event.requestContext.http.method === 'GET') {
    try {
      const [globalSnap, featuresSnap] = await Promise.all([globalRef.get(), featuresRef.get()])
      return ok({
        ...(globalSnap.data() ?? {}),
        ...featuresConfig,
        ...(featuresSnap.data() ?? {}),
      })
    } catch (err) {
      console.error('config GET error:', err)
      return serverError()
    }
  }

  // PATCH — solo super_admin puede modificar config
  if (admin.role !== 'super_admin') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Se requiere rol super_admin' }) }
  }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  try {
    const updatedAt = new Date().toISOString()
    const globalUpdates: Record<string, unknown> = {}
    const featureUpdates: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue
      if (featureKeys.includes(key as typeof featureKeys[number])) {
        featureUpdates[key] = value
      } else {
        globalUpdates[key] = value
      }
    }

    const writes: Promise<unknown>[] = []
    if (Object.keys(globalUpdates).length > 0) {
      writes.push(
        globalRef.set(
          { ...globalUpdates, updatedAt, updatedBy: admin.email },
          { merge: true }
        )
      )
    }
    if (Object.keys(featureUpdates).length > 0) {
      writes.push(
        featuresRef.set(
          { ...featureUpdates, updatedAt, updatedBy: admin.email },
          { merge: true }
        )
      )
    }
    await Promise.all(writes)

    const [globalSnap, featuresSnap] = await Promise.all([globalRef.get(), featuresRef.get()])
    return ok({
      ...(globalSnap.data() ?? {}),
      ...featuresConfig,
      ...(featuresSnap.data() ?? {}),
    })
  } catch (err) {
    console.error('config PATCH error:', err)
    return serverError()
  }
}
