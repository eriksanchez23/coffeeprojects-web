import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? '/'
  if (url.searchParams.get('secret') !== process.env.PREVIEW_SECRET || !path.startsWith('/')) {
    return new Response('Invalid preview request', { status: 401 })
  }
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return new Response('Login to the admin panel first', { status: 403 })

  ;(await draftMode()).enable()
  redirect(path)
}
