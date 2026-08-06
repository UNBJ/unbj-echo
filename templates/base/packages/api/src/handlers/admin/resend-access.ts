import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { FieldValue } from 'firebase-admin/firestore'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, notFound, serverError } from '../../lib/response'
import { accessLinkReminderEmailHtml } from '../../lib/email-html'
import { branding } from '@unbj/shared'
import type { Registration } from '@unbj/shared'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) }
  }

  const id = event.pathParameters?.['id']
  if (!id) return notFound()

  const db = getDb()
  const registrationRef = db.collection('registrations').doc(id)
  const attemptRef = registrationRef.collection('accessLinkEmails').doc()
  const attemptedAt = new Date().toISOString()

  try {
    const snap = await registrationRef.get()
    if (!snap.exists) return notFound('Registro no encontrado')

    const registration = snap.data() as Registration
    const portalUrl = `${process.env['PORTAL_URL']}/portal/${registration.token}`
    const recipient = process.env['RESEND_DEV_TO'] || registration.email
    const fromAddress = process.env['RESEND_FROM_EMAIL'] ?? 'onboarding@resend.dev'
    const { Resend } = await import('resend')
    const resend = new Resend(process.env['RESEND_API_KEY'])
    const emailResult = await resend.emails.send({
      from: `${branding.eventName} <${fromAddress}>`,
      to: recipient,
      subject: `Enlace de acceso — ${branding.eventName}`,
      html: accessLinkReminderEmailHtml({
        fullName: registration.fullName,
        portalUrl,
        eventName: branding.eventName,
      }),
    })

    if (emailResult.error) {
      throw new Error(emailResult.error.message || 'Resend rechazó el envío del correo')
    }

    const sentAt = new Date().toISOString()
    await Promise.all([
      attemptRef.set({
        status: 'sent',
        attemptedAt,
        sentAt,
        adminUid: admin.uid,
        adminEmail: admin.email,
        registeredEmail: registration.email,
        recipient,
        resendEmailId: emailResult.data?.id ?? null,
      }),
      registrationRef.update({
        accessLinkEmailSendCount: FieldValue.increment(1),
        accessLinkEmailLastSentAt: sentAt,
        accessLinkEmailLastSentBy: admin.email,
        updatedAt: sentAt,
      }),
    ])

    return ok({ success: true, recipient, sentAt })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al reenviar el acceso'
    console.error('resend-access error:', err)

    await attemptRef.set({
      status: 'failed',
      attemptedAt,
      adminUid: admin.uid,
      adminEmail: admin.email,
      error: message,
    }).catch((auditError) => console.error('resend-access audit error:', auditError))

    return serverError('No se pudo reenviar el enlace de acceso. Intenta de nuevo.')
  }
}
