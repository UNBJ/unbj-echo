'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { RegistroState } from './RegistroFlow'

const COUNTRY_CODES = [
  { flag: '🇲🇽', label: 'México', code: '+52' },
  { flag: '🇺🇸', label: 'EE.UU.', code: '+1' },
  { flag: '🇨🇦', label: 'Canadá', code: '+1' },
  { flag: '🇬🇹', label: 'Guatemala', code: '+502' },
  { flag: '🇭🇳', label: 'Honduras', code: '+504' },
  { flag: '🇸🇻', label: 'El Salvador', code: '+503' },
  { flag: '🇳🇮', label: 'Nicaragua', code: '+505' },
  { flag: '🇨🇴', label: 'Colombia', code: '+57' },
]

const schema = z.object({
  fullName: z.string().min(2, 'Ingresa tu nombre completo'),
  email: z.string().email('Correo inválido'),
  phoneNumber: z.string().min(6, 'Teléfono inválido').max(15, 'Teléfono inválido'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
})

type FormData = z.infer<typeof schema>

interface Step2DatosProps {
  state: RegistroState
  onBack: () => void
  onNext: (datos: Partial<RegistroState>) => void
}

export function Step2Datos({ state, onBack, onNext }: Step2DatosProps) {
  const [countryCode, setCountryCode] = useState('+52')

  const phoneWithoutCode = state.phone.startsWith('+')
    ? state.phone.replace(/^\+\d+/, '')
    : state.phone

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: state.fullName,
      email: state.email,
      phoneNumber: phoneWithoutCode,
      birthDate: state.birthDate,
    },
  })

  function onSubmit(data: FormData) {
    onNext({
      fullName: data.fullName,
      email: data.email,
      phone: `${countryCode}${data.phoneNumber}`,
      birthDate: data.birthDate,
    })
  }

  return (
    <Card accent>
      <h2 className="text-xl font-heading font-bold text-text-primary mb-1">Datos personales</h2>
      <p className="text-sm text-text-secondary mb-6">
        Ingresa tus datos tal como aparecen en tu identificación oficial.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nombre completo"
          required
          placeholder="Juan Carlos Mendoza Ruiz"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Correo electrónico"
          type="email"
          required
          placeholder="juan@ejemplo.com"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Teléfono con selector de código de país */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Teléfono <span className="text-error">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="flex-shrink-0 border border-border rounded-lg px-2 py-2.5 text-sm text-text-primary bg-white focus:outline-none focus:border-accent"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={`${c.flag}-${c.code}`} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="55 1234 5678"
              className="flex-1 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
              {...register('phoneNumber')}
            />
          </div>
          {errors.phoneNumber && (
            <p className="mt-1 text-xs text-error">{errors.phoneNumber.message}</p>
          )}
        </div>

        <Input
          label="Fecha de nacimiento"
          type="date"
          required
          error={errors.birthDate?.message}
          {...register('birthDate')}
        />

        <div className="flex gap-3 justify-between mt-4">
          <Button type="button" variant="secondary" onClick={onBack}>
            Atrás
          </Button>
          <Button type="submit">
            Continuar
          </Button>
        </div>
      </form>
    </Card>
  )
}
