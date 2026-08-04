import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import Stripe from 'stripe'
import { getDb } from '../../lib/firebase'
import { generateAndSaveNomination } from '../../lib/nomination'
import type { Registration, RegistrationStatus } from '@plenarias/shared'

type StripeEvent = any
type StripePaymentIntent = any
type StripePaymentMethod = any

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '')
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'] ?? ''

  const signature = event.headers['stripe-signature'] ?? ''
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
    : (event.body ?? '')

  let stripeEvent: StripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid signature' }) }
  }

  const db = getDb()

  try {
    switch (stripeEvent.type) {
      case 'payment_intent.processing': {
        await handleProcessing(db, stripeEvent.data.object as StripePaymentIntent)
        break
      }
      case 'payment_intent.succeeded': {
        await handleSucceeded(db, stripeEvent.data.object as StripePaymentIntent)
        break
      }
      case 'payment_intent.payment_failed': {
        await handleFailed(db, stripeEvent.data.object as StripePaymentIntent)
        break
      }
      case 'payment_intent.requires_action': {
        await handleRequiresAction(db, stripeEvent.data.object as StripePaymentIntent)
        break
      }
      case 'payment_intent.canceled': {
        await handleCanceled(db, stripeEvent.data.object as StripePaymentIntent)
        break
      }
      default:
        break
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (err) {
    console.error('Webhook processing error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Processing failed' }) }
  }
}

async function findRegistrationDoc(db: FirebaseFirestore.Firestore, paymentIntentId: string) {
  const snap = await db
    .collection('registrations')
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .limit(1)
    .get()
  return snap.empty ? null : snap.docs[0]
}

async function handleProcessing(db: FirebaseFirestore.Firestore, pi: StripePaymentIntent) {
  const doc = await findRegistrationDoc(db, pi.id)
  if (!doc) return

  await doc.ref.update({
    status: 'payment_submitted' as RegistrationStatus,
    updatedAt: new Date().toISOString(),
  })
}

async function handleSucceeded(db: FirebaseFirestore.Firestore, pi: StripePaymentIntent) {
  const doc = await findRegistrationDoc(db, pi.id)
  if (!doc) return

  const reg = doc.data() as Registration
  const paymentMethod = resolvePaymentMethod(pi)
  const now = new Date().toISOString()

  await doc.ref.update({
    status: 'payment_approved' as RegistrationStatus,
    paymentMethod,
    paymentApprovedAt: now,
    updatedAt: now,
  })

  
  const updatedRegSnap = await doc.ref.get()
  const updatedReg = updatedRegSnap.data() as Registration
  await generateAndSaveNomination(db, doc.ref, updatedReg)
  
}

async function handleFailed(db: FirebaseFirestore.Firestore, pi: StripePaymentIntent) {
  const doc = await findRegistrationDoc(db, pi.id)
  if (!doc) return

  const reason = pi.last_payment_error?.message ?? 'El pago fue rechazado'

  await doc.ref.update({
    status: 'payment_rejected' as RegistrationStatus,
    paymentRejectedReason: reason,
    updatedAt: new Date().toISOString(),
  })
}

async function handleRequiresAction(db: FirebaseFirestore.Firestore, pi: StripePaymentIntent) {
  const doc = await findRegistrationDoc(db, pi.id)
  if (!doc) return

  const oxxoDetails = pi.next_action?.oxxo_display_details
  const updates: Record<string, unknown> = {
    status: 'payment_submitted' as RegistrationStatus,
    paymentMethod: 'oxxo',
    updatedAt: new Date().toISOString(),
  }

  if (oxxoDetails) {
    updates['stripeOxxoVoucherUrl'] = oxxoDetails.hosted_voucher_url
    updates['stripeOxxoExpiresAt'] = oxxoDetails.expires_after
      ? new Date(oxxoDetails.expires_after * 1000).toISOString()
      : null
  }

  await doc.ref.update(updates)
}

async function handleCanceled(db: FirebaseFirestore.Firestore, pi: StripePaymentIntent) {
  const doc = await findRegistrationDoc(db, pi.id)
  if (!doc) return

  await doc.ref.update({
    status: 'pending_payment' as RegistrationStatus,
    stripePaymentIntentId: null,
    stripeOxxoVoucherUrl: null,
    stripeOxxoExpiresAt: null,
    updatedAt: new Date().toISOString(),
  })
}

function resolvePaymentMethod(pi: StripePaymentIntent): string {
  const type = pi.payment_method_types?.[0] ?? 'card'
  if (type === 'oxxo') return 'oxxo'

  const details = pi.payment_method
  if (typeof details === 'object' && details !== null) {
    const wallet = (details as StripePaymentMethod).card?.wallet
    if (wallet?.type === 'google_pay') return 'google_pay'
    if (wallet?.type === 'apple_pay') return 'apple_pay'
  }
  return 'card'
}
