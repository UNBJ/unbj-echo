'use client'

import { useState } from 'react'
import { StepIndicator } from './StepIndicator'
import { Step1Iglesia } from './Step1Iglesia'
import { Step2Datos } from './Step2Datos'
import { Step3Confirmacion } from './Step3Confirmacion'
import type { ChurchSelection } from './Step1Iglesia'

export interface RegistroState {
  church: ChurchSelection | null
  fullName: string
  email: string
  phone: string
  birthDate: string
  extraFields: Record<string, string>
}

const initialState: RegistroState = {
  church: null,
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  extraFields: {},
}

type Step = 1 | 2 | 3

export function RegistroFlow() {
  const [step, setStep] = useState<Step>(1)
  const [state, setState] = useState<RegistroState>(initialState)

  function updateState(partial: Partial<RegistroState>) {
    setState((prev) => ({ ...prev, ...partial }))
  }

  return (
    <div className="w-full max-w-xl">
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Step1Iglesia
          selected={state.church}
          onNext={(church) => {
            updateState({ church })
            setStep(2)
          }}
        />
      )}

      {step === 2 && (
        <Step2Datos
          state={state}
          onBack={() => setStep(1)}
          onNext={(datos) => {
            updateState(datos)
            setStep(3)
          }}
        />
      )}

      {step === 3 && state.church && (
        <Step3Confirmacion
          state={state}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  )
}
