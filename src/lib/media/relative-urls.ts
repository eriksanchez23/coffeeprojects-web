// Payload builds absolute upload URLs (url, thumbnailURL, sizes.*.url) when `serverURL` is set. The frontend
// renders media with next/image, whose `localPatterns` only allow relative `/api/media/file/**` paths (the
// image optimizer must fetch from this same process, not through the public host), so own-origin URLs are
// turned back into paths on read. External URLs (e.g. a blob store) are left alone.

type Url = string | null | undefined

export function relativizeOwnOrigin<T extends Url>(value: T, serverURL: string | undefined): T {
  if (typeof value !== 'string' || !serverURL) return value
  const origin = serverURL.replace(/\/+$/, '')
  if (!value.startsWith(`${origin}/`)) return value
  return value.slice(origin.length) as T
}

type MediaSize = { url?: Url } & Record<string, unknown>
type MediaDoc = { url?: Url; thumbnailURL?: Url; sizes?: Record<string, MediaSize | null | undefined> | null }

export function relativizeMediaDoc<D extends MediaDoc>(doc: D, serverURL: string | undefined): D {
  if (!serverURL || !doc) return doc
  const out: D = { ...doc }
  if ('url' in out) out.url = relativizeOwnOrigin(out.url, serverURL)
  if ('thumbnailURL' in out) out.thumbnailURL = relativizeOwnOrigin(out.thumbnailURL, serverURL)
  if (out.sizes && typeof out.sizes === 'object') {
    out.sizes = Object.fromEntries(
      Object.entries(out.sizes).map(([name, size]) => [
        name,
        size && typeof size === 'object' ? { ...size, url: relativizeOwnOrigin(size.url, serverURL) } : size,
      ]),
    )
  }
  return out
}
