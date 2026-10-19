/**
 * S23: technologies a public page reveals, by simple heuristics (first match wins, order = display order):
 *
 * | Technology   | Signal                                                                      |
 * |--------------|-----------------------------------------------------------------------------|
 * | Next.js      | `/_next/` assets, `__NEXT_DATA__`, `x-powered-by: Next.js`                   |
 * | Nuxt         | `__NUXT__`, `/_nuxt/` assets                                                 |
 * | Gatsby       | `___gatsby` root                                                             |
 * | Astro        | `<astro-island>`, `/_astro/` assets                                          |
 * | SvelteKit    | `__sveltekit`, `/_app/immutable/` assets                                     |
 * | Angular      | `ng-version="…"`                                                             |
 * | React        | implied by Next.js / Gatsby, or `data-reactroot`                             |
 * | Vue          | implied by Nuxt, or scoped-style `data-v-xxxxxxxx` attributes                |
 * | WordPress    | `wp-content/` or `wp-includes/`                                              |
 * | Shopify      | `cdn.shopify.com`, `Shopify.theme`                                           |
 * | Webflow      | `data-wf-page` / `data-wf-site`                                              |
 * | Wix          | `static.wixstatic.com`                                                       |
 * | Squarespace  | `static1.squarespace.com`                                                    |
 * | Tailwind CSS | `--tw-` custom properties or a `tailwind*.css` stylesheet (class names alone are too ambiguous) |
 * | Vercel       | `x-vercel-id` header or `server: Vercel`                                     |
 * | Netlify      | `x-nf-request-id` header or `server: Netlify`                                |
 * | (generator)  | the `<meta name="generator">` product name, version dropped, when not already listed |
 */

export interface StackInput {
  html: string
  headers: Record<string, string | undefined>
  generator?: string
}

type Rule = { name: string; test: (i: { html: string; header: (n: string) => string; found: Set<string> }) => boolean }

const RULES: Rule[] = [
  { name: 'Next.js', test: ({ html, header }) => /\/_next\/|__NEXT_DATA__/.test(html) || /next\.js/i.test(header('x-powered-by')) },
  { name: 'Nuxt', test: ({ html }) => /__NUXT__|\/_nuxt\//.test(html) },
  { name: 'Gatsby', test: ({ html }) => html.includes('___gatsby') },
  { name: 'Astro', test: ({ html }) => /<astro-island\b|\/_astro\//.test(html) },
  { name: 'SvelteKit', test: ({ html }) => /__sveltekit|\/_app\/immutable\//.test(html) },
  { name: 'Angular', test: ({ html }) => /\bng-version="/.test(html) },
  { name: 'React', test: ({ html, found }) => found.has('Next.js') || found.has('Gatsby') || /\bdata-reactroot\b/.test(html) },
  { name: 'Vue', test: ({ html, found }) => found.has('Nuxt') || /\bdata-v-[0-9a-f]{8}\b/.test(html) },
  { name: 'WordPress', test: ({ html }) => /wp-content\/|wp-includes\//.test(html) },
  { name: 'Shopify', test: ({ html }) => /cdn\.shopify\.com|Shopify\.theme/.test(html) },
  { name: 'Webflow', test: ({ html }) => /\bdata-wf-(page|site)=/.test(html) },
  { name: 'Wix', test: ({ html }) => html.includes('static.wixstatic.com') },
  { name: 'Squarespace', test: ({ html }) => html.includes('static1.squarespace.com') },
  { name: 'Tailwind CSS', test: ({ html }) => /--tw-[a-z]/.test(html) || /tailwind[\w.-]*\.css/i.test(html) },
  { name: 'Vercel', test: ({ header }) => Boolean(header('x-vercel-id')) || /^vercel$/i.test(header('server')) },
  { name: 'Netlify', test: ({ header }) => Boolean(header('x-nf-request-id')) || /^netlify$/i.test(header('server')) },
]

export function detectStack({ html, headers, generator }: StackInput): string[] {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v ?? '']))
  const header = (n: string) => lower[n] ?? ''
  const found = new Set<string>()
  for (const rule of RULES) if (rule.test({ html, header, found })) found.add(rule.name)

  // "WordPress 6.6" → "WordPress"; skip it when a rule already reported the same product.
  const product = generator?.replace(/\s+v?\d[\w.-]*.*$/, '').trim()
  const known = [...found].some((f) => product && f.toLowerCase().startsWith(product.toLowerCase().split(/[\s.]/)[0]))
  if (product && product.length <= 40 && !known) found.add(product)
  return [...found]
}
