import type { BrowserContext } from '@playwright/test'

/** Stores a consent choice up front (same cookie format as the banner) so the banner never covers the page. */
export async function setConsent(context: BrowserContext, baseURL: string | undefined, marketing: boolean) {
  const value = encodeURIComponent(JSON.stringify({ v: 1, marketing, ts: Date.now() }))
  await context.addCookies([{ name: 'cp_consent', value, url: baseURL ?? 'http://localhost:3000' }])
}

/**
 * Stand-in for Meta's fbevents.js: drains the bootstrap queue and records every later fbq() call in
 * window.__fbqCalls, so tests can assert exactly what would have been sent without contacting Meta.
 */
export const FBEVENTS_STUB = `(function () {
  var f = window.fbq;
  window.__fbqCalls = [];
  function rec(args) { window.__fbqCalls.push(Array.prototype.slice.call(args)); }
  (f.queue || []).forEach(rec);
  f.queue = [];
  f.callMethod = function () { rec(arguments); };
})();`

export type FbqCall = [string, ...unknown[]]
