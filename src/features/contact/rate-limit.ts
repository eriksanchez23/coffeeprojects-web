import 'server-only'
import type { Payload } from 'payload'

export const MAX_PER_HOUR = 5

export { hashIp } from './ip'

export async function isRateLimited(payload: Payload, ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { totalDocs } = await payload.count({
    collection: 'contacts',
    where: { and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than: since } }] },
    overrideAccess: true,
  })
  return totalDocs >= MAX_PER_HOUR
}
