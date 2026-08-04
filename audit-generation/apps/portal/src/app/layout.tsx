import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { FeatureFlagsProvider } from '@/context/FeatureFlagsContext'

import './globals.css'


const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Audit',
  description: 'Plataforma de registro para Audit',
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        <FeatureFlagsProvider>
          {children}
        </FeatureFlagsProvider>
      </body>
    </html>
  )
}

