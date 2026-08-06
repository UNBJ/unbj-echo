import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { getFileMetadata } from '../../lib/storage'
import { ok, badRequest, notFound, serverError, tooManyRequests } from '../../lib/response'
import { isRateLimitExceeded } from '../../lib/rate-limit'
import type { Registration, RegistrationStatus } from '@unbj/shared'

const schema = z.object({
  token: z.string().min(1),
  fileName: z.string().min(1).max(200),
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

  const { token, fileName } = parsed.data
  if (await isRateLimitExceeded(event, { scope: 'carta-submit', max: 10, windowSeconds: 3600 })) {
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

    const filePath = reg.cartaUploadPath
    if (!filePath || !reg.cartaUploadExpiresAt || new Date(reg.cartaUploadExpiresAt).getTime() <= Date.now()) {
      return badRequest('La autorización de carga expiró. Solicita una nueva.')
    }
    if (!filePath.startsWith(`cartas/${reg.id}/`)) {
      return badRequest('Ruta de archivo inválida')
    }

    const metadata = await getFileMetadata(filePath)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (metadata.size <= 0 || metadata.size > 10 * 1024 * 1024 || !allowedTypes.includes(metadata.contentType)) {
      return badRequest('El archivo cargado no cumple con los requisitos permitidos')
    }

    await docRef.update({
      status: 'carta_submitted' as RegistrationStatus,
      cartaFilePath: filePath,
      cartaFileName: fileName,
      cartaUploadPath: null,
      cartaUploadExpiresAt: null,
      cartaSubmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return ok({ success: true })
  } catch (err) {
    console.error('carta-submit error:', err)
    return serverError()
  }
}
