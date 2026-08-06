import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { getSignedUploadUrl } from '../../lib/storage'
import { ok, badRequest, notFound, serverError, tooManyRequests } from '../../lib/response'
import { isRateLimitExceeded } from '../../lib/rate-limit'
import type { Registration } from '@unbj/shared'

const schema = z.object({
  token: z.string().min(1),
  fileName: z.string().min(1).max(200),
  contentType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

  const { token, fileName, contentType } = parsed.data
  if (await isRateLimitExceeded(event, { scope: 'carta-upload', max: 10, windowSeconds: 3600 })) {
    return tooManyRequests()
  }
  const db = getDb()

  try {
    const snap = await db.collection('registrations').where('token', '==', token).limit(1).get()
    if (snap.empty) return notFound('Registro no encontrado')

    const reg = snap.docs[0]?.data() as Registration
    const docRef = snap.docs[0]!.ref

    if (!['carta_pending', 'carta_rejected', 'payment_approved'].includes(reg.status)) {
      return badRequest('El registro no está en estado de carta pendiente')
    }

    const ext = contentType === 'application/pdf' ? 'pdf' : contentType === 'image/jpeg' ? 'jpg' : 'png'
    const filePath = `cartas/${reg.id}/carta.${ext}`
    const uploadUrl = await getSignedUploadUrl(filePath, contentType)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await docRef.update({
      cartaUploadPath: filePath,
      cartaUploadExpiresAt: expiresAt,
      updatedAt: new Date().toISOString(),
    })

    return ok({ uploadUrl, expiresAt })
  } catch (err) {
    console.error('carta-upload-url error:', err)
    return serverError()
  }
}
