import { clsx } from 'clsx'
import { Check } from 'lucide-react'

const STEPS = [
  { label: 'Iglesia' },
  { label: 'Datos personales' },
  { label: 'Confirmación' },
]

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      {/* Step label */}
      <p className="text-[11px] text-text-secondary tracking-[0.18em] uppercase text-center mb-5">
        Paso {currentStep} de {STEPS.length}
      </p>

      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const num = i + 1
          const done = num < currentStep
          const active = num === currentStep
          const inactive = !done && !active

          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-2 relative">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200',
                    done && 'bg-[#1A1A2E] text-white shadow-sm',
                    active && 'bg-[#1A1A2E] text-white shadow-md ring-4 ring-[#1A1A2E]/10',
                    inactive && 'bg-white border-2 border-border text-text-secondary'
                  )}
                >
                  {done
                    ? <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    : <span className={clsx('text-[13px]', active ? 'text-white' : 'text-text-secondary')}>{num}</span>
                  }
                </div>
                <span
                  className={clsx(
                    'text-[11px] whitespace-nowrap font-medium tracking-wide',
                    active && 'text-[#1A1A2E]',
                    done && 'text-[#1A1A2E]/60',
                    inactive && 'text-text-secondary'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-3 mb-5 relative h-px">
                  <div className="absolute inset-0 bg-border" />
                  <div
                    className="absolute inset-0 bg-[#1A1A2E] origin-left transition-transform duration-300"
                    style={{ transform: done ? 'scaleX(1)' : 'scaleX(0)' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
