import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyRegistrantToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, badRequest, forbidden, serverError } from '../../lib/response'

const schema = z.object({
  shirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const reg = await verifyRegistrantToken(event)
  if (!reg) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado o token expirado' }) }
  }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Talla de playera inválida. Opciones: XS, S, M, L, XL, XXL, 3XL')
  }

  const { shirtSize } = parsed.data
  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.tshirtEnabled) {
      return forbidden('La seleccion de playera esta deshabilitada temporalmente.')
    }

    const regRef = db.collection('registrations').doc(reg.id)

    // Validar si ya seleccionó
    if (reg.tshirtSize) {
      return badRequest('Ya has seleccionado tu talla de playera anteriormente.')
    }

    // Validar si ya pagó
    const allowedStatuses = ['payment_approved', 'fully_approved', 'checked_in']
    if (!allowedStatuses.includes(reg.status)) {
      return badRequest('Debes completar el pago de tu inscripción antes de seleccionar tu talla.')
    }

    await regRef.update({
      tshirtSize: shirtSize,
      tshirtSelectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return ok({
      success: true,
      shirtSize,
    })
  } catch (err) {
    console.error('select-shirt-size error:', err)
    return serverError()
  }
}
