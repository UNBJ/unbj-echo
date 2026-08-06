import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { branding } from '@unbj/shared'
import { FadeIn } from '@/components/ui/motion'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function RegistroCompletadoPage({ searchParams }: Props) {
  const params = await searchParams
  const token = params.token
  const eventTag = [branding.eventName, branding.dates].filter(Boolean).join(' · ')

  return (
    <div className="w-full max-w-md">
      <FadeIn>
        {/* Card */}
        <div className="bg-bg-card border border-border rounded-2xl shadow-card text-center">

          <div className="px-8 py-10">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            {/* Event tag */}
            {eventTag && (
              <p className="text-[10px] text-accent tracking-[0.14em] uppercase font-semibold mb-5">
                {eventTag}
              </p>
            )}

            <h1 className="text-xl font-heading font-semibold tracking-tight text-text-primary mb-3">
              ¡Tu registro fue exitoso!
            </h1>

            <p className="text-text-secondary text-sm leading-relaxed mb-2">
              Revisa tu correo electrónico — te enviamos un enlace para acceder a tu portal personal.
            </p>

            <p className="text-text-secondary text-sm leading-relaxed mb-8">
              Desde tu portal podrás realizar tu pago y completar el proceso de acreditación.
            </p>

            {token ? (
              <Link
                href={`/portal/${token}`}
                className="block w-full bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-all duration-150 active:scale-[0.98] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Ir a mi portal personal
              </Link>
            ) : (
              <p className="text-xs text-text-secondary">
                Revisa tu correo para acceder a tu portal.
              </p>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
