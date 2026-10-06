import type { ContactInput } from '@/features/contact/schema'
import type { Attribution } from './attribution'
import { buildLeadEvent, type CapiEvent, fbcFrom } from './capi'

export type LeadContext = {
  ip?: string
  userAgent: string
  fbp?: string
  fbcCookie?: string
  attribution: Attribution | null
  sourceUrl: string
  nowSeconds: number
}

// `input.marketingConsent` must be the consent that was in force at submit time (read server-side).
export async function afterSaveLead(
  input: Pick<ContactInput, 'email' | 'phone' | 'projectType' | 'marketingConsent'>,
  eventId: string,
  ctx: LeadContext,
  send: (e: CapiEvent) => Promise<void>,
): Promise<'sent' | 'skipped'> {
  if (!input.marketingConsent) return 'skipped'
  await send(
    buildLeadEvent({
      eventId,
      email: input.email,
      phone: input.phone,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      fbp: ctx.fbp,
      fbc: fbcFrom(ctx.fbcCookie, ctx.attribution),
      sourceUrl: ctx.sourceUrl,
      projectType: input.projectType,
      nowSeconds: ctx.nowSeconds,
    }),
  )
  return 'sent'
}
