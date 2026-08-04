import type { Registration, RegistrationStatus } from '@plenarias/shared'
import { generateNominationPdf } from './pdf'
import { saveBuffer, getSignedReadUrl } from './storage'
import { approvalEmailHtml } from './email-html'

export async function generateAndSaveNomination(
  db: FirebaseFirestore.Firestore,
  docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
  registration: Registration
): Promise<void> {
  const pdfBuffer = await generateNominationPdf(registration)

  const filePath = `nominations/${registration.id}/nombramiento.pdf`
  await saveBuffer(filePath, pdfBuffer, 'application/pdf')

  // URL firmada con 1 año de vigencia
  const nominationPdfUrl = await getSignedReadUrl(filePath, 365 * 24 * 60 * 60 * 1000)

  const now = new Date().toISOString()
  await docRef.update({
    status: 'fully_approved' as RegistrationStatus,
    nominationPdfUrl,
    nominationGeneratedAt: now,
    updatedAt: now,
  })

  // Email de aprobación (fire-and-forget)
  sendApprovalEmail(registration, nominationPdfUrl).catch((err) =>
    console.error('Approval email failed:', err)
  )
}

async function sendApprovalEmail(registration: Registration, pdfUrl: string): Promise<void> {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env['RESEND_API_KEY'])

  const fromAddress = process.env['RESEND_FROM_EMAIL'] ?? 'onboarding@resend.dev'
  const toAddress = process.env['RESEND_DEV_TO'] || registration.email
  console.log('[Email] from:', fromAddress, '| to:', toAddress)

  
  const delegateLabel =
    registration.ticketTier === 'vip' ? 'VIP'
    : registration.ticketTier === 'student' ? 'Estudiante'
    : 'General'
  

  await resend.emails.send({
    from: `E2E Test Platform <${fromAddress}>`,
    to: toAddress,
    subject: '¡Tu registro está aprobado! — E2E Test Platform',
    html: approvalEmailHtml({
      fullName: registration.fullName,
      pdfUrl,
      eventName: 'E2E Test Platform',
      
      delegateLabel,
    }),
  })
}
