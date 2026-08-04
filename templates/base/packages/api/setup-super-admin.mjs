// Script one-time para asignar el rol super_admin al primer administrador.
// Uso: node scripts/setup-super-admin.mjs
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Cargar .env manualmente
const envPath = resolve(__dirname, '../../.env')
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=')
      return [key.trim(), rest.join('=').trim()]
    })
)

const SUPER_ADMIN_EMAIL = 'admin@example.com'

initializeApp({
  credential: cert({
    projectId: envVars['FIREBASE_PROJECT_ID'],
    clientEmail: envVars['FIREBASE_CLIENT_EMAIL'],
    privateKey: envVars['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
  }),
})

const auth = getAuth()

try {
  const user = await auth.getUserByEmail(SUPER_ADMIN_EMAIL)
  await auth.setCustomUserClaims(user.uid, { role: 'super_admin' })
  console.log(`✓ Custom claim "super_admin" asignado a ${SUPER_ADMIN_EMAIL} (uid: ${user.uid})`)
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    console.error(`✗ Usuario no encontrado: ${SUPER_ADMIN_EMAIL}`)
    console.error('  Créalo primero en Firebase Console → Authentication → Add user')
  } else {
    console.error('✗ Error:', err.message)
  }
  process.exit(1)
}
