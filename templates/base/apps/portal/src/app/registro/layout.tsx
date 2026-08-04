import { branding } from '@unbj/shared'
import { Footer } from '@/components/ui/Footer'
import { Monogram } from '@/components/ui/Monogram'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Monogram size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-semibold text-text-primary">
              {branding.eventName}
            </p>
            {(branding.dates || branding.tagline) && (
              <p className="truncate text-xs text-text-secondary">
                {[branding.dates, branding.tagline].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Contenido del wizard ───────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
        <div className="flex w-full flex-1 flex-col items-center">
          {children}
        </div>
        <Footer />
      </main>

    </div>
  )
}
