'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { featuresConfig, type Features } from '../config/features.config'

const FlagsContext = createContext<Features>(featuresConfig)

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Features>(featuresConfig)

  useEffect(() => {
    // Suscribirse a la configuración de características del evento en Firestore
    const docRef = doc(db, 'config', 'features')
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFlags({
          tshirtEnabled: data['tshirtEnabled'] ?? featuresConfig.tshirtEnabled,
          workshopsEnabled: data['workshopsEnabled'] ?? featuresConfig.workshopsEnabled,
          roomsEnabled: data['roomsEnabled'] ?? featuresConfig.roomsEnabled,
          votingEnabled: data['votingEnabled'] ?? featuresConfig.votingEnabled,
          stripePaymentEnabled: data['stripePaymentEnabled'] ?? featuresConfig.stripePaymentEnabled,
          oxxoPaymentEnabled: data['oxxoPaymentEnabled'] ?? featuresConfig.oxxoPaymentEnabled,
        })
      }
    }, (err) => {
      console.warn('Fallo al suscribirse a las Feature Flags de Firestore (se usarán valores estáticos):', err)
    })
    return () => unsub()
  }, [])

  return (
    <FlagsContext.Provider value={flags}>
      {children}
    </FlagsContext.Provider>
  )
}

export const useFeatureFlags = () => useContext(FlagsContext)
