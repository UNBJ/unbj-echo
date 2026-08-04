'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Registration } from '@plenarias/shared'
import { CreditCard, Clock, CheckCircle, Upload, FileText, ShieldCheck, Lock } from 'lucide-react'
import { DELEGATE_TYPE_LABELS } from '@plenarias/shared'
import { submitCarta } from '@/lib/api'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes } from 'firebase/storage'
import { StripePaymentForm } from './StripePaymentForm'

interface ActionBlockProps {
  registration: Omit<Registration, 'qrToken'>
}

export function ActionBlock({ registration }: ActionBlockProps) {
  const { status } = registration
  const router = useRouter()

  if (status === 'pending_payment') {
    return (
      <PendingPaymentBlock registration={registration} onSuccess={() => router.refresh()} />
    )
  }

  if (status === 'payment_submitted') {
    return (
      <StatusCard
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        title="Pago en proceso"
        description="Tu pago está siendo procesado. Te notificaremos por correo cuando se confirme."
        color="warning"
        note="Si pagaste por OXXO, la confirmación puede tardar hasta 3 días hábiles. Los pagos con tarjeta se confirman en minutos."
      />
    )
  }

  if (status === 'payment_rejected') {
    return (
      <PendingPaymentBlock
        registration={registration}
        rejectedReason={registration.paymentRejectedReason}
        onSuccess={() => router.refresh()}
      />
    )
  }

  if (status === 'carta_pending' || status === 'payment_approved') {
    return <CartaPendingBlock token={registration.token} />
  }

  if (status === 'carta_submitted') {
    return (
      <StatusCard
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        title="Carta en revisión"
        description="Tu carta de acreditación fue recibida y está siendo revisada por el equipo administrativo."
        color="warning"
        note="Recibirás un correo con el resultado. Si tu carta es aprobada, tu hoja de nombramiento se generará automáticamente."
      />
    )
  }

  if (status === 'carta_rejected') {
    return <CartaPendingBlock token={registration.token} rejectedReason={registration.cartaRejectedReason} />
  }

  if (status === 'fully_approved' || status === 'checked_in') {
    return <ApprovedBlock registration={registration} />
  }

  return null
}


