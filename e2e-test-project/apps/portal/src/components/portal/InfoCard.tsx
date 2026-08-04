import type { Registration } from '@plenarias/shared'
import { DELEGATE_TYPE_LABELS } from '@plenarias/shared'

interface InfoCardProps {
  registration: Omit<Registration, 'qrToken'>
}

export function InfoCard({ registration }: InfoCardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Gold top accent */}
      <div className="h-[3px] bg-gradient-to-r from-[#C8A44A]/60 via-[#E8D088]/80 to-[#C8A44A]/60" />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-px flex-1 bg-[#C8A44A]/25" />
          <p className="text-[10px] font-semibold text-[#C8A44A] uppercase tracking-[0.25em]">
            Información de registro
          </p>
          <div className="h-px flex-1 bg-[#C8A44A]/25" />
        </div>

        <dl className="flex flex-col divide-y divide-border">
          <Row label="Nombre" value={registration.fullName} />
          <Row label="Correo" value={registration.email} />
          <Row label="Teléfono" value={registration.phone} />
          <Row label="Iglesia" value={registration.churchName || '—'} />
          <Row label="Convención" value={registration.conventionName || '—'} />
          <Row
            label="Tipo"
            value={registration.delegateType
              ? (DELEGATE_TYPE_LABELS[registration.delegateType] ?? registration.delegateType)
              : 'Sin asignar'}
          />
        </dl>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <dt className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className="text-sm text-text-primary font-medium">{value}</dd>
    </div>
  )
}
