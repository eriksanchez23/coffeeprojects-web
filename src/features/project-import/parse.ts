/**
 * S23: the metadata a project import needs from a page's <head>, read with small regexes (no HTML parser
 * dependency; we only need <title> and <meta> tags). Never logged: the HTML is untrusted input.
 *
 * Hostile pages must not block the event loop, so every regex here is linear or bounded: only the first
 * 256 KB are read, each tag match is capped, attribute names can only start at a name boundary and the
 * <title> is located with indexOf-style searches instead of a lazy match.
 */

import { truncate } from './plan'

const HEAD_LIMIT = 256 * 1024
const TAG_LIMIT = 4096
const TITLE_LIMIT = 2000
// Caps on what we import (and on what derives from it: SEO title, Media alt text).
export const MAX_TITLE = 200
export const MAX_DESCRIPTION = 500

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
  return s.replace(/&(#x[0-9a-f]{1,8}|#\d{1,8}|[a-z]{1,32});/gi, (whole, ref: string) => {
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
  for (const [tag] of head.matchAll(new RegExp(`<meta\\b[^>]{0,${TAG_LIMIT}}>`, 'gi'))) {
    const attrs: Record<string, string> = {}
    // The lookbehind stops a match from starting inside a name, which made long name runs quadratic.
    for (const m of tag.matchAll(/(?<![a-z_:.-])([a-z_:.-]{1,64})\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
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

/** The text of the first <title>, if it closes within TITLE_LIMIT characters. */
function titleText(head: string): string | undefined {
  const open = /<title\b[^>]{0,256}>/i.exec(head)
  if (!open) return undefined
  const start = open.index + open[0].length
  const window = head.slice(start, start + TITLE_LIMIT)
  const close = window.search(/<\/title\s*>/i)
  return close >= 0 ? window.slice(0, close) : undefined
}

export function parsePageMeta(html: string, pageUrl: string | URL): PageMeta {
  const source = html.slice(0, HEAD_LIMIT)
  const end = source.search(/<\/head\s*>/i)
  const head = end >= 0 ? source.slice(0, end) : source
  const meta = metaTags(head)
  const get = (...keys: string[]) => keys.map((k) => tidy(meta.get(k))).find(Boolean)

  const rawTitle = get('og:site_name', 'og:title') ?? tidy(titleText(head))
  const description = get('og:description', 'description', 'twitter:description')
  const image = ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']
    .map((k) => absoluteHttpUrl(tidy(meta.get(k)), pageUrl))
    .find(Boolean)

  return {
    title: rawTitle ? truncate(cleanTitle(rawTitle), MAX_TITLE) : undefined,
    description: description && truncate(description, MAX_DESCRIPTION),
    image,
    generator: get('generator'),
  }
}
