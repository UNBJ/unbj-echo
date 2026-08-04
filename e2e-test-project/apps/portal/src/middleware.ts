import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Coincidir con todas las rutas excepto archivos públicos y api
  matcher: ['/', '/(es|en)/:path*']
}
