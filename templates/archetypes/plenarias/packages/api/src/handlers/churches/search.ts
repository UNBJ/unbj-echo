import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { z } from 'zod'
import { ok, badRequest } from '../../lib/response'
import { CONVENTIONS } from '../../data/churches-data'

const schema = z.object({
  conventionId: z.string().min(1),
  query: z.string().max(100).optional().default(''),
})

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
  }

  const { conventionId, query } = parsed.data

  const convention = CONVENTIONS.find((c) => c.id === conventionId)
  if (!convention) {
    return badRequest('Convención no encontrada')
  }

  let churches = convention.churches
  if (query.length >= 2) {
    const q = query.toLowerCase()
    churches = churches.filter((ch) => ch.name.toLowerCase().includes(q))
  }

  return ok({ churches })
}
