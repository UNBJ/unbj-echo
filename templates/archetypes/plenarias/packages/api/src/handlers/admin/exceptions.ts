import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, badRequest, notFound, serverError } from '../../lib/response'
import type { ChurchException } from '@unbj/shared'

const createSchema = z.object({
  churchId: z.string().min(1),
  churchName: z.string().min(1),
  extraQuota: z.number().int().min(1).max(100),
  reason: z.string().min(1),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  if (admin.role !== 'super_admin') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Se requiere rol super_admin' }) }
  }

  const db = getDb()
  const method = event.requestContext.http.method

  if (method === 'GET') {
    try {
      const snap = await db.collection('churchExceptions').orderBy('createdAt', 'desc').get()
      const exceptions = snap.docs.map((d) => d.data() as ChurchException)
      return ok({ exceptions })
    } catch (err) {
      console.error('exceptions GET error:', err)
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
      const exception: ChurchException = {
        ...parsed.data,
        createdBy: admin.email,
        createdAt: new Date().toISOString(),
      }
      await db.collection('churchExceptions').doc(parsed.data.churchId).set(exception)
      return ok({ exception })
    } catch (err) {
      console.error('exceptions POST error:', err)
      return serverError()
    }
  }

  if (method === 'DELETE') {
    const churchId = event.pathParameters?.['churchId']
    if (!churchId) return notFound()

    try {
      await db.collection('churchExceptions').doc(churchId).delete()
      return ok({ success: true })
    } catch (err) {
      console.error('exceptions DELETE error:', err)
      return serverError()
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
}
