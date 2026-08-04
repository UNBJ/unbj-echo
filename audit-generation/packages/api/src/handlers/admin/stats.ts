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
    
    const byTicketTier: Record<string, number> = {}
    

    for (const r of registrations) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
      
      byTicketTier[r.ticketTier ?? 'sin_asignar'] = (byTicketTier[r.ticketTier ?? 'sin_asignar'] ?? 0) + 1
      
    }

    

    return ok({
      total: registrations.length,
      byStatus,
      
      byTicketTier,
      
    })
  } catch (err) {
    console.error('stats error:', err)
    return serverError()
  }
}
