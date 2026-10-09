import type { Localized } from '../types'

export const settings: { shared: { contactEmail: string }; localized: Localized<{ tagline: string; defaultSeo: { title: string; description: string } }> } = {
  shared: { contactEmail: 'contact@coffeeprojects.es' },
  localized: {
    es: {
      tagline: 'Sin café no hay código.',
      defaultSeo: {
        title: 'CoffeeProjects — Desarrollo web y software a medida',
        description: 'Webs, tiendas online, bots de Discord y servidores FiveM a medida. Estudio de desarrollo en España. Propuesta en menos de 24 horas.',
      },
    },
    en: {
      tagline: 'No coffee, no code.',
      defaultSeo: {
        title: 'CoffeeProjects — Web development and custom software',
        description: 'Custom websites, online stores, Discord bots and FiveM servers. Development studio in Spain. Proposal in under 24 hours.',
      },
    },
    fr: {
      tagline: 'Pas de café, pas de code.',
      defaultSeo: {
        title: 'CoffeeProjects — Développement web et logiciels sur mesure',
        description: 'Sites web, boutiques en ligne, bots Discord et serveurs FiveM sur mesure. Studio de développement en Espagne. Proposition en moins de 24 heures.',
      },
    },
  },
}
