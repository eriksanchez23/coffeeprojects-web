import { getTranslations } from 'next-intl/server'
import {
  siAstro,
  siGreensock,
  siKotlin,
  siLua,
  siNextdotjs,
  siNodedotjs,
  siPayloadcms,
  siPostgresql,
  siPython,
  siReact,
  siShopify,
  siStripe,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siVercel,
  siVuedotjs,
} from 'simple-icons'
import { Section } from '@/components/ui/section'

// Display name -> brand icon. Names without an icon (e.g. Java is not in simple-icons) render as text only.
const brandIcons: Record<string, { path: string }> = {
  'Next.js': siNextdotjs,
  React: siReact,
  Astro: siAstro,
  TypeScript: siTypescript,
  'Node.js': siNodedotjs,
  'Payload CMS': siPayloadcms,
  'Tailwind CSS': siTailwindcss,
  GSAP: siGreensock,
  'Three.js': siThreedotjs,
  Python: siPython,
  Lua: siLua,
  PostgreSQL: siPostgresql,
  Stripe: siStripe,
  Shopify: siShopify,
  Vercel: siVercel,
  Kotlin: siKotlin,
  Vue: siVuedotjs,
}

function Logo({ name }: { name: string }) {
  const icon = brandIcons[name]
  if (!icon) return null
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d={icon.path} />
    </svg>
  )
}

export async function StackMarquee({ title, items }: { title: string; items: string[] }) {
  const t = await getTranslations('sections')
  const row = [...items, ...items]
  return (
    <Section id="stack" eyebrow={t('stack')} title={title}>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] motion-reduce:[mask-image:none]">
        <ul className="marquee flex w-max gap-3" aria-label={title}>
          {row.map((item, i) => (
            <li
              key={`${item}-${i}`}
              aria-hidden={i >= items.length}
              data-marquee-dup={i >= items.length ? "" : undefined}
              className="flex items-center gap-2 rounded-full border border-line-hi bg-bg-2 px-5 py-2 font-mono text-sm text-ink-1"
            >
              <Logo name={item} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
