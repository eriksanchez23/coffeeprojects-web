import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Skip Payload admin/API, the draft-preview route, Next internals and files with an extension.
  // OG images are skipped too: their generated URLs use internal paths (/es/..., /fr/pricing/...) that
  // next-intl would otherwise 307 to the public path, which some link-preview scrapers do not follow.
  matcher: ['/((?!api|admin|next|_next|_vercel|.*\\..*|.*opengraph-image).*)'],
}
