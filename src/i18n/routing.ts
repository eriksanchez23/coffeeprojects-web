import { defineRouting } from 'next-intl/routing'
import { defaultLocale, locales } from './locales'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  // Ads land on a specific language; never auto-redirect based on Accept-Language.
  localeDetection: false,
  // hreflang lives in each page's metadata (slug-aware); next-intl's Link header would duplicate/contradict it.
  alternateLinks: false,
  pathnames: {
    '/': '/',
    '/services': { es: '/servicios', en: '/services', fr: '/services' },
    '/services/[slug]': { es: '/servicios/[slug]', en: '/services/[slug]', fr: '/services/[slug]' },
    '/team': { es: '/equipo', en: '/team', fr: '/equipe' },
    '/team/[slug]': { es: '/equipo/[slug]', en: '/team/[slug]', fr: '/equipe/[slug]' },
    '/projects': { es: '/proyectos', en: '/projects', fr: '/projets' },
    '/projects/[slug]': { es: '/proyectos/[slug]', en: '/projects/[slug]', fr: '/projets/[slug]' },
    '/pricing': { es: '/presupuestos', en: '/pricing', fr: '/tarifs' },
    '/partners': { es: '/gana-dinero', en: '/earn-with-us', fr: '/gagnez-avec-nous' },
    '/contact': { es: '/contacto', en: '/contact', fr: '/contact' },
    '/contact/thanks': { es: '/contacto/gracias', en: '/contact/thanks', fr: '/contact/merci' },
    '/legal-notice': { es: '/aviso-legal', en: '/legal-notice', fr: '/mentions-legales' },
    '/privacy': { es: '/privacidad', en: '/privacy', fr: '/confidentialite' },
    '/cookies': '/cookies',
  },
})

export type AppPathname = keyof typeof routing.pathnames
