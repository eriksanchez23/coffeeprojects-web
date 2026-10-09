# T04 — CMS model: collections, globals, access control, localization

**Files:**
- Create: `src/access/index.ts`, `src/hooks/first-user-admin.ts`, `src/fields/slug.ts`, `src/fields/seo.ts`, `src/collections/TeamMembers.ts`, `src/collections/Services.ts`, `src/collections/Projects.ts`, `src/collections/Faqs.ts`, `src/collections/Contacts.ts`, `src/globals/SiteSettings.ts`, `src/globals/Home.ts`, `src/globals/Legal.ts`, `src/features/contact/options.ts`
- Modify: `src/collections/Users.ts`, `src/collections/Media.ts`, `src/payload.config.ts`
- Generated: `src/payload-types.ts`, `src/migrations/*`
- Test: `tests/unit/access.test.ts`, `tests/unit/first-user-admin.test.ts`, `tests/unit/slug.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks besides scaffold.
- Produces:
  - Access fns: `isAdmin`, `isTeam`, `isAdminField`, `publishedOrTeam`, `nobody`
  - `projectTypes`, `budgets`, `timelines` tuples + types `ProjectType`, `Budget`, `Timeline` (in `src/features/contact/options.ts`, keys match `messages/*.json` `contact.projectTypes|budgets|timelines`)
  - `slugify(input: string): string`, `slugField()` field factory, `seoField()` field factory
  - Collection slugs: `users`, `media`, `team-members`, `services`, `projects`, `faqs`, `contacts`; global slugs: `site-settings`, `home`, `legal`
  - Generated types in `src/payload-types.ts`: `User`, `Media`, `TeamMember`, `Service`, `Project`, `Faq`, `Contact`, `SiteSetting`, `Home`, `Legal`

- [ ] **Step 1: Failing tests**

`tests/unit/access.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isAdmin, isTeam, nobody, publishedOrTeam } from '@/access'

const args = (user?: { role: 'admin' | 'editor' }) => ({ req: { user } }) as never

describe('access', () => {
  it('isAdmin only for admin role', () => {
    expect(isAdmin(args({ role: 'admin' }))).toBe(true)
    expect(isAdmin(args({ role: 'editor' }))).toBe(false)
    expect(isAdmin(args())).toBe(false)
  })
  it('isTeam for any logged-in user', () => {
    expect(isTeam(args({ role: 'editor' }))).toBe(true)
    expect(isTeam(args())).toBe(false)
  })
  it('publishedOrTeam returns a published filter for the public', () => {
    expect(publishedOrTeam(args())).toEqual({ _status: { equals: 'published' } })
    expect(publishedOrTeam(args({ role: 'editor' }))).toBe(true)
  })
  it('nobody always denies', () => {
    expect(nobody(args({ role: 'admin' }))).toBe(false)
  })
})
```

`tests/unit/first-user-admin.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { firstUserIsAdmin } from '@/hooks/first-user-admin'

const run = (totalDocs: number, operation: 'create' | 'update', role = 'editor') =>
  firstUserIsAdmin({
    data: { role },
    operation,
    req: { payload: { count: vi.fn().mockResolvedValue({ totalDocs }) } },
  } as never)

describe('firstUserIsAdmin', () => {
  it('promotes the very first user to admin', async () => {
    expect((await run(0, 'create')).role).toBe('admin')
  })
  it('keeps the requested role for later users', async () => {
    expect((await run(2, 'create')).role).toBe('editor')
  })
  it('does nothing on update', async () => {
    expect((await run(0, 'update')).role).toBe('editor')
  })
})
```

`tests/unit/slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { slugify } from '@/fields/slug'

describe('slugify', () => {
  it('removes accents and symbols', () => {
    expect(slugify('Tiendas Online & Más')).toBe('tiendas-online-mas')
  })
  it('handles French characters', () => {
    expect(slugify('Boutiques en ligne — Équipe')).toBe('boutiques-en-ligne-equipe')
  })
  it('collapses dashes and trims', () => {
    expect(slugify('  --Hola   mundo--  ')).toBe('hola-mundo')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/access.test.ts tests/unit/first-user-admin.test.ts tests/unit/slug.test.ts
```

- [ ] **Step 3: Access functions `src/access/index.ts`**

```ts
import type { Access, FieldAccess, Where } from 'payload'

type Role = 'admin' | 'editor'
type MaybeUser = { role?: Role } | null | undefined

const roleOf = (user: unknown): Role | undefined => (user as MaybeUser)?.role

export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin'
export const isTeam: Access = ({ req: { user } }) => Boolean(user)
export const nobody: Access = () => false
export const isAdminField: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin'

const published: Where = { _status: { equals: 'published' } }
export const publishedOrTeam: Access = ({ req: { user } }) => (user ? true : published)
```

- [ ] **Step 4: Hook `src/hooks/first-user-admin.ts`**

```ts
import type { CollectionBeforeChangeHook } from 'payload'

export const firstUserIsAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const { totalDocs } = await req.payload.count({ collection: 'users' })
  return totalDocs === 0 ? { ...data, role: 'admin' } : data
}
```

- [ ] **Step 5: Field factories**

`src/fields/slug.ts`:

```ts
import type { Field, FieldHook } from 'payload'

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const fillFrom =
  (source: string): FieldHook =>
  ({ value, siblingData }) => {
    if (typeof value === 'string' && value.length > 0) return slugify(value)
    const fallback = siblingData?.[source]
    return typeof fallback === 'string' ? slugify(fallback) : value
  }

export function slugField(source = 'title'): Field {
  return {
    name: 'slug',
    type: 'text',
    localized: true,
    index: true,
    required: true,
    admin: { position: 'sidebar', description: 'URL segment. Generated from the title if left empty.' },
    hooks: { beforeValidate: [fillFrom(source)] },
  }
}
```

`src/fields/seo.ts`:

```ts
import type { Field } from 'payload'

export function seoField(): Field {
  return {
    name: 'seo',
    type: 'group',
    admin: { description: 'Search engine and social preview. Leave empty to use defaults.' },
    fields: [
      { name: 'title', type: 'text', localized: true, maxLength: 60 },
      { name: 'description', type: 'textarea', localized: true, maxLength: 160 },
      { name: 'image', type: 'upload', relationTo: 'media' },
    ],
  }
}
```

- [ ] **Step 6: Run unit tests — expect PASS**

```bash
pnpm vitest run tests/unit/access.test.ts tests/unit/first-user-admin.test.ts tests/unit/slug.test.ts
```

- [ ] **Step 7: Contact options `src/features/contact/options.ts`**

```ts
export const projectTypes = ['web', 'ecommerce', 'fivem-script', 'fivem-server', 'discord-bot', 'maintenance', 'custom'] as const
export const budgets = ['lt500', '500-1500', '1500-3000', '3000-6000', 'gt6000', 'tbd'] as const
export const timelines = ['flexible', 'lt1m', '1-2m', '2-4m', 'gt4m'] as const
export const contactStatuses = ['new', 'in-progress', 'answered', 'archived'] as const

export type ProjectType = (typeof projectTypes)[number]
export type Budget = (typeof budgets)[number]
export type Timeline = (typeof timelines)[number]
export type ContactStatus = (typeof contactStatuses)[number]

export const toOptions = (values: readonly string[]) => values.map((value) => ({ label: value, value }))
```

- [ ] **Step 8: Users and Media**

`src/collections/Users.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField, isTeam } from '@/access'
import { firstUserIsAdmin } from '@/hooks/first-user-admin'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: { tokenExpiration: 60 * 60 * 8, maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role'], group: 'Team' },
  access: { read: isTeam, create: isAdmin, update: isTeam, delete: isAdmin },
  hooks: { beforeChange: [firstUserIsAdmin] },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { update: isAdminField, create: isAdminField },
    },
  ],
}
```

> `access.create: isAdmin` does not block the very first user: Payload's "create first user" flow only runs when the collection is empty.

`src/collections/Media.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isTeam } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: { read: () => true, create: isTeam, update: isTeam, delete: isTeam },
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'card', width: 800 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
  fields: [{ name: 'alt', type: 'text', required: true, localized: true }],
}
```

- [ ] **Step 9: Content collections**

`src/collections/TeamMembers.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'role', 'order', '_status'], group: 'Content' },
  versions: { drafts: true },
  defaultSort: 'order',
  access: { read: publishedOrTeam, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'role', type: 'text', required: true, localized: true },
    { name: 'location', type: 'text', required: true, localized: true },
    { name: 'since', type: 'number', required: true, min: 2000, max: 2100 },
    { name: 'shortBio', type: 'textarea', required: true, localized: true, maxLength: 200 },
    { name: 'bio', type: 'textarea', required: true, localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'skills', type: 'text', hasMany: true },
    { name: 'available', type: 'checkbox', defaultValue: true },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    {
      name: 'github',
      type: 'group',
      fields: [
        { name: 'username', type: 'text' },
        {
          name: 'fallbackRepos',
          type: 'number',
          admin: { description: 'Shown if the GitHub API is unavailable.' },
        },
        { name: 'fallbackStars', type: 'number' },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'network',
          type: 'select',
          required: true,
          options: ['github', 'linkedin', 'twitch', 'x', 'instagram', 'website', 'email'].map((v) => ({ label: v, value: v })),
        },
        { name: 'url', type: 'text', required: true },
        { name: 'handle', type: 'text' },
      ],
    },
    seoField(),
  ],
}
```

`src/collections/Services.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { projectTypes, toOptions } from '@/features/contact/options'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'

export const serviceIcons = ['globe', 'shopping-cart', 'code', 'server', 'bot', 'wrench', 'sparkles'] as const

export const Services: CollectionConfig = {
  slug: 'services',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'priceFrom', 'order', '_status'], group: 'Content' },
  versions: { drafts: true },
  defaultSort: 'order',
  access: { read: publishedOrTeam, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField('title'),
    { name: 'promise', type: 'text', required: true, localized: true, admin: { description: 'Landing hero headline' } },
    { name: 'summary', type: 'textarea', required: true, localized: true },
    { name: 'body', type: 'richText', localized: true },
    { name: 'icon', type: 'select', required: true, options: toOptions(serviceIcons) },
    {
      name: 'contactType',
      type: 'select',
      required: true,
      options: toOptions(projectTypes),
      admin: { description: 'Pre-selects this project type in the contact form' },
    },
    {
      name: 'pricing',
      type: 'group',
      fields: [
        {
          name: 'mode',
          type: 'select',
          required: true,
          defaultValue: 'one-off',
          options: [
            { label: 'One-off price from', value: 'one-off' },
            { label: 'Monthly price from', value: 'monthly' },
            { label: 'Custom quote', value: 'custom' },
            { label: 'External store', value: 'store' },
          ],
        },
        { name: 'amount', type: 'number', min: 0, admin: { condition: (_, s) => s?.mode === 'one-off' || s?.mode === 'monthly' } },
        { name: 'storeUrl', type: 'text', admin: { condition: (_, s) => s?.mode === 'store' } },
      ],
    },
    { name: 'typicalTime', type: 'text', required: true, localized: true },
    { name: 'tags', type: 'text', hasMany: true },
    {
      name: 'features',
      type: 'array',
      localized: true,
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'note', type: 'text', localized: true },
    {
      name: 'faq',
      type: 'array',
      localized: true,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    seoField(),
  ],
}
```

`src/collections/Projects.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isTeam, publishedOrTeam } from '@/access'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'year', 'status', 'featured', '_status'], group: 'Content' },
  versions: { drafts: true },
  defaultSort: '-year',
  access: { read: publishedOrTeam, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField('title'),
    { name: 'category', type: 'text', required: true, localized: true },
    { name: 'summary', type: 'textarea', required: true, localized: true },
    { name: 'body', type: 'richText', localized: true },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'stack', type: 'text', hasMany: true },
    { name: 'year', type: 'number', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'In progress', value: 'in-progress' },
      ],
    },
    { name: 'url', type: 'text', admin: { condition: (_, s) => !s?.nda } },
    { name: 'nda', type: 'checkbox', defaultValue: false },
    { name: 'featured', type: 'checkbox', defaultValue: true },
    { name: 'team', type: 'relationship', relationTo: 'team-members', hasMany: true },
    seoField(),
  ],
}
```

`src/collections/Faqs.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isTeam } from '@/access'

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'order'], group: 'Content' },
  defaultSort: 'order',
  access: { read: () => true, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'question', type: 'text', required: true, localized: true },
    { name: 'answer', type: 'textarea', required: true, localized: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
```

`src/collections/Contacts.ts`:

```ts
import type { CollectionConfig } from 'payload'
import { isAdmin, isTeam, nobody } from '@/access'
import { budgets, contactStatuses, projectTypes, timelines, toOptions } from '@/features/contact/options'

const readOnly = { readOnly: true }

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: { singular: 'Contact request', plural: 'Contact requests' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'projectType', 'status', 'utmCampaign', 'createdAt'],
    listSearchableFields: ['name', 'email', 'message'],
    group: 'Inbox',
  },
  defaultSort: '-createdAt',
  access: {
    // Public submissions go through the Server Action with the Local API (T11), never through REST.
    create: nobody,
    read: isTeam,
    update: isTeam,
    delete: isAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'status', type: 'select', required: true, defaultValue: 'new', options: toOptions(contactStatuses) },
        { name: 'assignedTo', type: 'relationship', relationTo: 'users' },
      ],
    },
    { name: 'internalNotes', type: 'textarea' },
    { name: 'name', type: 'text', required: true, admin: readOnly },
    { name: 'email', type: 'email', required: true, admin: readOnly },
    { name: 'phone', type: 'text', admin: readOnly },
    { name: 'projectType', type: 'select', required: true, options: toOptions(projectTypes), admin: readOnly },
    { name: 'budget', type: 'select', options: toOptions(budgets), admin: readOnly },
    { name: 'timeline', type: 'select', options: toOptions(timelines), admin: readOnly },
    { name: 'message', type: 'textarea', required: true, admin: readOnly },
    { name: 'howFound', type: 'text', admin: readOnly },
    { name: 'ndaRequested', type: 'checkbox', admin: readOnly },
    { name: 'privacyAccepted', type: 'checkbox', required: true, admin: readOnly },
    { name: 'marketingConsent', type: 'checkbox', admin: readOnly },
    { name: 'locale', type: 'select', options: toOptions(['es', 'en', 'fr']), admin: readOnly },
    { name: 'sourcePath', type: 'text', admin: readOnly },
    {
      type: 'collapsible',
      label: 'Attribution (Meta Ads / UTM)',
      fields: [
        { name: 'utmSource', type: 'text', admin: readOnly },
        { name: 'utmMedium', type: 'text', admin: readOnly },
        { name: 'utmCampaign', type: 'text', admin: readOnly },
        { name: 'utmContent', type: 'text', admin: readOnly },
        { name: 'utmTerm', type: 'text', admin: readOnly },
        { name: 'fbclid', type: 'text', admin: readOnly },
      ],
    },
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true } },
  ],
}
```

- [ ] **Step 10: Globals**

`src/globals/SiteSettings.ts`:

```ts
import type { GlobalConfig } from 'payload'
import { isTeam } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Settings' },
  access: { read: () => true, update: isTeam },
  fields: [
    { name: 'contactEmail', type: 'email', required: true, defaultValue: 'contact@coffeeprojects.es' },
    { name: 'tagline', type: 'text', localized: true, required: true },
    {
      name: 'chatUrl',
      type: 'text',
      admin: { description: 'Optional "Open chat" link (Discord/WhatsApp). Hidden when empty (spec Q4).' },
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        { name: 'network', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'defaultSeo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
```

`src/globals/Home.ts`:

```ts
import type { GlobalConfig } from 'payload'
import { isTeam } from '@/access'

export const Home: GlobalConfig = {
  slug: 'home',
  admin: { group: 'Content' },
  versions: { drafts: true },
  access: { read: () => true, update: isTeam },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text', localized: true, required: true },
        { name: 'headline', type: 'text', localized: true, required: true },
        { name: 'subheadline', type: 'textarea', localized: true, required: true },
        { name: 'trustLine', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'number', required: true, min: 1 },
        { name: 'prefix', type: 'text' },
        { name: 'suffix', type: 'text' },
        { name: 'label', type: 'text', localized: true, required: true },
      ],
    },
    {
      name: 'whyUs',
      type: 'array',
      localized: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    {
      name: 'process',
      type: 'array',
      localized: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea', required: true },
      ],
    },
    {
      name: 'sections',
      type: 'group',
      fields: [
        { name: 'servicesTitle', type: 'text', localized: true, required: true },
        { name: 'servicesLead', type: 'textarea', localized: true },
        { name: 'whyTitle', type: 'text', localized: true, required: true },
        { name: 'processTitle', type: 'text', localized: true, required: true },
        { name: 'teamTitle', type: 'text', localized: true, required: true },
        { name: 'teamLead', type: 'textarea', localized: true },
        { name: 'projectsTitle', type: 'text', localized: true, required: true },
        { name: 'projectsLead', type: 'textarea', localized: true },
        { name: 'stackTitle', type: 'text', localized: true, required: true },
      ],
    },
    { name: 'stack', type: 'text', hasMany: true, admin: { description: 'Technologies shown in the marquee' } },
  ],
}
```

> `stats.value` has `min: 1` — enforces the "no zero stat" constraint at the data level.

`src/globals/Legal.ts`:

```ts
import type { GlobalConfig } from 'payload'
import { isTeam } from '@/access'

export const Legal: GlobalConfig = {
  slug: 'legal',
  admin: { group: 'Settings' },
  access: { read: () => true, update: isTeam },
  fields: [
    {
      name: 'companyComplete',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Tick only when legal name, NIF/CIF and address are filled in (spec Q3). Production promotion is blocked until true.' },
    },
    { name: 'legalNotice', type: 'richText', localized: true },
    { name: 'privacyPolicy', type: 'richText', localized: true },
    { name: 'cookiePolicy', type: 'richText', localized: true },
  ],
}
```

- [ ] **Step 11: Wire `src/payload.config.ts`**

```ts
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · CoffeeProjects admin' },
  },
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
        defaultFromName: 'CoffeeProjects',
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
```

> Env note: Resend's adapter takes address and name separately. Add `EMAIL_FROM_ADDRESS=hola@coffeeprojects.es` to `.env.example` (replaces the single `EMAIL_FROM` row in the plan index).

- [ ] **Step 12: Generate types, import map, initial migration**

```bash
pnpm generate:types
pnpm generate:importmap
pnpm payload migrate:create initial
```

Dev DB (`dev` Neon branch) uses Payload's automatic schema push in `pnpm dev`. **Never** run `pnpm dev` against the `staging` or `main` branches — those only receive `payload migrate` (deploy build) to avoid push/migration drift.

- [ ] **Step 13: Manual check in admin**

```bash
pnpm dev
```

At `/admin`: groups Inbox / Content / Settings / Team are visible; locale switcher (ES/EN/FR) appears on localized fields; the first created user shows role `admin`; `Contact requests` has no "Create new" button for editors (create access is `nobody`).

- [ ] **Step 14: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(cms): add localized collections, globals, access control and initial migration"
```
