import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Skip Payload admin/API, the draft-preview route, Next internals and files with an extension.
  matcher: ['/((?!api|admin|next|_next|_vercel|.*\\..*).*)'],
}
