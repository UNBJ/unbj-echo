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
  const delegateLabel =
    registration.delegateType === 'mensajero_acreditado' ? 'Mensajero Acreditado'
    : registration.delegateType === 'fraternal' ? 'Fraternal'
    : 'Sin asignar'

  await resend.emails.send({
    from: `CXVI Reuniones Plenarias CNBM 2026 <${fromAddress}>`,
    to: toAddress,
    subject: '¡Tu registro está aprobado! — CXVI Reuniones Plenarias CNBM 2026',
    html: approvalEmailHtml({
      fullName: registration.fullName,
      churchName: registration.churchName,
      conventionName: registration.conventionName,
      delegateLabel,
      pdfUrl,
    }),
  })
}
