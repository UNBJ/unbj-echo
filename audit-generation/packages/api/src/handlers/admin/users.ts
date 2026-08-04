import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getFirebase } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, badRequest, notFound, serverError } from '../../lib/response'

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['admin', 'super_admin']),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  if (admin.role !== 'super_admin') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Se requiere rol super_admin' }) }
  }

  const firebase = getFirebase()
  const method = event.requestContext.http.method

  if (method === 'GET') {
    try {
      const result = await firebase.auth().listUsers(100)
      const users = result.users
        .filter((u) => u.customClaims?.['role'])
        .map((u) => ({
          uid: u.uid,
          email: u.email,
          name: u.displayName ?? '',
          role: u.customClaims?.['role'],
          disabled: u.disabled,
          createdAt: u.metadata.creationTime,
        }))
      return ok({ users })
    } catch (err) {
      console.error('users GET error:', err)
      return serverError()
    }
  }

  if (method === 'POST') {
    let body: unknown
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return badRequest('Invalid JSON')
    }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')

    try {
      const user = await firebase.auth().createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        displayName: parsed.data.name,
      })
      await firebase.auth().setCustomUserClaims(user.uid, { role: parsed.data.role })
      return ok({ uid: user.uid, email: user.email })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-exists') return badRequest('Ya existe un usuario con ese correo')
      console.error('users POST error:', err)
      return serverError()
    }
  }

  if (method === 'DELETE') {
    const uid = event.pathParameters?.['uid']
    if (!uid) return notFound()
    if (uid === admin.uid) return badRequest('No puedes eliminarte a ti mismo')

    try {
      await firebase.auth().deleteUser(uid)
      return ok({ success: true })
    } catch (err) {
      console.error('users DELETE error:', err)
      return serverError()
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
}
