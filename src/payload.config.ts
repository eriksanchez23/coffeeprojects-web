import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    theme: 'dark',
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · coffeeProjects admin', robots: 'noindex, nofollow' },
    components: {
      graphics: { Logo: '/components/admin/logo#Logo', Icon: '/components/admin/icon#Icon' },
      beforeDashboard: ['/components/admin/inbox-banner#InboxBanner'],
    },
  },
  i18n: { supportedLanguages: { en, es } },
  collections: [Contacts, Services, Projects, TeamMembers, Faqs, Media, Users],
  globals: [Home, SiteSettings, Legal],
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
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'hola@coffeeprojects.es',
        defaultFromName: 'coffeeProjects',
      })
    : undefined,
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
