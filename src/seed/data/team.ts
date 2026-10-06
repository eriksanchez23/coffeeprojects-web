import type { SeedDoc } from '../types'

type TeamShared = {
  name: string
  since: number
  skills: string[]
  order: number
  available: boolean
  github: { username?: string; fallbackRepos?: number; fallbackStars?: number }
  socials: { network: string; url: string; handle?: string }[]
}
type TeamLocalized = { slug: string; role: string; location: string; shortBio: string; bio: string }

export const team: SeedDoc<TeamShared, TeamLocalized>[] = [
  {
    shared: {
      name: 'Erik',
      since: 2026,
      skills: ['HTML', 'CSS', 'JavaScript', 'Astro', 'TypeScript', 'C#', 'Java', 'Python', 'Kotlin'],
      order: 1,
      available: true,
      // Username pending (spec Q1). Fallback shows the real public repo count meanwhile.
      github: { fallbackRepos: 3 },
      socials: [{ network: 'email', url: 'mailto:contact@coffeeprojects.es', handle: 'contact@coffeeprojects.es' }],
    },
    localized: {
      es: {
        slug: 'erik',
        role: 'Diseño & Relación con clientes',
        location: 'Murcia, España',
        shortBio: 'Tu primer contacto con coffeeProjects. Convierte tus ideas en diseños claros y se asegura de que el resultado final sea exactamente lo que necesitas.',
        bio: 'Erik es la persona con la que hablarás primero. Se encarga del diseño y de acompañarte durante todo el proyecto: escucha lo que necesitas, lo traduce en una propuesta visual clara y vela por que cada entrega cumpla lo acordado. Su base técnica, que va del desarrollo web con Astro y TypeScript a lenguajes como C#, Java, Python y Kotlin, le permite diseñar pensando en cómo se va a construir. Así evita sorpresas y consigue que diseño y desarrollo hablen el mismo idioma. Para ti, eso significa una comunicación cercana, respuestas rápidas y un proyecto que avanza sin malentendidos.',
      },
      en: {
        slug: 'erik',
        role: 'Design & Client Relations',
        location: 'Murcia, Spain',
        shortBio: 'Your first contact at coffeeProjects. He turns your ideas into clear designs and makes sure the final result is exactly what you need.',
        bio: "Erik is the first person you'll talk to. He leads design and stays with you throughout the project: he listens to what you need, turns it into a clear visual proposal and makes sure every delivery matches what was agreed. His technical background, from web development with Astro and TypeScript to languages such as C#, Java, Python and Kotlin, lets him design with the build in mind. That avoids surprises and keeps design and development speaking the same language. For you, that means close communication, fast answers and a project that moves forward without misunderstandings.",
      },
      fr: {
        slug: 'erik',
        role: 'Design & Relation client',
        location: 'Murcie, Espagne',
        shortBio: 'Votre premier contact chez coffeeProjects. Il transforme vos idées en designs clairs et veille à ce que le résultat final corresponde exactement à vos besoins.',
        bio: "Erik est la première personne avec qui vous échangerez. Il s'occupe du design et vous accompagne tout au long du projet : il écoute vos besoins, les traduit en une proposition visuelle claire et veille à ce que chaque livraison respecte ce qui a été convenu. Sa base technique, du développement web avec Astro et TypeScript à des langages comme C#, Java, Python et Kotlin, lui permet de concevoir en pensant à la réalisation. Résultat : pas de mauvaises surprises, et un design et un développement qui parlent la même langue. Pour vous, cela signifie une communication proche, des réponses rapides et un projet qui avance sans malentendus.",
      },
    },
  },
  {
    shared: {
      name: 'Diego',
      since: 2024,
      skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue'],
      order: 2,
      available: true,
      github: { username: 'Dieguito005' },
      socials: [{ network: 'github', url: 'https://github.com/Dieguito005', handle: '@Dieguito005' }],
    },
    localized: {
      es: {
        slug: 'diego',
        role: 'Frontend · Interfaces & experiencia de usuario',
        location: 'Tarancón (Cuenca), España',
        shortBio: 'Construye interfaces rápidas, accesibles y pensadas para convertir visitas en clientes.',
        bio: 'Diego da forma a todo lo que tus clientes ven y tocan. Está especializado en interfaces orientadas a la conversión, en componentes reutilizables que hacen que tu web crezca sin rehacerse y en el rendimiento, porque una web lenta pierde clientes. Ha trabajado en el rediseño de un portal web institucional para un ayuntamiento, mejorando su accesibilidad, velocidad y navegación, y en el desarrollo de coffeeprojects.es. Su objetivo en cada proyecto es que tu web no solo se vea bien, sino que funcione para tu negocio.',
      },
      en: {
        slug: 'diego',
        role: 'Frontend · Interfaces & User Experience',
        location: 'Tarancón (Cuenca), Spain',
        shortBio: 'Builds fast, accessible interfaces designed to turn visitors into clients.',
        bio: "Diego shapes everything your clients see and touch. He specializes in conversion-focused interfaces, reusable components that let your website grow without being rebuilt, and performance, because a slow website loses clients. He has worked on the redesign of an institutional web portal for a town council, improving its accessibility, speed and navigation, and on the development of coffeeprojects.es. His goal in every project is for your website not only to look good, but to work for your business.",
      },
      fr: {
        slug: 'diego',
        role: 'Frontend · Interfaces & expérience utilisateur',
        location: 'Tarancón (Cuenca), Espagne',
        shortBio: 'Crée des interfaces rapides, accessibles et pensées pour transformer les visiteurs en clients.',
        bio: "Diego façonne tout ce que vos clients voient et touchent. Il est spécialisé dans les interfaces orientées conversion, les composants réutilisables qui permettent à votre site d'évoluer sans être refait, et la performance, car un site lent fait fuir les clients. Il a participé à la refonte du portail web institutionnel d'une mairie, en améliorant son accessibilité, sa vitesse et sa navigation, ainsi qu'au développement de coffeeprojects.es. Son objectif à chaque projet : que votre site ne soit pas seulement beau, mais qu'il travaille pour votre activité.",
      },
    },
  },
  {
    shared: {
      name: 'Juan',
      since: 2020,
      skills: ['Lua', 'JavaScript', 'HTML', 'CSS', 'FiveM', 'ESX', 'QBCore'],
      order: 3,
      available: true,
      github: { username: 'TtvNekix' },
      socials: [
        { network: 'github', url: 'https://github.com/TtvNekix', handle: '@TtvNekix' },
        { network: 'twitch', url: 'https://twitch.tv/ttvnekix', handle: '@ttvnekix' },
      ],
    },
    localized: {
      es: {
        slug: 'juan',
        role: 'Backend · Sistemas & FiveM',
        location: 'España',
        shortBio: 'Más de 50 scripts publicados para FiveM. Sistemas sólidos, optimizados y listos para producción.',
        bio: 'Juan es quien hace que todo funcione por detrás. Lleva programando desde 2020 y ha publicado más de 50 scripts para servidores FiveM, como sistemas de reparto, concesionarios, gimnasios o inventarios, usados por comunidades reales. Domina los frameworks ESX y QBCore y escribe código Lua limpio y optimizado para alto rendimiento. Cuando tu proyecto necesita lógica, integraciones o un sistema que aguante carga, Juan se encarga de que sea estable, rápido y fácil de mantener.',
      },
      en: {
        slug: 'juan',
        role: 'Backend · Systems & FiveM',
        location: 'Spain',
        shortBio: '50+ published FiveM scripts. Solid, optimized, production-ready systems.',
        bio: "Juan is the one who makes everything work behind the scenes. He has been programming since 2020 and has published more than 50 scripts for FiveM servers, such as delivery jobs, car dealerships, gyms and inventories, used by real communities. He masters the ESX and QBCore frameworks and writes clean Lua code optimized for high performance. When your project needs business logic, integrations or a system that holds up under load, Juan makes sure it's stable, fast and easy to maintain.",
      },
      fr: {
        slug: 'juan',
        role: 'Backend · Systèmes & FiveM',
        location: 'Espagne',
        shortBio: 'Plus de 50 scripts FiveM publiés. Des systèmes solides, optimisés et prêts pour la production.',
        bio: "Juan est celui qui fait tout fonctionner en coulisses. Il programme depuis 2020 et a publié plus de 50 scripts pour serveurs FiveM, comme des métiers de livraison, des concessionnaires, des salles de sport ou des inventaires, utilisés par de vraies communautés. Il maîtrise les frameworks ESX et QBCore et écrit un code Lua propre et optimisé pour de hautes performances. Quand votre projet a besoin de logique métier, d'intégrations ou d'un système qui tient la charge, Juan s'assure qu'il soit stable, rapide et facile à maintenir.",
      },
    },
  },
]
