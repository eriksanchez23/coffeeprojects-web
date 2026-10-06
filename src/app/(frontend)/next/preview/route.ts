import { timingSafeEqual } from 'node:crypto'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { safePreviewPath } from '@/lib/cms/preview-url'

function secretMatches(given: string | null, expected: string | undefined): boolean {
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const path = safePreviewPath(url.searchParams.get('path') ?? '/', url.origin)
  if (!path || !secretMatches(url.searchParams.get('secret'), process.env.PREVIEW_SECRET)) {
    return new Response('Invalid preview request', { status: 401 })
  }
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return new Response('Login to the admin panel first', { status: 403 })

  ;(await draftMode()).enable()
  redirect(path)
}
