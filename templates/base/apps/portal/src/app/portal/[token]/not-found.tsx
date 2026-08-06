import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { branding } from '@unbj/shared'
import { Footer } from '@/components/ui/Footer'
import { Monogram } from '@/components/ui/Monogram'

export default function PortalNotFound() {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <header className="bg-bg-card border-b border-border py-4 px-8 flex items-center gap-3">
        <Monogram size="sm" />
        <div className="w-px h-7 bg-border" />
        <span className="text-text-secondary text-sm">{branding.eventName}</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-6">
          <ShieldX className="w-9 h-9 text-error" />
        </div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight text-text-primary mb-3">
          Enlace no válido
        </h1>
        <p className="text-text-secondary mb-8 max-w-sm">
          Este enlace no corresponde a ningún registro activo. Verifica el correo que recibiste
          o contacta a soporte.
        </p>
        <Link
          href="/"
          className="text-accent font-medium text-sm hover:underline"
        >
          Volver al inicio
        </Link>
      </main>
      <Footer />
    </div>
  )
}
