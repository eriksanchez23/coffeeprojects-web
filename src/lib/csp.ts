// Content-Security-Policy for every non-admin route (the Payload admin has its own needs and is auth-protected).
//
// Trade-off: 'unsafe-inline' for scripts. Next.js inline bootstrap/flight scripts and the Meta Pixel
// bootstrap (inline, embeds the env pixel id, so a static sha256 hash is not possible) would need
// per-request nonces, which force dynamic rendering and disable ISR/static output. Static headers
// from next.config cannot carry nonces, so this follows the brief. No 'unsafe-eval' outside development.
export function buildCsp({ dev }: { dev: boolean }): string {
  const d: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https://connect.facebook.net', // Meta Pixel fbevents.js (T12)
      'https://challenges.cloudflare.com', // Turnstile api.js (T11)
      // Vercel Analytics / Speed Insights load from same-origin /_vercel/* in production; their debug builds come from va.vercel-scripts.com.
      ...(dev ? ['https://va.vercel-scripts.com', "'unsafe-eval'"] : []),
    ],
    // React/GSAP write inline style attributes (T14); Tailwind output is same-origin.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://avatars.githubusercontent.com',
      'https://www.facebook.com', // Pixel tracking image
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https://www.facebook.com',
      'https://connect.facebook.net',
      'https://challenges.cloudflare.com',
      ...(dev ? ['https://va.vercel-scripts.com', 'ws:'] : []),
    ],
    'frame-src': ['https://challenges.cloudflare.com'],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
  }
  const parts = Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`)
  if (!dev) parts.push('upgrade-insecure-requests')
  return parts.join('; ')
}
