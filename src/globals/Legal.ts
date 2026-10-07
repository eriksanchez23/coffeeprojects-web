import type { GlobalConfig } from 'payload'
import { isTeam } from '@/access'
import { adminGroups, t } from '@/fields/labels'
import { revalidateGlobal } from '@/hooks/revalidate'

export const Legal: GlobalConfig = {
  slug: 'legal',
  label: t('Legal', 'Legal'),
  hooks: { afterChange: [revalidateGlobal('global:legal')] },
  admin: { group: adminGroups.settings },
  access: { read: () => true, update: isTeam },
  fields: [
    {
      name: 'companyComplete',
      type: 'checkbox',
      label: t('Datos de empresa completos', 'Company details complete'),
      defaultValue: false,
      admin: {
        description: t(
          'Márcalo solo cuando la razón social, el NIF/CIF y la dirección estén rellenados (spec Q3). La promoción a producción está bloqueada hasta que sea verdadero.',
          'Tick only when legal name, NIF/CIF and address are filled in (spec Q3). Production promotion is blocked until true.',
        ),
      },
    },
    { name: 'legalNotice', type: 'richText', label: t('Aviso legal', 'Legal notice'), localized: true },
    { name: 'privacyPolicy', type: 'richText', label: t('Política de privacidad', 'Privacy policy'), localized: true },
    { name: 'cookiePolicy', type: 'richText', label: t('Política de cookies', 'Cookie policy'), localized: true },
  ],
}
