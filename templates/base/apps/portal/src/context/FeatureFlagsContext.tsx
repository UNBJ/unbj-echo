'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { featuresConfig, type Features } from '../config/features.config'

const FlagsContext = createContext<Features>(featuresConfig)

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Features>(featuresConfig)

  useEffect(() => {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'
    let cancelled = false

    async function refreshFlags() {
      try {
        const response = await fetch(`${apiUrl}/public/features`, { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled) setFlags({ ...featuresConfig, ...data })
      } catch {
        // La configuración estática permite que el portal siga disponible si la API falla.
      }
    }

    void refreshFlags()
    const intervalId = window.setInterval(refreshFlags, 60_000)
    return () => { cancelled = true; window.clearInterval(intervalId) }
  }, [])

  return (
    <FlagsContext.Provider value={flags}>
      {children}
    </FlagsContext.Provider>
  )
}

export const useFeatureFlags = () => useContext(FlagsContext)
