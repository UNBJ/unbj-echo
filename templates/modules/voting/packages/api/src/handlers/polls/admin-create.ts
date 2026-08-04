import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { getDb } from '../../lib/firebase'
import { verifyAdminToken } from '../../lib/auth'
import { getFeatureFlags } from '../../lib/features'
import { ok, badRequest, forbidden, serverError } from '../../lib/response'

const schema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(500).optional().default(''),
  options: z.array(z.string().min(1)).min(2).max(10),
  chartType: z.enum(['BAR', 'PIE', 'DONUT']).optional().default('BAR'),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const admin = await verifyAdminToken(event)
  if (!admin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) }
  }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Datos de propuesta inválidos. Proporciona título y al menos 2 opciones.')
  }

  const { title, description, options, chartType } = parsed.data
  const db = getDb()

  try {
    const flags = await getFeatureFlags()
    if (!flags.votingEnabled) {
      return forbidden('La votacion esta deshabilitada temporalmente.')
    }

    const pollRef = db.collection('polls').doc()
    const pollId = pollRef.id

    const formattedOptions = options.map((opt, index) => ({
      id: `opt_${index + 1}`,
      text: opt,
      order: index + 1,
    }))

    const initialResults: Record<string, number> = {}
    formattedOptions.forEach((opt) => {
      initialResults[opt.id] = 0
    })

    const pollPayload = {
      proposalId: pollId,
      title,
      description,
      options: formattedOptions,
      status: 'draft',
      chartType,
      results: initialResults,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await pollRef.set(pollPayload)

    return ok({
      success: true,
      poll: pollPayload,
    })
  } catch (err) {
    console.error('admin-create-poll error:', err)
    return serverError()
  }
}
