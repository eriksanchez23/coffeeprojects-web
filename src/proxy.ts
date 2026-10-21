import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { guardLockedDocuments } from './lib/security/locked-documents'

const intl = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  // The API is matched only so the guard can see it: next-intl must never touch it.
  if (request.nextUrl.pathname.startsWith('/api')) return guardLockedDocuments(request) ?? NextResponse.next()
  return intl(request)
}

export const config = {
  // Skip Payload admin/API, the draft-preview route, Next internals and files with an extension.
  // OG images are skipped too: their generated URLs use internal paths (/es/..., /fr/pricing/...) that
  // next-intl would otherwise 307 to the public path, which some link-preview scrapers do not follow.
  matcher: [
    '/((?!api|admin|next|_next|_vercel|.*\\..*|.*opengraph-image).*)',
    // S11: API-key requests to Payload's locked-documents collection are refused (src/lib/security/locked-documents.ts).
    '/api/:path*',
  ],
}
