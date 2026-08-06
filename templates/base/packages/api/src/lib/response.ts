import type { APIGatewayProxyResultV2 } from 'aws-lambda'

const securityHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, private',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

export function ok(data: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: securityHeaders,
    body: JSON.stringify(data),
  }
}

export function created(data: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode: 201,
    headers: securityHeaders,
    body: JSON.stringify(data),
  }
}

export function badRequest(message: string): APIGatewayProxyResultV2 {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  }
}

export function forbidden(message: string): APIGatewayProxyResultV2 {
  return {
    statusCode: 403,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  }
}

export function tooManyRequests(message = 'Demasiadas solicitudes. Intenta de nuevo más tarde.'): APIGatewayProxyResultV2 {
  return {
    statusCode: 429,
    headers: securityHeaders,
    body: JSON.stringify({ error: message }),
  }
}

export function notFound(message = 'Not found'): APIGatewayProxyResultV2 {
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  }
}

export function serverError(message = 'Internal server error'): APIGatewayProxyResultV2 {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  }
}
