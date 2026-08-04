import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function RegistroCompletadoPage({ searchParams }: Props) {
  const params = await searchParams
  const token = params.token

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm text-center">

        {/* Gold accent top */}
        <div className="h-[3px] bg-gradient-to-r from-[#C8A44A]/60 via-[#E8D088]/80 to-[#C8A44A]/60" />

        <div className="px-8 py-10">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[#1A1A2E] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#E8D088]" />
          </div>

          {/* Event tag */}
          <div className="flex items-center gap-2 justify-center mb-5">
            <div className="h-px w-8 bg-[#C8A44A]/50" />
            <p className="text-[10px] text-[#C8A44A] tracking-[0.3em] uppercase font-semibold">
              CXVI · 19–23 de Octubre 2026
            </p>
            <div className="h-px w-8 bg-[#C8A44A]/50" />
          </div>

          <h1 className="text-xl font-heading font-bold text-text-primary mb-3">
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
              className="block w-full bg-[#1A1A2E] hover:bg-[#2d2d50] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
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
    </div>
  )
}
