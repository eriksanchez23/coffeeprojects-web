import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { resolveDatabaseUrl } from './lib/db/database-url'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { en } from 'payload/i18n/en'
import { es } from 'payload/i18n/es'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Contacts } from './collections/Contacts'
import { Faqs } from './collections/Faqs'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Services } from './collections/Services'
import { TeamMembers } from './collections/TeamMembers'
import { Users } from './collections/Users'
import { Home } from './globals/Home'
import { Legal } from './globals/Legal'
import { Partners } from './globals/Partners'
import { Pricing } from './globals/Pricing'
import { SiteSettings } from './globals/SiteSettings'
import { inboundResendEndpoint } from './endpoints/inbound-resend'
import { shouldPushSchema } from './lib/db/push'
import { emailFrom } from './lib/email'
import { siteOrigins } from './lib/security/origins'
import { MAX_UPLOAD_BYTES } from './lib/security/upload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Absolute links (reset emails, admin) and the CSRF/CORS allow-list come from NEXT_PUBLIC_SITE_URL.
// Payload only accepts the auth cookie when Origin (or Sec-Fetch-Site) proves a trusted origin.
const { serverURL, origins } = siteOrigins(process.env)

export default buildConfig({
  ...(serverURL ? { serverURL } : {}),
  csrf: origins,
  cors: origins,
  admin: {
    user: Users.slug,
    theme: 'light',
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · CoffeeProjects admin', robots: 'noindex, nofollow' },
    components: {
      graphics: { Logo: '/components/admin/logo#Logo', Icon: '/components/admin/icon#Icon' },
      beforeDashboard: ['/components/admin/inbox-banner#InboxBanner'],
      // S20: the logged-in user's open assigned requests, under the nav links.
      afterNavLinks: ['/components/admin/assigned-requests#AssignedRequests'],
    },
  },
  i18n: { supportedLanguages: { es, en }, fallbackLanguage: 'es' },
  collections: [Contacts, Services, Projects, TeamMembers, Faqs, Media, Users],
  globals: [Home, Pricing, Partners, SiteSettings, Legal],
  localization: {
    locales: [
      { code: 'es', label: 'Español' },
      { code: 'en', label: 'English' },
      { code: 'fr', label: 'Français' },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  editor: lexicalEditor(),
  // Nothing uses GraphQL (site and admin read via the Local/REST API): one less public endpoint.
  graphQL: { disable: true },
  // S21: POST /api/inbound/resend — Resend `email.received` webhook (Svix-signed) that syncs email replies.
  endpoints: [inboundResendEndpoint],
  // Multipart parser limit for every upload (only Media): larger files get HTTP 413.
  upload: { limits: { fileSize: MAX_UPLOAD_BYTES } },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: resolveDatabaseUrl(process.env.DATABASE_URL) },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Dev push only under `next dev`; seeds, builds and deploys rely on migrations (src/lib/db/push.ts).
    push: shouldPushSchema(),
  }),
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: emailFrom().address,
        defaultFromName: emailFrom().name,
      })
    : undefined,
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      // Keep the plugin's fields (e.g. _objectKey) in the schema even when disabled locally, so generated
      // migrations match production, where the token is set and the plugin queries those columns.
      alwaysInsertFields: true,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
