/** Admin "Preview" link, or null when the site URL / secret are not configured. Pure (no runtime imports). */
export function previewUrl(path: string): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.PREVIEW_SECRET
  if (!site || !secret) return null
  return `${site}/next/preview?path=${encodeURIComponent(path)}&secret=${encodeURIComponent(secret)}`
}

/** Returns a same-origin `pathname + search`, or null for anything that could leave the site. */
export function safePreviewPath(path: string, origin: string): string | null {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null
  let resolved: URL
  try {
    resolved = new URL(path, origin)
  } catch {
    return null
  }
  if (resolved.origin !== origin) return null
  return resolved.pathname + resolved.search
}
