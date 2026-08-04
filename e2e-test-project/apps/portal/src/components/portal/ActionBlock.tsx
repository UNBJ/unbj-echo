'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Registration } from '@plenarias/shared'
import { CreditCard, Clock, CheckCircle, Upload, FileText, ShieldCheck, Lock, Shirt, BookOpen, Home, Vote } from 'lucide-react'
import { submitCarta } from '@/lib/api'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes } from 'firebase/storage'
import { StripePaymentForm } from './StripePaymentForm'


import { ShirtSizeSelector } from '../shirt-size/ShirtSizeSelector'


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
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Accent line */}
      <div className="h-[3px] bg-gradient-to-r from-blue-500/60 via-indigo-500/80 to-blue-500/60" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-white" />
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



function ApprovedBlock({ registration }: { registration: Omit<Registration, 'qrToken'> }) {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Ticket/Acceso Card */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="h-[3px] bg-gradient-to-r from-blue-500/60 via-indigo-500/80 to-blue-500/60" />

        <div className="p-6">
          {/* Success header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-text-primary leading-tight">
                ¡Tu registro está aprobado!
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">Pase oficial confirmado</p>
            </div>
            <span className="ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap">
              Aprobado
            </span>
          </div>

          {registration.nominationPdfUrl ? (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-border" />
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.25em]">
                  Pase de Entrada
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* PDF preview */}
              <div className="flex items-center gap-4 bg-bg-page border border-border rounded-xl p-4 mb-5">
                <div className="w-12 h-14 bg-[#1A1A2E] rounded-lg flex flex-col items-center justify-center flex-shrink-0 gap-1">
                  <span className="text-white text-[10px] font-bold tracking-wider">PDF</span>
                  <div className="w-5 h-px bg-white/40" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{registration.fullName}</p>
                  <p className="text-xs text-text-secondary truncate">{registration.email}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5 tracking-wide">E2E Test Platform</p>
                </div>
              </div>

              <a
                href={registration.nominationPdfUrl}
                download
                className="flex items-center justify-center gap-2 w-full bg-[#1A1A2E] hover:bg-[#2d2d50] text-white font-semibold py-3 rounded-lg text-sm transition-colors"
              >
                Descargar Pase de Entrada
              </a>

              <p className="text-xs text-text-secondary text-center mt-3 leading-relaxed">
                Presenta este pase <strong>impreso o en tu pantalla</strong> el día del evento.
              </p>
            </>
          ) : (
            <p className="text-sm text-text-secondary">
              Tu pase de entrada fue enviado a <strong>{registration.email}</strong>
            </p>
          )}
        </div>
      </div>

      {/* --- MÓDULOS DE ROMPECABEZAS INYECTADOS --- */}
      
      
      {/* Módulo Talla de Playera */}
      <ShirtSizeSelector token={registration.token} />
      

      
      {/* Módulo Talleres */}
      <div className="bg-bg-card border border-border rounded-xl p-5 flex items-start gap-4 shadow-sm">
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-sm text-text-primary mb-1">Talleres y Capacitación</h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            Selecciona los talleres y sesiones de capacitación en los que participarás en el evento.
          </p>
          <a
            href={`/portal/${registration.token}/talleres`}
            className="inline-flex items-center justify-center bg-[#1A1A2E] hover:bg-[#2d2d50] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            {registration.selectedWorkshops && registration.selectedWorkshops.length > 0 ? 'Ver mis Talleres' : 'Elegir Talleres'}
          </a>
        </div>
      </div>
      

      
      {/* Módulo Hospedaje */}
      <div className="bg-bg-card border border-border rounded-xl p-5 flex items-start gap-4 shadow-sm">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <Home className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-sm text-text-primary mb-1">Hospedaje y Habitaciones</h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            Organiza tu asignación de cuarto, comparte tu código con compañeros o ingresa un código para unirte.
          </p>
          <a
            href={`/portal/${registration.token}/habitaciones`}
            className="inline-flex items-center justify-center bg-[#1A1A2E] hover:bg-[#2d2d50] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Gestionar Hospedaje
          </a>
        </div>
      </div>
      

      
      {/* Módulo Votación */}
      <div className="bg-bg-card border border-border rounded-xl p-5 flex items-start gap-4 shadow-sm">
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
          <Vote className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-sm text-text-primary mb-1">Votación en Tiempo Real</h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            Participa activamente en la toma de decisiones y elecciones en vivo.
          </p>
          <a
            href={`/portal/${registration.token}/votacion`}
            className="inline-flex items-center justify-center bg-[#1A1A2E] hover:bg-[#2d2d50] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Acceder al Panel de Votación
          </a>
        </div>
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
    success: 'bg-[#1A1A2E] text-white',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-error',
  }
  const badgeLabelMap = {
    success: 'Completado',
    warning: 'En proceso',
    error: 'Requiere atención',
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="h-[3px] bg-gradient-to-r from-blue-500/60 via-indigo-500/80 to-blue-500/60" />

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
