import type { Registration } from '@unbj/shared'
import { DELEGATE_TYPE_LABELS } from '@unbj/shared'

interface InfoCardProps {
  registration: Omit<Registration, 'qrToken'>
}

export function InfoCard({ registration }: InfoCardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl shadow-card">
      <div className="p-5">
        <p className="text-sm font-heading font-semibold text-text-primary mb-5">
          Información de registro
        </p>

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
