/** Widget action set by the contact form (turnstile-widget.tsx) and required by the server check. */
export const TURNSTILE_ACTION = 'contact'

export type SiteverifyResult = { success?: boolean; hostname?: string; action?: string }

// Cloudflare's published dummy secrets (always pass / always fail / token already spent). Their responses
// do not carry the real hostname or action, and they protect nothing anyway (dev/staging only).
const TEST_SECRETS = new Set(['1x0000000000000000000000000000000AA', '2x0000000000000000000000000000000AA', '3x0000000000000000000000000000000AA'])
export const isTestSecret = (secret: string) => TEST_SECRETS.has(secret)

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * A siteverify answer is only valid for this site: the token must have been solved on our host (or
 * localhost outside production) for the contact action, so a token minted on another page that embeds our
 * public sitekey cannot be replayed here.
 */
export function isValidTurnstileResult(
  data: SiteverifyResult,
  { siteUrl, isProduction, testSecret }: { siteUrl: string; isProduction: boolean; testSecret: boolean },
): boolean {
  if (data.success !== true) return false
  if (testSecret) return true
  const host = data.hostname?.toLowerCase()
  if (!host) return false
  const siteHost = new URL(siteUrl).hostname.toLowerCase()
  const hostOk = host === siteHost || host === `www.${siteHost}` || (!isProduction && LOCAL_HOSTS.has(host))
  return hostOk && data.action === TURNSTILE_ACTION
}
