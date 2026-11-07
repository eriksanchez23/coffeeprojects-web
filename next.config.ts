import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import { legacyRedirects, nextSecurityConfig, responseHeaders, scopeClientHintsToAdmin } from './src/lib/http-headers'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
  // ICU messages are compiled at build time, so the ICU parser (intl-messageformat) stays out of the client bundle.
  experimental: { messages: { path: './messages', format: 'json', locales: 'infer', precompile: true } },
})

/**
 * Our own Vercel Blob store only (same derivation as @payloadcms/storage-vercel-blob). A wildcard over
 * *.public.blob.vercel-storage.com would let anyone make the image optimizer fetch and process files from a store
 * they control; without a Blob token (Proxmox), media is served locally from /api/media/file.
 */
const blobStoreId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
const blobHost = process.env.STORAGE_VERCEL_BLOB_BASE_URL
  ? new URL(process.env.STORAGE_VERCEL_BLOB_BASE_URL).hostname
  : blobStoreId && `${blobStoreId}.public.blob.vercel-storage.com`

const nextConfig: NextConfig = {
  ...nextSecurityConfig,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Media stored in our Vercel Blob store (preview/Vercel deployments), served from its CDN.
      ...(blobHost ? [{ protocol: 'https' as const, hostname: blobHost, pathname: '/**' }] : []),
    ],
    // Optimized images are kept for a week (Blob files already say one year): a project screenshot never
    // changes under the same name, since Payload renames re-uploads.
    minimumCacheTTL: 604800,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async headers() {
    const siteEnv = process.env.NEXT_PUBLIC_SITE_ENV
    return responseHeaders(siteEnv === 'production' || siteEnv === 'staging' ? siteEnv : 'development')
  },
  // Old-site URLs. next.config redirects run before the next-intl proxy, so the locale proxy never rewrites them first.
  async redirects() {
    return legacyRedirects
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const config = withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
const withPayloadHeaders = config.headers

export default {
  ...config,
  // Payload's admin color-scheme client hints would otherwise force a Critical-CH retry on every public page.
  headers: async () => scopeClientHintsToAdmin((await withPayloadHeaders?.()) ?? []),
} satisfies NextConfig
