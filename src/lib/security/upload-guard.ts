import { NextResponse, type NextRequest } from 'next/server'
import { MAX_UPLOAD_BYTES } from './upload'

/** Room for the multipart envelope and the other form fields (alt text, focal point) around the file. */
const MULTIPART_OVERHEAD = 256 * 1024

/**
 * Oversized Media uploads are answered here, before Payload parses them: its own limit aborts the multipart stream
 * mid-way and the panel then shows a generic "Something went wrong". The message is what the admin toast displays.
 */
export function guardUploadSize(request: NextRequest): NextResponse | null {
  if (request.method !== 'POST' && request.method !== 'PATCH') return null
  if (!/^\/api\/media(\/|$)/.test(request.nextUrl.pathname)) return null
  const length = Number(request.headers.get('content-length') ?? 0)
  if (!Number.isFinite(length) || length <= MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD) return null
  return NextResponse.json(
    { errors: [{ message: 'El archivo supera el límite de 10 MB. / The file is larger than the 10 MB limit.' }] },
    { status: 413 },
  )
}
