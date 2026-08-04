import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Footer } from '@/components/ui/Footer'

export default function PortalNotFound() {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <header className="bg-bg-sidebar text-white py-4 px-8 flex items-center gap-3">
        <span className="font-heading font-bold text-xl">CNBM</span>
        <div className="w-px h-7 bg-white/20" />
        <span className="text-text-on-dark text-sm">CXVI Reuniones Plenarias · CNBM</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <ShieldX className="w-9 h-9 text-error" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-primary mb-3">
          Enlace no válido
        </h1>
        <p className="text-text-secondary mb-8 max-w-sm">
          Este enlace no corresponde a ningún registro activo. Verifica el correo que recibiste
          o contacta a soporte.
        </p>
        <Link
          href="/"
          className="text-accent font-semibold text-sm hover:underline"
        >
          Volver al inicio
        </Link>
      </main>
      <Footer />
    </div>
  )
}
