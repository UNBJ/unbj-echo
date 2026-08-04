import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { getSignedReadUrl } from '../../lib/storage'
import { ok, badRequest, notFound, serverError } from '../../lib/response'
import type { Registration, RegistrationStatus } from '@unbj/shared'

const schema = z.object({
  token: z.string().min(1),
  filePath: z.string().min(1),
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

  const { token, filePath, fileName } = parsed.data
  const db = getDb()

  try {
    const snap = await db.collection('registrations').where('token', '==', token).limit(1).get()
    if (snap.empty) return notFound('Registro no encontrado')

    const reg = snap.docs[0]?.data() as Registration
    const docRef = snap.docs[0]!.ref

    if (!['carta_pending', 'carta_rejected', 'payment_approved'].includes(reg.status)) {
      return badRequest('El registro no está en estado de carta pendiente')
    }

    // URL firmada de lectura (7 días) para que el admin pueda verla
    const cartaFileUrl = await getSignedReadUrl(filePath)

    await docRef.update({
      status: 'carta_submitted' as RegistrationStatus,
      cartaFileUrl,
      cartaFilePath: filePath,
      cartaFileName: fileName,
      cartaSubmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return ok({ success: true })
  } catch (err) {
    console.error('carta-submit error:', err)
    return serverError()
  }
}
