import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * S21: sync replies sent by email to the team notification. The notification's Reply-To is a signed
 * per-request relay address on the Resend inbound subdomain (r+<id>.<mac>@<domain>); Resend posts the
 * received email to our webhook (`email.received`, signed with Svix), which forwards the new text to the
 * client and stores it in the request's reply history. Pure helpers only: no I/O here.
 */

const RELAY_CONTEXT = 'coffeeprojects:contact:relay:v1'
const MAC_HEX = 20 // 80 bits: enough to make guessing a valid address for a request impractical.
const SVIX_TOLERANCE_S = 5 * 60

/** The relay HMAC key, derived from the Payload secret with a fixed context (never the raw secret). */
export function relayKey(secret: string): Buffer {
  return createHmac('sha256', secret).update(RELAY_CONTEXT).digest()
}

export type InboundConfig = { apiKey: string; domain: string; webhookSecret: string; key: Buffer }

/** Inbound sync is on only when the API key, the inbound domain, the webhook secret and the Payload secret are all set. */
export function inboundConfig(source: Record<string, string | undefined>): InboundConfig | null {
  const apiKey = source.RESEND_API_KEY?.trim()
  const domain = source.RESEND_INBOUND_DOMAIN?.trim().toLowerCase()
  const webhookSecret = source.RESEND_WEBHOOK_SECRET?.trim()
  const secret = source.PAYLOAD_SECRET
  if (!apiKey || !domain || !webhookSecret || !secret) return null
  return { apiKey, domain, webhookSecret, key: relayKey(secret) }
}

const mac = (id: number, key: Buffer) => createHmac('sha256', key).update(String(id)).digest('hex').slice(0, MAC_HEX)

export function relayAddress(contactId: number, domain: string, key: Buffer): string {
  return `r+${contactId}.${mac(contactId, key)}@${domain.toLowerCase()}`
}

/** Reply-To of the team notification: the relay address when inbound is configured, otherwise the client (as before). */
export function teamReplyTo(contactId: number | string, clientEmail: string, config: InboundConfig | null): string {
  const id = Number(contactId)
  return config && Number.isSafeInteger(id) && id > 0 ? relayAddress(id, config.domain, config.key) : clientEmail
}

const ADDRESS = /^[^\s<>@"]+@[^\s<>@"]+$/

/** The bare, lowercased address of `addr@x` or `Name <addr@x>`; null when it is not one address. */
export function emailAddress(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim()
  const angle = /<([^<>]*)>\s*$/.exec(raw)
  const candidate = (angle ? angle[1]! : raw).trim().toLowerCase()
  return ADDRESS.test(candidate) ? candidate : null
}

/** The request id a relay address points to, or null if it is not one of ours or its signature does not match. */
export function parseRelayAddress(value: string | null | undefined, domain: string, key: Buffer): number | null {
  const address = emailAddress(value)
  const m = address ? /^r\+(\d{1,12})\.([0-9a-f]{20})@(.+)$/.exec(address) : null
  if (!m || m[3] !== domain.toLowerCase()) return null
  const id = Number(m[1])
  if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== m[1]) return null
  const expected = Buffer.from(mac(id, key))
  const given = Buffer.from(m[2]!)
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null
}

/**
 * Svix webhook signature (what Resend uses): base64 HMAC-SHA256 of `${id}.${timestamp}.${body}` keyed with
 * the base64 part of `whsec_…`. The header may hold several space-separated `v1,<sig>` entries.
 * Timestamps more than 5 minutes away from now are rejected (replay protection).
 */
export function verifySvixSignature(input: {
  secret: string
  id: string
  timestamp: string
  body: string
  signature: string
  nowSeconds: number
}): boolean {
  const { secret, id, timestamp, body, signature, nowSeconds } = input
  if (!id || !/^\d{1,12}$/.test(timestamp) || Math.abs(nowSeconds - Number(timestamp)) > SVIX_TOLERANCE_S) return false
  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret, 'base64')
  if (key.length === 0) return false
  const expected = Buffer.from(createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64'))
  return signature
    .split(' ')
    .map((entry) => entry.split(','))
    .some(([version, sig]) => {
      if (version !== 'v1' || !sig) return false
      const given = Buffer.from(sig)
      return given.length === expected.length && timingSafeEqual(given, expected)
    })
}

