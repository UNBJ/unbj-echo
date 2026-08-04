import type { Registration } from '@plenarias/shared'
import { DELEGATE_TYPE_LABELS } from '@plenarias/shared'
import { ProgressTracker } from './ProgressTracker'
import { ActionBlock } from './ActionBlock'
import { InfoCard } from './InfoCard'
import { Footer } from '@/components/ui/Footer'

interface PortalViewProps {
  registration: Omit<Registration, 'qrToken'>
}

export function PortalView({ registration }: PortalViewProps) {
  const delegateLabel = registration.delegateType
    ? (DELEGATE_TYPE_LABELS[registration.delegateType] ?? registration.delegateType)
    : null
  const isMensajero = registration.delegateType === 'mensajero_acreditado'

  const initials = registration.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">

      {/* Header */}
      <header className="bg-[#1A1A2E] text-white h-16 px-6 md:px-12 flex items-center justify-between flex-shrink-0 border-b border-[#C8A44A]/15">
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-lg tracking-wide">CNBM</span>
          <div className="w-px h-6 bg-[#C8A44A]/30" />
          <span className="text-[#C8A44A]/80 text-xs tracking-[0.15em] uppercase hidden sm:block">
            CXVI Reuniones Plenarias
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#C8A44A] flex items-center justify-center">
            <span className="text-[#1A1A2E] text-xs font-bold">{initials}</span>
          </div>
          <span className="text-white/70 text-sm hidden sm:block">{registration.fullName.split(' ')[0]}</span>
        </div>
      </header>

      <div className="flex-1 px-6 md:px-12 py-8 max-w-6xl mx-auto w-full">

        {/* Breadcrumb + nombre */}
        <div className="mb-7">
          <p className="text-[11px] text-text-secondary tracking-wider uppercase mb-1.5">
            Portal personal · {registration.churchName} · {registration.conventionName}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold text-text-primary">
              {registration.fullName}
            </h1>
            {delegateLabel && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1A1A2E] text-[#E8D088] tracking-wide">
                {delegateLabel}
              </span>
            )}
          </div>
        </div>

        {/* Grid: left column + right action */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="flex flex-col gap-5">
            <ProgressTracker
              status={registration.status}
              isMensajero={isMensajero}
            />
            <InfoCard registration={registration} />
          </div>

          <div className="self-start">
            <ActionBlock registration={registration} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
