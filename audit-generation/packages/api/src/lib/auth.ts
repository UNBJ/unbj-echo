import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { getFirebase, getDb } from './firebase'

export interface AdminUser {
  uid: string
  email: string
  role: 'admin' | 'super_admin'
}

export async function verifyAdminToken(event: APIGatewayProxyEventV2): Promise<AdminUser | null> {
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'] ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  try {
    const decoded = await getFirebase().auth().verifyIdToken(token)
    const role = decoded['role'] as string | undefined
    if (role !== 'admin' && role !== 'super_admin') return null
    return { uid: decoded.uid, email: decoded.email ?? '', role: role as AdminUser['role'] }
  } catch {
    return null
  }
}

export async function verifyRegistrantToken(event: APIGatewayProxyEventV2): Promise<any | null> {
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'] ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  try {
    const db = getDb()
    const snap = await db
      .collection('registrations')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (snap.empty) return null

    const doc = snap.docs[0]
    if (!doc) return null
    return { id: doc.id, ...doc.data() }
  } catch {
    return null
  }
}