/** The team user who sent the email (case-insensitive address match), or null for anybody else. */
export function findTeamSender<U extends { email?: string | null }>(from: string | null | undefined, users: readonly U[]): U | null {
  const address = emailAddress(from)
  if (!address) return null
  return users.find((u) => u.email?.trim().toLowerCase() === address) ?? null
}

type AuthResult = 'pass' | 'fail' | 'gray' | 'processing_failed' | 'unknown' | (string & {})
export type InboundAuthentication = { spf?: AuthResult | null; dkim?: AuthResult | null; dmarc?: AuthResult | null }

/**
 * Resend's SPF/DKIM/DMARC results for the received email. Only DMARC proves the From domain is aligned:
 * an SPF/DKIM pass alone may belong to the sender's own (attacker) domain, so it is not enough. Fails
 * closed: missing results or a missing DMARC verdict cannot prove the sender, so the email is ignored.
 */
export function senderAuthenticated(auth: InboundAuthentication | null | undefined): boolean {
  return auth?.dmarc === 'pass'
}

const REPLY_HEADERS = [
  /^on\b.+\bwrote:\s*$/i, // Gmail / Apple Mail (en)
  /^el\b.+\bescribi[oó]:\s*$/i, // Gmail (es)
  /^le\b.+\ba [ée]crit\s*:\s*$/i, // Gmail (fr)
  /^-{2,}\s*(original message|mensaje original|message d'origine)\s*-{2,}\s*$/i, // Outlook
]
const OUTLOOK_FROM = /^(from|de)\s*:/i
const OUTLOOK_FIELD = /^(sent|date|to|subject|enviado|fecha|para|asunto|envoy[ée]|à|objet)\s*:/i
const OUTLOOK_RULE = /^_{10,}$/
// Heading of our own team notification: anything from here on is quoted internal data (admin link, UTM, consents).
const NOTIFICATION_HEADING = /nueva solicitud desde coffeeprojects.es/i

/**
 * The new text of an email reply: everything above the quoted history (Gmail "On … wrote:" in en/es/fr,
 * Outlook "-----Original Message-----" or a From:/Sent: header block), without `>` quoted lines.
 */
export function stripQuotedReply(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let end = lines.length
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim()
    const next = (lines[i + 1] ?? '').trim()
    const header = REPLY_HEADERS.some((re) => re.test(line) || (next && re.test(`${line} ${next}`)))
    const outlookBlock = OUTLOOK_FROM.test(line) && OUTLOOK_FIELD.test(next)
    const outlookRule = OUTLOOK_RULE.test(line) && OUTLOOK_FROM.test(next)
    if (header || outlookBlock || outlookRule || NOTIFICATION_HEADING.test(line)) {
      end = i
      break
    }
  }
  return lines
    .slice(0, end)
    .filter((l) => !l.trimStart().startsWith('>'))
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const ENTITIES: Record<string, string> = {
  nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", euro: '€', iexcl: '¡', iquest: '¿', laquo: '«', raquo: '»',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü', ccedil: 'ç',
  agrave: 'à', egrave: 'è', ugrave: 'ù', acirc: 'â', ecirc: 'ê', icirc: 'î', ocirc: 'ô', ucirc: 'û', euml: 'ë', iuml: 'ï',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Ccedil: 'Ç', Agrave: 'À', Egrave: 'È',
}

/** Plain text from an HTML-only email: blocks/breaks become new lines; quoted blocks, styles and tags are dropped. */
export function htmlToText(html: string): string {
  let s = html.replace(/<(style|script|head|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
  // Innermost blockquotes first, so nested quotes are removed whole.
  for (let prev = ''; prev !== s; ) {
    prev = s
    s = s.replace(/<blockquote\b[^>]*>(?:(?!<blockquote\b)[\s\S])*?<\/blockquote\s*>/gi, '')
  }
  s = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d{1,7});/g, (m, d: string) => safeCodePoint(Number(d)) ?? m)
    .replace(/&#x([0-9a-f]{1,6});/gi, (m, h: string) => safeCodePoint(parseInt(h, 16)) ?? m)
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name] ?? m)
    .replace(/&amp;/g, '&')
  return s
    .split('\n')
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function safeCodePoint(n: number): string | undefined {
  return Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : undefined
}
