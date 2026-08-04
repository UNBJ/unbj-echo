import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { ok } from '../../lib/response'
import { CONVENTIONS } from '../../data/churches-data'

const conventions = CONVENTIONS.map(({ id, name, code }) => ({ id, name, code }))

export async function handler(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return ok({ conventions })
}
