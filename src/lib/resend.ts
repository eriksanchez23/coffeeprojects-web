/**
 * Direct calls to the Resend REST API (https://resend.com/docs/api-reference), for what Payload's email adapter
 * does not cover: reading received emails (S21), idempotent sends and attachments (S21, S22).
 */

export const RESEND_API = 'https://api.resend.com'
const TIMEOUT_MS = 10_000

export class ResendHttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
  }
}

export async function resendRequest(apiKey: string, path: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<unknown> {
  const headers = new Headers(init.headers)
  headers.set('authorization', `Bearer ${apiKey}`)
  const res = await fetch(`${RESEND_API}${path}`, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) })
  // The response body can echo addresses or content: never surface it.
  if (!res.ok) throw new ResendHttpError(res.status)
  return res.json()
}

/** Loggable fields of a provider error: kind, status and code only (messages can echo recipients or content). */
export function errorFields(e: unknown) {
  const err = e as { name?: unknown; status?: unknown; statusCode?: unknown; code?: unknown } | null
  const pick = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? v : undefined)
  return { name: pick(err?.name), status: pick(err?.status ?? err?.statusCode), code: pick(err?.code) }
}
