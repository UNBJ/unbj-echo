import { getFirestore } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'],
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!

// Inicialización perezosa: getAuth() lanza auth/invalid-api-key durante el
// prerender del build si las credenciales todavía son placeholders.
let authInstance: Auth | null = null
export function getAuthInstance(): Auth {
  if (!authInstance) authInstance = getAuth(app)
  return authInstance
}

export const db = getFirestore(app)
