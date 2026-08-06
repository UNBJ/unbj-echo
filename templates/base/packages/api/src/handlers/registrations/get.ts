import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { notFound, serverError, tooManyRequests } from '../../lib/response'
import { isRateLimitExceeded } from '../../lib/rate-limit'
import type { Registration } from '@unbj/shared'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const token = event.pathParameters?.['token']
  if (!token) return notFound()
  if (await isRateLimitExceeded(event, { scope: 'registration-get', max: 60, windowSeconds: 60 })) {
    return tooManyRequests()
  }

  try {
    const db = getDb()
    const snap = await db
      .collection('registrations')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (snap.empty) return notFound('Registro no encontrado')

    const registration = snap.docs[0]?.data() as Registration
    if (registration.portalTokenRevokedAt) return notFound('Registro no encontrado')
    if (registration.portalTokenExpiresAt && new Date(registration.portalTokenExpiresAt).getTime() <= Date.now()) {
      return notFound('El enlace de acceso expiró')
    }

    // DTO explícito: agregar campos al registro no los publica por accidente.
    const portalRegistration = {
      id: registration.id,
      token: registration.token,
      status: registration.status,
      delegateType: registration.delegateType,
      fullName: registration.fullName,
      email: registration.email,
      phone: registration.phone,
      churchName: registration.churchName,
      conventionName: registration.conventionName,
      ticketTier: registration.ticketTier,
      paymentMethod: registration.paymentMethod,
      paymentAmount: registration.paymentAmount,
      stripeOxxoVoucherUrl: registration.stripeOxxoVoucherUrl,
      stripeOxxoExpiresAt: registration.stripeOxxoExpiresAt,
      paymentRejectedReason: registration.paymentRejectedReason,
      cartaFileName: registration.cartaFileName,
      cartaRejectedReason: registration.cartaRejectedReason,
      nominationPdfUrl: registration.nominationPdfUrl,
      selectedWorkshops: registration.selectedWorkshops,
      roomId: registration.roomId,
      roomRole: registration.roomRole,
      companionName: registration.companionName,
      tshirtSize: registration.tshirtSize,
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
      body: JSON.stringify(portalRegistration),
    }
  } catch (err) {
    console.error('Get registration error:', err)
    return serverError()
  }
}
