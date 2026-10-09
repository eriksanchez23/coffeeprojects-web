import type { GlobalConfig } from 'payload'
import { isTeam } from '@/access'
import { adminGroups, t } from '@/fields/labels'
import { revalidateGlobal } from '@/hooks/revalidate'
import { safeUrlValidator } from '@/lib/security/url'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: t('Ajustes del sitio', 'Site settings'),
  hooks: { afterChange: [revalidateGlobal('global:site-settings')] },
  admin: { group: adminGroups.settings },
  access: { read: () => true, update: isTeam },
  fields: [
    {
      name: 'contactEmail',
      type: 'email',
      label: t('Correo de contacto', 'Contact email'),
      required: true,
      defaultValue: 'contact@coffeeprojects.es',
    },
    { name: 'tagline', type: 'text', label: t('Lema', 'Tagline'), localized: true, required: true },
    {
      name: 'chatUrl',
      type: 'text',
      validate: safeUrlValidator(),
      label: t('URL del chat', 'Chat URL'),
      admin: {
        description: t(
          'Enlace opcional de «Abrir chat» (Discord/WhatsApp). Se oculta si está vacío (spec Q4).',
          'Optional "Open chat" link (Discord/WhatsApp). Hidden when empty (spec Q4).',
        ),
      },
    },
    {
      name: 'socials',
      type: 'array',
      label: t('Redes sociales', 'Social links'),
      labels: { singular: t('Red social', 'Social link'), plural: t('Redes sociales', 'Social links') },
      fields: [
        { name: 'network', type: 'text', label: t('Red', 'Network'), required: true },
        // Free-text network: http(s) or mailto: links.
        { name: 'url', type: 'text', label: t('URL', 'URL'), required: true, validate: safeUrlValidator({ allowMailto: () => true }) },
      ],
    },
    {
      name: 'defaultSeo',
      type: 'group',
      label: t('SEO por defecto', 'Default SEO'),
      fields: [
        { name: 'title', type: 'text', label: t('Título', 'Title'), localized: true },
        { name: 'description', type: 'textarea', label: t('Descripción', 'Description'), localized: true },
        { name: 'image', type: 'upload', label: t('Imagen', 'Image'), relationTo: 'media' },
      ],
    },
  ],
}
