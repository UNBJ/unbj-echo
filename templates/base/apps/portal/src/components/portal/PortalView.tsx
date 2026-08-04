import type { Registration } from '@unbj/shared'
import { DELEGATE_TYPE_LABELS, branding } from '@unbj/shared'
import { ProgressTracker } from './ProgressTracker'
import { ActionBlock } from './ActionBlock'
import { InfoCard } from './InfoCard'
import { Footer } from '@/components/ui/Footer'
import { Monogram } from '@/components/ui/Monogram'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

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
      <header className="bg-bg-card border-b border-border h-16 px-6 md:px-12 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Monogram size="sm" />
          <span className="text-text-primary font-heading font-semibold text-sm hidden sm:block">
            {branding.eventName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <span className="text-text-secondary text-sm hidden sm:block">{registration.fullName.split(' ')[0]}</span>
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
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent tracking-wide">
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
