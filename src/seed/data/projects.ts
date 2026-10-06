import type { SeedDoc } from '../types'

type ProjectShared = { stack: string[]; year: number; status: 'live' | 'in-progress'; url?: string; nda: boolean; featured: boolean }
type ProjectLocalized = { slug: string; title: string; category: string; summary: string }

export const projects: SeedDoc<ProjectShared, ProjectLocalized>[] = [
  {
    shared: { stack: ['Next.js', 'Payload CMS', 'GSAP', 'Three.js'], year: 2026, status: 'live', url: 'https://coffeeprojects.es', nda: false, featured: true },
    localized: {
      es: { slug: 'coffeeprojects-es', title: 'coffeeprojects.es', category: 'Web corporativa', summary: 'Nuestra propia web: diseño y desarrollo completo, trilingüe, con panel de gestión propio, animaciones y SEO técnico.' },
      en: { slug: 'coffeeprojects-es', title: 'coffeeprojects.es', category: 'Corporate website', summary: 'Our own website: full design and development, trilingual, with its own admin panel, animations and technical SEO.' },
      fr: { slug: 'coffeeprojects-es', title: 'coffeeprojects.es', category: "Site d'entreprise", summary: "Notre propre site : design et développement complets, trilingue, avec son propre panneau d'administration, des animations et un SEO technique." },
    },
  },
  {
    shared: { stack: ['HTML', 'CSS', 'JavaScript'], year: 2025, status: 'live', nda: true, featured: true },
    localized: {
      es: { slug: 'portal-web-institucional', title: 'Portal web institucional', category: 'Web institucional', summary: 'Rediseño y mejora de rendimiento de la web de un ayuntamiento: mayor accesibilidad, velocidad de carga y una navegación más clara.' },
      en: { slug: 'institutional-web-portal', title: 'Institutional web portal', category: 'Public sector website', summary: "Redesign and performance improvements for a town council's website: better accessibility, faster loading and clearer navigation." },
      fr: { slug: 'portail-web-institutionnel', title: 'Portail web institutionnel', category: 'Site institutionnel', summary: "Refonte et amélioration des performances du site d'une mairie : meilleure accessibilité, chargement plus rapide et navigation plus claire." },
    },
  },
  {
    shared: { stack: ['React', 'Node.js'], year: 2026, status: 'in-progress', nda: false, featured: true },
    localized: {
      es: { slug: 'que-comemos-hoy', title: '¿Qué comemos hoy?', category: 'Aplicación web', summary: 'Aplicación web para gestionar y decidir el menú del día, con recetas, filtros por ingredientes y sugerencias aleatorias.' },
      en: { slug: 'what-should-we-eat-today', title: 'What should we eat today?', category: 'Web app', summary: "A web app to plan and decide the day's menu, with recipes, ingredient filters and random suggestions." },
      fr: { slug: 'on-mange-quoi-aujourd-hui', title: "On mange quoi aujourd'hui ?", category: 'Application web', summary: 'Une application web pour organiser et choisir le menu du jour, avec recettes, filtres par ingrédients et suggestions aléatoires.' },
    },
  },
  {
    shared: { stack: ['React', 'Dashboard'], year: 2026, status: 'in-progress', nda: true, featured: true },
    localized: {
      es: { slug: 'trading-journal', title: 'Trading Journal', category: 'Dashboard privado', summary: 'Plataforma privada de seguimiento de operaciones financieras: registro de operaciones, métricas de rendimiento y estadísticas visuales.' },
      en: { slug: 'trading-journal', title: 'Trading Journal', category: 'Private dashboard', summary: 'Private platform to track financial trades: trade log, performance metrics and visual statistics.' },
      fr: { slug: 'trading-journal', title: 'Trading Journal', category: 'Tableau de bord privé', summary: 'Plateforme privée de suivi des opérations financières : journal des opérations, indicateurs de performance et statistiques visuelles.' },
    },
  },
]
