'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRegistration } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { RegistroState } from './RegistroFlow'

interface Step3ConfirmacionProps {
  state: RegistroState
  onBack: () => void
}

export function Step3Confirmacion({ state, onBack }: Step3ConfirmacionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const result = await createRegistration({
        
        
        ticketTier: state.ticketTier!,
        
        fullName: state.fullName,
        email: state.email,
        phone: state.phone,
        birthDate: state.birthDate,
        extraFields: state.extraFields,
      })
      
      const tipoQuery = result.delegateType ? `&tipo=${result.delegateType}` : ''
      router.push(`/registro/completado?token=${result.token}${tipoQuery}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card accent>
      <h2 className="text-xl font-heading font-bold text-text-primary mb-1">Confirma tu pre-registro</h2>
      <p className="text-sm text-text-secondary mb-6">
        Revisa tus datos antes de enviar. Recibirás un correo de confirmación.
      </p>

      <dl className="flex flex-col gap-3 text-sm mb-6">
        
        
        <Row label="Acceso / Entrada" value={state.ticketTier === 'vip' ? 'VIP' : state.ticketTier === 'student' ? 'Estudiante' : 'General'} />
        <div className="border-t border-border pt-3" />
        
        <Row label="Nombre completo" value={state.fullName} />
        <Row label="Correo" value={state.email} />
        <Row label="Teléfono" value={state.phone} />
        <Row label="Fecha de nacimiento" value={state.birthDate} />
      </dl>

      {error && (
        <div className="p-3 bg-red-50 border border-error/30 rounded-lg mb-4 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-between">
        <Button type="button" variant="secondary" onClick={onBack} disabled={loading}>
          Atrás
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Confirmar registro
        </Button>
      </div>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-text-primary font-medium text-right">{value}</dd>
    </div>
  )
}
