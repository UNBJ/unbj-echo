'use client'

import { useState } from 'react'
import { StepIndicator } from './StepIndicator'
import { Step2Datos } from './Step2Datos'
import { Step3Confirmacion } from './Step3Confirmacion'




import { Step2Tier } from './Step2Tier'


export interface RegistroState {
  fullName: string
  email: string
  phone: string
  birthDate: string
  extraFields: Record<string, string>
  
  
  ticketTier: 'general' | 'student' | 'vip' | null
  
}

const initialState: RegistroState = {
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  extraFields: {},
  
  
  ticketTier: null,
  
}

export function RegistroFlow() {
  
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  const [state, setState] = useState<RegistroState>(initialState)

  function updateState(partial: Partial<RegistroState>) {
    setState((prev) => ({ ...prev, ...partial }))
  }

  return (
    <div className="w-full max-w-xl">
      <StepIndicator currentStep={step} totalSteps={3} />

      {/* --- STANDARD ARCHETYPE FLOW --- */}
      

      {/* --- ROLES ARCHETYPE FLOW --- */}
      
        {step === 1 && (
          <Step2Datos
            state={state}
            onBack={() => {}}
            onNext={(datos) => {
              updateState(datos)
              setStep(2)
            }}
          />
        )}

        {step === 2 && (
          <Step2Tier
            selected={state.ticketTier}
            onBack={() => setStep(1)}
            onNext={(ticketTier) => {
              updateState({ ticketTier })
              setStep(3)
            }}
          />
        )}

        {step === 3 && (
          <Step3Confirmacion
            state={state}
            onBack={() => setStep(2)}
          />
        )}
      

      {/* --- PLENARIAS ARCHETYPE FLOW --- */}
      
    </div>
  )
}