function PendingPaymentBlock({
  registration,
  rejectedReason,
  onSuccess,
}: {
  registration: Omit<Registration, 'qrToken'>
  rejectedReason?: string
  onSuccess: () => void
}) {
  const [oxxoVoucherUrl, setOxxoVoucherUrl] = useState<string | null>(null)

  if (oxxoVoucherUrl) {
    return (
      <StatusCard
        icon={<CreditCard className="w-5 h-5 text-amber-600" />}
        title="Voucher OXXO generado"
        description="Presenta este voucher en cualquier tienda OXXO para completar tu pago."
        color="warning"
        note="La confirmación puede tardar hasta 3 días hábiles. Recibirás un correo cuando tu pago sea procesado."
        action={{ label: 'Ver voucher', href: oxxoVoucherUrl }}
      />
    )
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Gold accent */}
      <div className="h-[3px] bg-gradient-to-r from-[#C8A44A]/60 via-[#E8D088]/80 to-[#C8A44A]/60" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-[#E8D088]" />
          </div>
          <div>
            <h2 className="text-base font-heading font-bold text-text-primary leading-tight">Completa tu pago</h2>
            <p className="text-xs text-text-secondary">Selecciona tu método de pago preferido</p>
          </div>
        </div>

        {/* Rejection banner */}
        {rejectedReason && (
          <div className="bg-red-50 border border-error/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm font-medium text-error mb-0.5">Pago rechazado</p>
            <p className="text-sm text-text-secondary">{rejectedReason}</p>
          </div>
        )}

        {/* OXXO notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4 flex items-start gap-2">
          <span className="text-amber-600 text-sm mt-0.5 flex-shrink-0">⚠</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            Los pagos por <strong>OXXO</strong> pueden tardar hasta <strong>3 días hábiles</strong> en confirmarse.
            El pago con tarjeta se confirma de inmediato.
          </p>
        </div>

        <StripePaymentForm
          token={registration.token}
          fullName={registration.fullName}
          email={registration.email}
          onSuccess={onSuccess}
          onOxxo={(url) => setOxxoVoucherUrl(url)}
        />

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Lock className="w-3 h-3" />
            <span className="text-[10px] tracking-wide">Cifrado SSL</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5 text-text-secondary">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[10px] tracking-wide">Datos protegidos</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <span className="text-[10px] text-text-secondary tracking-wide">Procesado por Stripe</span>
        </div>
      </div>
    </div>
  )
}

function CartaPendingBlock({ token, rejectedReason }: { token: string; rejectedReason?: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.size > 10 * 1024 * 1024) {
      setError('El archivo no puede pesar más de 10 MB.')
      return
    }
    setError(null)
    setFile(selected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop() ?? 'pdf'
      const filePath = `cartas/${token}/carta.${ext}`
      const storageRef = ref(storage, filePath)
      await uploadBytes(storageRef, file, { contentType: file.type })
      await submitCarta(token, filePath, file.name)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la carta. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Gold accent */}
      <div className="h-[3px] bg-gradient-to-r from-[#C8A44A]/60 via-[#E8D088]/80 to-[#C8A44A]/60" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-[#E8D088]" />
          </div>
          <div>
            <h2 className="text-base font-heading font-bold text-text-primary leading-tight">
              Carta de acreditación
            </h2>
            <p className="text-xs text-text-secondary">Documento oficial de tu iglesia</p>
          </div>
        </div>

        {/* Rejection banner */}
        {rejectedReason && (
          <div className="bg-red-50 border border-error/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm font-medium text-error mb-0.5">Carta rechazada</p>
            <p className="text-sm text-text-secondary">{rejectedReason}</p>
          </div>
        )}

        {/* Info note */}
        <div className="bg-[#1A1A2E]/[0.04] border border-[#1A1A2E]/10 rounded-lg px-4 py-3 mb-5 flex items-start gap-2.5">
          <span className="text-[#C8A44A] text-sm mt-0.5 flex-shrink-0">✦</span>
          <p className="text-xs text-text-secondary leading-relaxed">
            Sube la <strong className="text-text-primary">carta oficial de tu iglesia</strong> que te acredita como mensajero ante las Plenarias CNBM 2026.
            Formatos aceptados: <strong className="text-text-primary">PDF, JPG o PNG</strong> · Máx. 10 MB.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              file
                ? 'border-[#1A1A2E]/30 bg-[#1A1A2E]/[0.03]'
                : 'border-border hover:border-[#C8A44A]/50 hover:bg-[#C8A44A]/[0.02]'
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#1A1A2E] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#E8D088]" />
                </div>
                <p className="text-sm font-semibold text-text-primary">{file.name}</p>
                <p className="text-xs text-text-secondary">Haz clic para cambiar el archivo</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-bg-page border border-border flex items-center justify-center">
                  <Upload className="w-5 h-5 text-text-secondary" />
                </div>
                <p className="text-sm font-medium text-text-primary">Haz clic para seleccionar</p>
                <p className="text-xs text-text-secondary">PDF, JPG o PNG · Máx. 10 MB</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-error bg-red-50 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-[#1A1A2E] hover:bg-[#2d2d50] text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {uploading ? 'Subiendo...' : 'Enviar carta'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ApprovedBlock({ registration }: { registration: Omit<Registration, 'qrToken'> }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Gold top accent */}
      <div className="h-[3px] bg-gradient-to-r from-[#C8A44A]/60 via-[#E8D088]/80 to-[#C8A44A]/60" />

      <div className="p-6">
        {/* Success header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-[#E8D088]" />
          </div>
          <div>
            <h2 className="text-base font-heading font-bold text-text-primary leading-tight">
              ¡Estás listo para las plenarias!
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">Registro completamente aprobado</p>
          </div>
          <span className="ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#1A1A2E] text-[#E8D088] whitespace-nowrap">
            Aprobado
          </span>
        </div>

        {registration.nominationPdfUrl ? (
          <>
            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-[#C8A44A]/20" />
              <p className="text-[10px] font-semibold text-[#C8A44A] uppercase tracking-[0.25em]">
                Hoja de Nombramiento
              </p>
              <div className="h-px flex-1 bg-[#C8A44A]/20" />
            </div>

            {/* PDF preview */}
            <div className="flex items-center gap-4 bg-bg-page border border-border rounded-xl p-4 mb-5">
              <div className="w-12 h-14 bg-[#1A1A2E] rounded-lg flex flex-col items-center justify-center flex-shrink-0 gap-1">
                <span className="text-[#E8D088] text-[10px] font-bold tracking-wider">PDF</span>
                <div className="w-5 h-px bg-[#C8A44A]/40" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{registration.fullName}</p>
                <p className="text-xs text-text-secondary truncate">{registration.churchName}</p>
                <p className="text-[10px] text-[#C8A44A] mt-0.5 tracking-wide">CXVI Reuniones Plenarias · 2026</p>
              </div>
            </div>

            <a
              href={registration.nominationPdfUrl}
              download
              className="flex items-center justify-center gap-2 w-full bg-[#1A1A2E] hover:bg-[#2d2d50] text-white font-semibold py-3 rounded-lg text-sm transition-colors"
            >
              Descargar Hoja de Nombramiento
            </a>

            <p className="text-xs text-text-secondary text-center mt-3 leading-relaxed">
              Presenta este documento <strong>impreso o en pantalla</strong> el día del evento · 19–23 de Octubre 2026
            </p>
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            Tu hoja de nombramiento fue enviada a <strong>{registration.email}</strong>
          </p>
        )}
      </div>
    </div>
  )
}

function StatusCard({
  icon,
  title,
  description,
  color,
  action,
  note,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: 'success' | 'warning' | 'error'
  action?: { label: string; href: string }
  note?: string
}) {
  const iconBgMap = {
    success: 'bg-[#1A1A2E]',
    warning: 'bg-amber-100',
    error: 'bg-red-100',
  }
  const badgeMap = {
    success: 'bg-[#1A1A2E] text-[#E8D088]',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-error',
  }
  const badgeLabelMap = {
    success: 'Completado',
    warning: 'En proceso',
    error: 'Requiere atención',
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-[#C8A44A]/60 via-[#E8D088]/80 to-[#C8A44A]/60" />

      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgMap[color]}`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-base font-heading font-bold text-text-primary">{title}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeMap[color]}`}>
                {badgeLabelMap[color]}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{description}</p>

            {note && (
              <div className="mt-4 bg-[#1A1A2E]/[0.04] border border-[#1A1A2E]/10 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <span className="text-[#C8A44A] text-xs mt-0.5 flex-shrink-0">✦</span>
                <p className="text-xs text-text-secondary leading-relaxed">{note}</p>
              </div>
            )}

            {action && (
              <a
                href={action.href}
                className="inline-block mt-4 bg-[#1A1A2E] hover:bg-[#2d2d50] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {action.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

