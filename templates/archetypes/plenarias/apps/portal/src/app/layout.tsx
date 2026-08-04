import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Registro — CXVI Reuniones Plenarias CNBM 2026',
  description: 'Plataforma de registro para las CXVI Reuniones Plenarias de la Convención Nacional Bautista de México · 19–23 de Octubre de 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.variable}>{children}</body>
    </html>
  )
}
