import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { ok, serverError } from '../../lib/response'
import type { Registration } from '@plenarias/shared'

const PAGE_SIZE = 20

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const qs = event.queryStringParameters ?? {}
  const status = qs['status'] ?? ''
  const delegateType = qs['delegateType'] ?? ''
  const search = (qs['search'] ?? '').toLowerCase().trim()
  const page = Math.max(1, parseInt(qs['page'] ?? '1', 10))

  try {
    const db = getDb()
    let query: FirebaseFirestore.Query = db.collection('registrations')

    if (status) query = query.where('status', '==', status)
    if (delegateType) query = query.where('delegateType', '==', delegateType)

    query = query.orderBy('createdAt', 'desc')

    const snap = await query.get()
    let registrations = snap.docs.map((d) => {
      const data = d.data() as Registration
      const { qrToken: _q, ...rest } = data
      return rest
    })

    // Client-side search filter (Firestore doesn't support full-text)
    if (search) {
      registrations = registrations.filter(
        (r) =>
          r.fullName.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search) ||
          false
      )
    }

    const total = registrations.length
    const offset = (page - 1) * PAGE_SIZE
    const paged = registrations.slice(offset, offset + PAGE_SIZE)

    return ok({ registrations: paged, total, page, pageSize: PAGE_SIZE })
  } catch (err) {
    console.error('list-registrations error:', err)
    return serverError()
  }
}
