import { Check, X, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import type { RegistrationStatus } from '@unbj/shared'

interface Step {
  label: string
  sublabel: string
  state: 'done' | 'active' | 'error' | 'blocked'
}

function getSteps(status: RegistrationStatus): Step[] {
  const done = (label: string, sublabel: string): Step => ({ label, sublabel, state: 'done' })
  const active = (label: string, sublabel: string): Step => ({ label, sublabel, state: 'active' })
  const error = (label: string, sublabel: string): Step => ({ label, sublabel, state: 'error' })
  const blocked = (label: string, sublabel: string): Step => ({ label, sublabel, state: 'blocked' })

  const registroStep = done('Registro', 'Completado')

  switch (status) {
    case 'pending_payment':
    case 'payment_submitted':
      return [
        registroStep,
        active('Pago', status === 'payment_submitted' ? 'En proceso' : 'Pendiente'),
        blocked('Carta de acreditación', 'Pendiente'),
        blocked('Nombramiento', 'Pendiente'),
      ]
    case 'payment_rejected':
      return [
        registroStep,
        error('Pago', 'Rechazado'),
        blocked('Carta de acreditación', 'Pendiente'),
        blocked('Nombramiento', 'Pendiente'),
      ]
    case 'payment_approved':
    case 'carta_pending':
      return [
        registroStep,
        done('Pago', 'Aprobado'),
        active('Carta de acreditación', 'Pendiente'),
        blocked('Nombramiento', 'Pendiente'),
      ]
    case 'carta_submitted':
      return [
        registroStep,
        done('Pago', 'Aprobado'),
        active('Carta de acreditación', 'En revisión'),
        blocked('Nombramiento', 'Pendiente'),
      ]
    case 'carta_rejected':
      return [
        registroStep,
        done('Pago', 'Aprobado'),
        error('Carta de acreditación', 'Rechazada'),
        blocked('Nombramiento', 'Pendiente'),
      ]
    case 'fully_approved':
    case 'checked_in':
      return [
        registroStep,
        done('Pago', 'Aprobado'),
        done('Carta de acreditación', 'Aprobada'),
        done('Nombramiento', 'Generado'),
      ]
    default:
      return [
        registroStep,
        blocked('Pago', 'Pendiente'),
        blocked('Carta de acreditación', 'Pendiente'),
        blocked('Nombramiento', 'Pendiente'),
      ]
  }
}

interface ProgressTrackerProps {
  status: RegistrationStatus
  isMensajero: boolean
}

export function ProgressTracker({ status, isMensajero: _ }: ProgressTrackerProps) {
  const steps = getSteps(status)

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Accent top */}
      <div className="h-[3px] bg-accent/60" />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-px flex-1 bg-border" />
          <p className="text-[10px] font-semibold text-accent uppercase tracking-[0.25em]">
            Tu progreso
          </p>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div key={step.label}>
              <div className="flex items-start gap-3">
                <StepIcon state={step.state} />
                <div className="pt-1">
                  <p className={clsx(
                    'text-sm font-semibold leading-tight',
                    step.state === 'done' && 'text-text-primary',
                    step.state === 'active' && 'text-text-primary',
                    step.state === 'error' && 'text-error',
                    step.state === 'blocked' && 'text-text-secondary',
                  )}>
                    {step.label}
                  </p>
                  <p className={clsx(
                    'text-xs mt-0.5',
                    step.state === 'done' && 'text-accent',
                    step.state === 'active' && 'text-text-secondary',
                    step.state === 'error' && 'text-error/70',
                    step.state === 'blocked' && 'text-border',
                  )}>
                    {step.sublabel}
                  </p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={clsx(
                  'ml-[17px] w-0.5 h-5 my-1 rounded-full',
                  step.state === 'done' ? 'bg-accent/30' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepIcon({ state }: { state: Step['state'] }) {
  if (state === 'done') {
    return (
      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
        <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
      </div>
    )
  }
  if (state === 'error') {
    return (
      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <X className="w-4 h-4 text-error" />
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div className="w-9 h-9 rounded-full border-2 border-accent/40 bg-accent/5 flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 text-accent" />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-bg-page border border-border flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-border" />
    </div>
  )
}
