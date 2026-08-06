import { getDb } from './firebase'
import { featuresConfig, type Features } from '../config/features'

const featureKeys: Array<keyof Features> = [
  'tshirtEnabled',
  'workshopsEnabled',
  'roomsEnabled',
  'votingEnabled',
  'stripePaymentEnabled',
  'oxxoPaymentEnabled',
]

let cachedFeatures: { value: Features; expiresAt: number } | null = null

export async function getFeatureFlags(): Promise<Features> {
  if (cachedFeatures && cachedFeatures.expiresAt > Date.now()) return cachedFeatures.value

  try {
    const snap = await getDb().collection('config').doc('features').get()
    if (!snap.exists) {
      cachedFeatures = { value: featuresConfig, expiresAt: Date.now() + 30_000 }
      return featuresConfig
    }

    const data = snap.data() ?? {}
    const merged = { ...featuresConfig }
    for (const key of featureKeys) {
      const value = data[key]
      if (typeof value === 'boolean') {
        merged[key] = value
      }
    }
    cachedFeatures = { value: merged, expiresAt: Date.now() + 30_000 }
    return merged
  } catch {
    return featuresConfig
  }
}
