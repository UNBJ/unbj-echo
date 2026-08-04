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

export async function getFeatureFlags(): Promise<Features> {
  try {
    const snap = await getDb().collection('config').doc('features').get()
    if (!snap.exists) return featuresConfig

    const data = snap.data() ?? {}
    const merged = { ...featuresConfig }
    for (const key of featureKeys) {
      const value = data[key]
      if (typeof value === 'boolean') {
        merged[key] = value
      }
    }
    return merged
  } catch {
    return featuresConfig
  }
}
