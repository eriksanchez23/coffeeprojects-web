// Payload's built-in `payload-locked-documents` collection allows any authenticated user (hard-coded access,
// no supported override), including integration API keys (S11). Integration keys have no business there, so
// the proxy refuses API-key requests to it and leaves an audit line saying who/where they came from.

const COLLECTION = '/api/payload-locked-documents'

function normalize(pathname: string): string {
  let path = pathname
  try {
    path = decodeURIComponent(pathname)
  } catch {
    // malformed escapes: match against the raw path
  }
  return path.toLowerCase().replace(/\/{2,}/g, '/')
}

export function isLockedDocumentsPath(pathname: string): boolean {
  const path = normalize(pathname)
  return path === COLLECTION || path.startsWith(`${COLLECTION}/`)
}

/** Payload's API-key scheme is `<auth collection slug> API-Key <key>`; only `users` authenticates. */
export function usesApiKey(headers: Headers): boolean {
  return headers.get('authorization')?.startsWith('users API-Key ') ?? false
}

/** A 403 Response (plus a structured warning, never the key) for an API-key request to locked documents, else null. */
export function guardLockedDocuments(request: Request): Response | null {
  const { pathname } = new URL(request.url)
  if (!isLockedDocumentsPath(pathname) || !usesApiKey(request.headers)) return null
  console.warn(
    JSON.stringify({
      event: 'blocked_integration_locked_documents',
      method: request.method,
      path: pathname,
      ip: request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent')?.slice(0, 200) ?? null,
    }),
  )
  return Response.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })
}
