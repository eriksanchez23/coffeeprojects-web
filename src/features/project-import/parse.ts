/**
 * S23: the metadata a project import needs from a page's <head>, read with small regexes (no HTML parser
 * dependency; we only need <title> and <meta> tags). Never logged: the HTML is untrusted input.
 */

export interface PageMeta {
  /** og:site_name → og:title → <title>, cleaned of " | …" style suffixes. */
  title?: string
  /** og:description → meta description. */
  description?: string
  /** og:image → twitter:image, made absolute against the page URL; http(s) only. */
  image?: string
  generator?: string
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] !== '#') return ENTITIES[ref.toLowerCase()] ?? whole
    const code = ref[1].toLowerCase() === 'x' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10)
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole
  })
}

const tidy = (s: string | undefined) => {
  const out = s === undefined ? '' : decodeEntities(s).replace(/\s+/g, ' ').trim()
  return out || undefined
}

/** "Shop | Home", "Shop – Tagline", "Shop — Tagline", "Shop · Tagline" → "Shop". A plain hyphen is kept ("A-B Studio"). */
export function cleanTitle(raw: string): string {
  const title = raw.replace(/\s+/g, ' ').trim()
  const first = title.split(/\s+[|–—·]\s+/)[0].trim()
  return first || title
}

function metaTags(head: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {}
    for (const m of tag.matchAll(/([a-z_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
    }
    const key = (attrs.property ?? attrs.name ?? '').toLowerCase()
    // The first occurrence wins, as crawlers do.
    if (key && attrs.content !== undefined && !map.has(key)) map.set(key, attrs.content)
  }
  return map
}

function absoluteHttpUrl(raw: string | undefined, base: string | URL): string | undefined {
  if (!raw) return undefined
  try {
    const url = new URL(raw, base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

export function parsePageMeta(html: string, pageUrl: string | URL): PageMeta {
  const end = html.search(/<\/head\s*>/i)
  const head = end >= 0 ? html.slice(0, end) : html
  const meta = metaTags(head)
  const get = (...keys: string[]) => keys.map((k) => tidy(meta.get(k))).find(Boolean)

  const rawTitle = get('og:site_name', 'og:title') ?? tidy(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1])
  const image = ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']
    .map((k) => absoluteHttpUrl(tidy(meta.get(k)), pageUrl))
    .find(Boolean)

  return {
    title: rawTitle ? cleanTitle(rawTitle) : undefined,
    description: get('og:description', 'description', 'twitter:description'),
    image,
    generator: get('generator'),
  }
}
