'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Award, GraduationCap, Ticket, Check } from 'lucide-react'
import { clsx } from 'clsx'

const TIERS = [
  {
    id: 'general',
    name: 'General',
    price: '$50 USD',
    description: 'Acceso completo al evento principal, conferencias generales y material de bienvenida.',
    icon: Ticket,
    color: 'border-border hover:border-gray-400',
    iconColor: 'text-blue-500 bg-blue-50',
  },
  {
    id: 'student',
    name: 'Estudiante',
    price: '$25 USD',
    description: 'Descuento especial para estudiantes activos (requiere credencial vigente al ingresar).',
    icon: GraduationCap,
    color: 'border-border hover:border-gray-400',
    iconColor: 'text-emerald-500 bg-emerald-50',
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '$100 USD',
    description: 'Acceso preferente, asientos reservados, kit VIP exclusivo y meet & greet con ponentes.',
    icon: Award,
    color: 'border-amber-200/80 bg-amber-50/20 hover:border-amber-400',
    iconColor: 'text-amber-600 bg-amber-100/60',
    badge: 'Recomendado',
  },
] as const

interface Step2TierProps {
  selected: 'general' | 'student' | 'vip' | null
  onBack: () => void
  onNext: (tier: 'general' | 'student' | 'vip') => void
}

export function Step2Tier({ selected, onBack, onNext }: Step2TierProps) {
  // A local helper to handle selection state change
  const handleSelect = (tierId: 'general' | 'student' | 'vip') => {
    onNext(tierId)
  }

  return (
    <Card accent>
      <h2 className="text-xl font-heading font-bold text-text-primary mb-1">Selecciona tu entrada</h2>
      <p className="text-sm text-text-secondary mb-6">
        Elige el tipo de acceso que deseas para el evento. Podrás realizar el pago en el siguiente paso.
      </p>

      <div className="flex flex-col gap-4 mb-6">
        {TIERS.map((tier) => {
          const IconComponent = tier.icon
          const isSelected = selected === tier.id

          return (
            <div
              key={tier.id}
              onClick={() => handleSelect(tier.id)}
              className={clsx(
                'relative flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none bg-white',
                isSelected ? 'border-[#1A1A2E] ring-1 ring-[#1A1A2E]/20 bg-[#1A1A2E]/[0.01]' : tier.color
              )}
            >
              {/* Badge for VIP */}
              {'badge' in tier && (
                <span className="absolute top-0 right-5 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1A1A2E] text-white">
                  {tier.badge}
                </span>
              )}

              {/* Selector Circle */}
              <div className="mt-1 flex-shrink-0">
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                    isSelected ? 'border-[#1A1A2E] bg-[#1A1A2E]' : 'border-gray-300 bg-white'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </div>

              {/* Icon */}
              <div className={clsx('p-2.5 rounded-lg flex-shrink-0', tier.iconColor)}>
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <h3 className="font-heading font-bold text-sm text-text-primary">{tier.name}</h3>
                  <span className="text-sm font-bold text-text-primary">{tier.price}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{tier.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          Atrás
        </Button>
      </div>
    </Card>
  )
}
