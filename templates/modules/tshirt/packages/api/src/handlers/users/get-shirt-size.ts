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
    if (!flags.tshirtEnabled) {
      return forbidden('La seleccion de playera esta deshabilitada temporalmente.')
    }

    const configSnap = await db.collection('config').doc('global').get()
    const config = configSnap.data()
    const standardPrice = config?.standardPrice ?? 0

    // Validar si puede seleccionar (requiere pago aprobado)
    const allowedStatuses = ['payment_approved', 'fully_approved', 'checked_in']
    const hasPaid = allowedStatuses.includes(reg.status)
    const pendingBalance = reg.status === 'pending_payment' || reg.status === 'payment_submitted' ? standardPrice : 0

    return ok({
      canSelect: hasPaid,
      shirtSize: reg.tshirtSize || null,
      pendingBalance,
    })
  } catch (err) {
    console.error('get-shirt-size error:', err)
    return serverError()
  }
}
