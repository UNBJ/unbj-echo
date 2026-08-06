'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getRegistrationDetail, approvePayment, rejectPayment, approveCarta, rejectCarta, resendAccessLink } from '@/lib/api'
import { STATUS_LABELS, STATUS_COLORS, DELEGATE_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/labels'
import type { Registration, RegistrationStatus, PaymentMethod } from '@unbj/shared'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, FileText, ExternalLink, Mail, Send, X } from 'lucide-react'
import { clsx } from 'clsx'

type Reg = Omit<Registration, 'qrToken'>

export default function RegistroDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getToken } = useAuth()
  const [reg, setReg] = useState<Reg | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = await getToken()
      const result = await getRegistrationDetail(token, id)
      setReg(result.registration)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el registro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !reg) {
    return (
      <div className="p-6">
        <p className="text-error text-sm">{error ?? 'Registro no encontrado'}</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a registros
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-semibold tracking-tight text-text-primary">{reg.fullName}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{reg.email} · {reg.phone}</p>
        </div>
        <span className={clsx(
          'text-xs px-3 py-1.5 rounded-full font-semibold',
          STATUS_COLORS[reg.status as RegistrationStatus]
        )}>
          {STATUS_LABELS[reg.status as RegistrationStatus]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Datos personales */}
        <InfoCard title="Datos personales">
          <InfoRow label="Nombre completo" value={reg.fullName} />
          <InfoRow label="Correo" value={reg.email} />
          <InfoRow label="Teléfono" value={reg.phone} />
          <InfoRow label="Fecha de nacimiento" value={reg.birthDate} />
          <InfoRow label="Edad" value={`${reg.age} años`} />
          <InfoRow
            label="Tipo de delegado"
            value={reg.delegateType ? DELEGATE_LABELS[reg.delegateType] : 'Sin asignar'}
          />
        </InfoCard>

        {/* Iglesia */}
        <InfoCard title="Iglesia">
          <InfoRow
            label="Convención"
            value={reg.conventionCode ? `${reg.conventionName} · ${reg.conventionCode}` : (reg.conventionName || '—')}
          />
          <InfoRow
            label="Iglesia"
            value={reg.churchCode ? `${reg.churchName} · ${reg.churchCode}` : (reg.churchName || '—')}
          />
          {reg.churchId && <InfoRow label="ID iglesia" value={reg.churchId} mono />}
        </InfoCard>

        {/* Pago */}
        <InfoCard title="Pago">
          <InfoRow
            label="Método"
            value={reg.paymentMethod ? PAYMENT_METHOD_LABELS[reg.paymentMethod as PaymentMethod] : '—'}
          />
          <InfoRow
            label="Monto"
            value={
              reg.paymentAmount
                ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(reg.paymentAmount)
                : '—'
            }
          />
          {reg.paymentApprovedAt && (
            <InfoRow label="Aprobado" value={new Date(reg.paymentApprovedAt).toLocaleString('es-MX')} />
          )}
          {reg.paymentApprovedBy && (
            <InfoRow label="Aprobado por" value={reg.paymentApprovedBy} />
          )}
          {reg.paymentRejectedReason && (
            <InfoRow label="Motivo de rechazo" value={reg.paymentRejectedReason} />
          )}
          {reg.stripeOxxoVoucherUrl && (
            <div className="flex justify-between items-start gap-2 py-2 border-b border-border last:border-0">
              <span className="text-xs text-text-secondary shrink-0">Voucher OXXO</span>
              <a
                href={reg.stripeOxxoVoucherUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline"
              >
                Ver voucher
              </a>
            </div>
          )}
        </InfoCard>

        {/* Timestamps */}
        <InfoCard title="Historial">
          <InfoRow
            label="Creado"
            value={new Date(reg.createdAt).toLocaleString('es-MX')}
          />
          <InfoRow
            label="Actualizado"
            value={new Date(reg.updatedAt).toLocaleString('es-MX')}
          />
          <InfoRow label="ID del registro" value={reg.id} mono />
          <InfoRow label="Token de portal" value={reg.token} mono />
        </InfoCard>
      </div>

      <ResendAccessLinkCard registration={reg} onDone={load} />

      {/* Asignación de tipo de delegado */}
      <div className="mt-4 bg-bg-card border border-border rounded-xl p-5 opacity-60">
        <h3 className="font-semibold text-text-primary mb-1">Tipo de delegado</h3>
        <p className="text-xs text-text-secondary mb-4">
          {reg.delegateType
            ? `Asignado: ${DELEGATE_LABELS[reg.delegateType]}`
            : 'Aún no se ha asignado tipo a este delegado.'}
        </p>
        <div className="flex items-center gap-3">
          <select
            disabled
            defaultValue={reg.delegateType ?? ''}
            className="border border-border rounded-lg px-3 py-2 text-sm text-text-secondary bg-bg-subtle cursor-not-allowed"
          >
            <option value="">Sin asignar</option>
            <option value="mensajero_acreditado">Mensajero Acreditado</option>
            <option value="fraternal">Fraternal</option>
          </select>
          <button
            disabled
            title="Próximamente"
            className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg opacity-50 cursor-not-allowed"
          >
            Asignar tipo
          </button>
        </div>
      </div>

      {/* Acciones de pago en efectivo */}
      {(reg.status === 'pending_onsite_payment' || reg.status === 'payment_submitted') &&
        reg.paymentMethod === 'cash' && (
          <CashPaymentActions registrationId={reg.id} onDone={load} />
        )}

      {/* Revisión de carta */}
      {reg.status === 'carta_submitted' && (
        <CartaActions registrationId={reg.id} cartaFileUrl={reg.cartaFileUrl} cartaFileName={reg.cartaFileName} onDone={load} />
      )}
    </div>
  )
}

function ResendAccessLinkCard({
  registration,
  onDone,
}: {
  registration: Reg
  onDone: () => void
}) {
  const { getToken } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    setSending(true)
    setError(null)
    setMessage(null)
    try {
      const token = await getToken()
      const result = await resendAccessLink(token, registration.id)
      setMessage(`Enlace reenviado a ${result.recipient}.`)
      setShowConfirm(false)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el enlace de acceso.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mt-4 bg-bg-card border border-border rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-text-primary">Acceso al portal</h2>
          </div>
          <p className="text-xs text-text-secondary">
            Reenvía el enlace personal de acceso a <strong className="text-text-primary">{registration.email}</strong>.
          </p>
          <p className="text-xs text-text-secondary mt-2">
            {registration.accessLinkEmailSendCount
              ? `${registration.accessLinkEmailSendCount} reenvío${registration.accessLinkEmailSendCount === 1 ? '' : 's'} · Último: ${new Date(registration.accessLinkEmailLastSentAt!).toLocaleString('es-MX')}${registration.accessLinkEmailLastSentBy ? ` por ${registration.accessLinkEmailLastSentBy}` : ''}`
              : 'Aún no se ha reenviado el enlace.'}
          </p>
        </div>
        <button
          onClick={() => { setShowConfirm(true); setError(null); setMessage(null) }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          Reenviar enlace
        </button>
      </div>

      {message && <p className="mt-4 text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">{message}</p>}
      {error && <p className="mt-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</p>}

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="resend-access-title">
          <div className="w-full max-w-md bg-bg-card border border-border rounded-2xl shadow-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 id="resend-access-title" className="font-heading font-bold text-text-primary">¿Reenviar enlace de acceso?</h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  Se enviará un recordatorio con el enlace existente a <strong className="text-text-primary">{registration.email}</strong>.
                </p>
              </div>
              <button onClick={() => setShowConfirm(false)} disabled={sending} className="text-text-secondary hover:text-text-primary disabled:opacity-50" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} disabled={sending} className="px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleSend} disabled={sending} className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50">
                <Send className="w-4 h-4" />
                {sending ? 'Enviando...' : 'Confirmar reenvío'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function CashPaymentActions({
  registrationId,
  onDone,
}: {
  registrationId: string
  onDone: () => void
}) {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      await approvePayment(token, registrationId)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar el pago')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!reason.trim()) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      await rejectPayment(token, registrationId, reason.trim())
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 bg-warning/10 border border-warning/20 rounded-xl shadow-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h3 className="font-semibold text-text-primary">Acción requerida — Pago en efectivo</h3>
      </div>

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-success hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Aprobar pago
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-error hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            placeholder="Motivo del rechazo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-lg bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150"
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading || !reason.trim()}
              className="px-4 py-2.5 bg-error hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setReason('') }}
              disabled={loading}
              className="px-4 py-2.5 border border-border text-text-secondary hover:text-text-primary text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CartaActions({
  registrationId,
  cartaFileUrl,
  cartaFileName,
  onDone,
}: {
  registrationId: string
  cartaFileUrl?: string
  cartaFileName?: string
  onDone: () => void
}) {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      await approveCarta(token, registrationId)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar la carta')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!reason.trim()) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      await rejectCarta(token, registrationId, reason.trim())
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar la carta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 bg-accent/10 border border-accent/20 rounded-xl shadow-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-text-primary">Revisión de carta de acreditación</h3>
      </div>

      {cartaFileUrl && (
        <a
          href={cartaFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-accent hover:underline mb-4"
        >
          <ExternalLink className="w-4 h-4" />
          Ver carta {cartaFileName ? `— ${cartaFileName}` : ''}
        </a>
      )}

      {error && (
        <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-success hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Aprobar carta
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-error hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            placeholder="Motivo del rechazo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-lg bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-150"
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading || !reason.trim()}
              className="px-4 py-2.5 bg-error hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setReason('') }}
              disabled={loading}
              className="px-4 py-2.5 border border-border text-text-secondary hover:text-text-primary text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl shadow-card p-5">
      <h2 className="text-sm font-heading font-semibold text-text-primary mb-3">{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 first:pt-0 last:pb-0">
      <span className="text-xs text-text-secondary shrink-0">{label}</span>
      <span className={clsx('text-xs text-text-primary text-right break-all', mono && 'font-mono')}>{value}</span>
    </div>
  )
}
