import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import Stripe from 'stripe'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { ok, badRequest, notFound, serverError } from '../../lib/response'
import type { Registration } from '@plenarias/shared'

const schema = z.object({
  token: z.string().min(1),
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

  const { token } = parsed.data
  const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '')
  const db = getDb()

  try {
    // Obtener registro
    const snap = await db.collection('registrations').where('token', '==', token).limit(1).get()
    if (snap.empty) return notFound('Registro no encontrado')

    const registration = snap.docs[0]?.data() as Registration

    if (!['pending_payment', 'payment_rejected'].includes(registration.status)) {
      return badRequest('Este registro no requiere pago')
    }

    // Reutilizar PaymentIntent existente si aún está activo
    if (registration.stripePaymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(registration.stripePaymentIntentId)
      if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
        return ok({ clientSecret: existing.client_secret, amount: existing.amount, currency: existing.currency })
      }
    }

    // Obtener precio de config
    const configSnap = await db.collection('config').doc('global').get()
    const price: number = configSnap.data()?.price ?? 800

    // Crear nuevo PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price * 100,
      currency: 'mxn',
      payment_method_types: ['card', 'oxxo'],
      payment_method_options: {
        oxxo: { expires_after_days: 3 },
      },
      metadata: {
        registrationId: registration.id,
        token: registration.token,
        fullName: registration.fullName,
        churchName: registration.churchName,
      },
    })

    // Guardar referencia en Firestore
    await snap.docs[0]?.ref.update({
      stripePaymentIntentId: paymentIntent.id,
      paymentAmount: price,
      updatedAt: new Date().toISOString(),
    })

    return ok({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (err) {
    console.error('Create payment intent error:', err)
    return serverError()
  }
}
