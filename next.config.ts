import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import { legacyRedirects, responseHeaders, scopeClientHintsToAdmin } from './src/lib/http-headers'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
  // ICU messages are compiled at build time, so the ICU parser (intl-messageformat) stays out of the client bundle.
  experimental: { messages: { path: './messages', format: 'json', locales: 'infer', precompile: true } },
})

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
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
