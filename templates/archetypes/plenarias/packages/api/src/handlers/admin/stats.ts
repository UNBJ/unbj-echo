import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, serverError } from '../../lib/response'
import type { Registration } from '@plenarias/shared'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }

  try {
    const db = getDb()
    const snap = await db.collection('registrations').get()
    const registrations = snap.docs.map((d) => d.data() as Registration)

    const byStatus: Record<string, number> = {}
    const byDelegate: Record<string, number> = {}
    const byConvention: Record<string, number> = {}
    const topChurches: Record<string, number> = {}

    for (const r of registrations) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
      byDelegate[r.delegateType ?? 'sin_asignar'] = (byDelegate[r.delegateType ?? 'sin_asignar'] ?? 0) + 1
      byConvention[r.conventionName] = (byConvention[r.conventionName] ?? 0) + 1
      topChurches[r.churchName] = (topChurches[r.churchName] ?? 0) + 1
    }

    const sortedChurches = Object.entries(topChurches)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    return ok({
      total: registrations.length,
      byStatus,
      byDelegate,
      byConvention,
      topChurches: sortedChurches,
    })
  } catch (err) {
    console.error('stats error:', err)
    return serverError()
  }
}
