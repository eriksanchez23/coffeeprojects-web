import { createHash } from 'node:crypto'
import type { Attribution } from './attribution'

export const CAPI_NOOP_MESSAGE = 'Meta Conversions API not configured: Lead event not sent'

export type CapiEvent = {
  event_name: 'Lead'
  event_time: number
  event_id: string
  action_source: 'website'
  event_source_url: string
  user_data: { em?: string[]; ph?: string[]; client_ip_address?: string; client_user_agent: string; fbp?: string; fbc?: string }
  custom_data: { content_category: string }
}

export type CapiConfig = { pixelId?: string; token?: string; graphVersion?: string; testEventCode?: string }

export function capiConfigFromEnv(source: Record<string, string | undefined>): CapiConfig {
  return {
    pixelId: source.NEXT_PUBLIC_META_PIXEL_ID || undefined,
    token: source.META_CAPI_TOKEN || undefined,
    graphVersion: source.META_GRAPH_VERSION || undefined,
    testEventCode: source.META_TEST_EVENT_CODE || undefined,
  }
}

// Meta wants phones as digits with the country code. Numbers written with +/00 keep theirs; a bare
// 9-digit Spanish number (the site's market) gets 34. Anything else is hashed as typed (digits only).
function normalizePhone(value: string): string {
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+')) return digits
  if (digits.startsWith('00')) return digits.slice(2)
  if (/^[6-9]\d{8}$/.test(digits)) return `34${digits}`
  return digits
}

export function sha256Normalized(value: string, kind: 'email' | 'phone'): string {
  const normalized = kind === 'email' ? value.trim().toLowerCase() : normalizePhone(value)
  return createHash('sha256').update(normalized).digest('hex')
}

export function fbcFrom(fbcCookie: string | undefined, attribution: Attribution | null | undefined): string | undefined {
  if (fbcCookie) return fbcCookie
  if (attribution?.fbclid) return `fb.1.${attribution.fbclidTs ?? Date.now()}.${attribution.fbclid}`
  return undefined
}

export function buildLeadEvent(a: {
  eventId: string
  email: string
  phone?: string
  ip?: string
  userAgent: string
  fbp?: string
  fbc?: string
  sourceUrl: string
  projectType: string
  nowSeconds: number
}): CapiEvent {
  const user_data: CapiEvent['user_data'] = {
    em: [sha256Normalized(a.email, 'email')],
    client_user_agent: a.userAgent,
  }
  if (a.ip) user_data.client_ip_address = a.ip
  if (a.phone) user_data.ph = [sha256Normalized(a.phone, 'phone')]
  if (a.fbp) user_data.fbp = a.fbp
  if (a.fbc) user_data.fbc = a.fbc
  return {
    event_name: 'Lead',
    event_time: a.nowSeconds,
    event_id: a.eventId,
    action_source: 'website',
    event_source_url: a.sourceUrl,
    user_data,
    custom_data: { content_category: a.projectType },
  }
}

type SendDeps = {
  fetch?: (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number }>
  log?: (message: string) => void
}

// Without credentials this is a logged no-op. The token travels in the body (never the URL) and failures
// surface only the HTTP status: the response body can echo submitted values.
export async function sendCapiEvent(event: CapiEvent, config: CapiConfig, deps: SendDeps = {}): Promise<void> {
  const { pixelId, token } = config
  if (!pixelId || !token) {
    deps.log?.(CAPI_NOOP_MESSAGE)
    return
  }
  const body: Record<string, unknown> = { data: [event], access_token: token }
  if (config.testEventCode) body.test_event_code = config.testEventCode
  const version = config.graphVersion || 'v24.0'
  const res = await (deps.fetch ?? fetch)(`https://graph.facebook.com/${version}/${pixelId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw Object.assign(new Error('Meta Conversions API request failed'), { name: 'CapiError', status: res.status })
}
