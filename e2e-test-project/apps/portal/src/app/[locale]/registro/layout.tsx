import { Cinzel } from 'next/font/google'
import { Footer } from '@/components/ui/Footer'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel',
})

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen bg-bg-page ${cinzel.variable}`}>

      {/* ── Mobile / Tablet header (< lg) ─────────────────────────── */}
      <header className="lg:hidden bg-[#1A1A2E] px-6 py-5">
        <div className="flex items-center gap-4 max-w-xl mx-auto">
          <span
            className="text-[38px] font-black leading-none text-[#E8D088] tracking-tight shrink-0"
            style={{ fontFamily: 'var(--font-cinzel)' }}
          >
            CXVI
          </span>
          <div className="w-px h-10 bg-white/20 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold tracking-[0.18em] text-white uppercase leading-tight">
              Reuniones Plenarias
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[#C8A44A] text-[9px]">►</span>
              <p className="text-[11px] text-[#C8A44A] tracking-wider">
                19 – 23 de Octubre de 2026 · CNBM
              </p>
              <span className="text-[#C8A44A] text-[9px]">◄</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Desktop layout (lg+) ──────────────────────────────────── */}
      <div className="flex min-h-screen">

        {/* Left panel — fixed, full height */}
        <aside
          className="hidden lg:flex flex-col items-center justify-center bg-[#1A1A2E] fixed left-0 top-0 h-screen w-[400px] xl:w-[440px] overflow-hidden z-10"
          aria-label="Información del evento"
        >
          {/* Decorative rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-[#C8A44A]/[0.07] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[390px] h-[390px] rounded-full border border-[#C8A44A]/[0.05] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] rounded-full border border-[#C8A44A]/[0.04] pointer-events-none" />

          {/* Subtle top gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#C8A44A]/[0.04] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#C8A44A]/[0.04] to-transparent pointer-events-none" />

          <div className="relative z-10 text-center px-12 w-full">

            {/* Top ornament */}
            <div className="flex items-center justify-center gap-3 mb-7">
              <div className="h-px w-14 bg-[#C8A44A]/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C8A44A]/70" />
              <div className="h-px w-14 bg-[#C8A44A]/40" />
            </div>

            {/* CXVI — hero numeral */}
            <p
              className="text-[110px] xl:text-[126px] font-black leading-none tracking-tight text-[#E8D088]"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              CXVI
            </p>

            {/* Gold divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-[#C8A44A]/25" />
              <span className="text-[#C8A44A]/50 text-[9px] tracking-[0.5em]">✦</span>
              <div className="h-px flex-1 bg-[#C8A44A]/25" />
            </div>

            {/* Title */}
            <h1
              className="text-[27px] xl:text-[30px] font-bold text-white tracking-[0.14em] uppercase leading-snug"
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              Reuniones<br />Plenarias
            </h1>

            {/* DE LA CNBM */}
            <div className="flex items-center gap-2 justify-center mt-3 mb-6">
              <span className="text-[#C8A44A] text-[10px]">►</span>
              <p className="text-[#C8A44A] text-[11px] tracking-[0.38em] uppercase font-semibold">
                De la CNBM
              </p>
              <span className="text-[#C8A44A] text-[10px]">◄</span>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-3 justify-center">
              <div className="h-px w-10 bg-[#C8A44A]/45" />
              <p className="text-white/70 text-[13px] tracking-[0.22em] uppercase">
                19 – 23 de Octubre
              </p>
              <div className="h-px w-10 bg-[#C8A44A]/45" />
            </div>
            <p className="text-[#C8A44A]/55 text-[11px] tracking-[0.32em] mt-1.5">2026</p>

            {/* Bottom ornament */}
            <div className="flex items-center justify-center gap-3 mt-9">
              <div className="h-px w-14 bg-[#C8A44A]/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C8A44A]/70" />
              <div className="h-px w-14 bg-[#C8A44A]/40" />
            </div>

            {/* Org name */}
            <p className="text-white/30 text-[10px] mt-7 tracking-[0.14em] uppercase leading-[1.8] max-w-[190px] mx-auto">
              Convención Nacional Bautista<br />de México, A.R.
            </p>

          </div>
        </aside>

        {/* Right panel — scrollable form */}
        <main className="flex-1 lg:ml-[400px] xl:ml-[440px] flex flex-col items-center justify-center min-h-screen px-4 py-10">
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {children}
          </div>
          <Footer />
        </main>

      </div>
    </div>
  )
}
