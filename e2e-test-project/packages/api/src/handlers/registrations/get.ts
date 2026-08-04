import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { ok, notFound, serverError } from '../../lib/response'
import type { Registration } from '@plenarias/shared'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const token = event.pathParameters?.['token']
  if (!token) return notFound()

  try {
    const db = getDb()
    const snap = await db
      .collection('registrations')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (snap.empty) return notFound('Registro no encontrado')

    const registration = snap.docs[0]?.data() as Registration

    // No exponer el qrToken en este endpoint público
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { qrToken, ...safeRegistration } = registration

    return ok(safeRegistration)
  } catch (err) {
    console.error('Get registration error:', err)
    return serverError()
  }
}
