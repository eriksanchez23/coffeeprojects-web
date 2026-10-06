import type { GlobalConfig } from 'payload'
import { isTeam } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Legal: GlobalConfig = {
  slug: 'legal',
  hooks: { afterChange: [revalidateGlobal('global:legal')] },
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
