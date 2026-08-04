import type { Registration } from '@unbj/shared'
import { DELEGATE_TYPE_LABELS } from '@unbj/shared'

interface InfoCardProps {
  registration: Omit<Registration, 'qrToken'>
}

export function InfoCard({ registration }: InfoCardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Accent top */}
      <div className="h-[3px] bg-accent/60" />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-px flex-1 bg-border" />
          <p className="text-[10px] font-semibold text-accent uppercase tracking-[0.25em]">
            Información de registro
          </p>
          <div className="h-px flex-1 bg-border" />
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
