# T02 — Design system: tokens, fonts, Tailwind theme, UI primitives

**Files:**
- Create: `postcss.config.mjs`, `src/app/(frontend)/globals.css`, `src/lib/fonts.ts`, `src/lib/cn.ts`, `src/components/ui/button.tsx`, `src/components/ui/container.tsx`, `src/components/ui/section.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/glass-card.tsx`, `src/components/ui/terminal-line.tsx`
- Delete: `src/app/(frontend)/styles.css` (template file) once `globals.css` replaces it
- Test: `tests/unit/cn.test.ts`, `tests/unit/button.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `cn(...inputs: ClassValue[]): string`
  - `buttonClasses({ variant?: 'primary'|'ghost'|'outline', size?: 'md'|'lg' }): string`
  - `<Button variant size href? ...>` (renders next-intl `Link` when `href` is given — the import is wired in T03; until then use `next/link`)
  - `<Container>`, `<Section id eyebrow title lead>`, `<Badge>`, `<GlassCard>`, `<TerminalLine prompt command>`
  - Font CSS variables `--ff-display`, `--ff-body`, `--ff-mono` (mapped to Tailwind `font-display`, `font-sans`, `font-mono`) exported as `fontVariables: string` from `src/lib/fonts.ts`
  - Tailwind color utilities: `bg-bg-0..bg-bg-3`, `text-ink-0..ink-3`, `text-amber`, `bg-amber`, `text-amber-hi`, `text-crema`, `text-latte`, `text-mint`, `border-line`, `border-line-hi`

> Font decision (replaces the spec §6 "Clash Display / Satoshi" proposal to avoid manual font downloads; same premium intent): **Bricolage Grotesque** (display), **Geist** (body), **JetBrains Mono** (code), all via `next/font/google` (self-hosted at build time, no runtime request to Google).

- [ ] **Step 1: Install**

```bash
pnpm add clsx tailwind-merge
pnpm add -D tailwindcss @tailwindcss/postcss postcss
```

`postcss.config.mjs`:

```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

- [ ] **Step 2: Failing tests**

`tests/unit/cn.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('merges conflicting tailwind classes, last wins', () => {
    expect(cn('px-2 text-ink-0', 'px-4')).toBe('text-ink-0 px-4')
  })
  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })
})
```

`tests/unit/button.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buttonClasses } from '@/components/ui/button'

describe('buttonClasses', () => {
  it('defaults to primary md', () => {
    const c = buttonClasses({})
    expect(c).toContain('bg-amber')
    expect(c).toContain('h-11')
  })
  it('supports ghost lg', () => {
    const c = buttonClasses({ variant: 'ghost', size: 'lg' })
    expect(c).toContain('bg-transparent')
    expect(c).toContain('h-14')
    expect(c).not.toContain('bg-amber ')
  })
})
```

- [ ] **Step 3: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/cn.test.ts tests/unit/button.test.ts
```

- [ ] **Step 4: Implement `src/lib/cn.ts`**

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Fonts `src/lib/fonts.ts`**

```ts
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from 'next/font/google'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--ff-display', display: 'swap' })
const body = Geist({ subsets: ['latin'], variable: '--ff-body', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--ff-mono', display: 'swap' })

export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`
```

- [ ] **Step 6: Tokens `src/app/(frontend)/globals.css`**

```css
@import 'tailwindcss';

@theme inline {
  --color-bg-0: #0b0706;
  --color-bg-1: #120c09;
  --color-bg-2: #1a1310;
  --color-bg-3: #241812;
  --color-bg-4: #2e1f16;
  --color-amber: #f5a742;
  --color-amber-hi: #ffc165;
  --color-amber-deep: #c7782a;
  --color-toast: #ff6b35;
  --color-crema: #ffe8b5;
  --color-latte: #c7a17a;
  --color-mint: #6ee7b7;
  --color-berry: #e85d75;
  --color-sky: #7cc5ff;
  --color-ink-0: #fff7e8;
  --color-ink-1: #e8dcc8;
  --color-ink-2: #a89584;
  --color-ink-3: #6b5d4f;
  --color-line: rgb(255 232 181 / 0.08);
  --color-line-hi: rgb(255 232 181 / 0.16);
  --color-line-amber: rgb(245 167 66 / 0.32);

  --font-display: var(--ff-display), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--ff-body), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--ff-mono), ui-monospace, monospace;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);

  --shadow-amber: 0 0 0 1px rgb(245 167 66 / 0.3), 0 20px 60px -15px rgb(245 167 66 / 0.35);
  --shadow-soft: 0 30px 80px -30px rgb(0 0 0 / 0.6);
}

@layer base {
  html {
    color-scheme: dark;
    background: var(--color-bg-0);
    color: var(--color-ink-1);
    -webkit-font-smoothing: antialiased;
  }
  body {
    font-family: var(--font-sans);
    min-height: 100dvh;
  }
  h1, h2, h3 {
    font-family: var(--font-display);
    color: var(--color-ink-0);
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  ::selection { background: var(--color-amber); color: var(--color-bg-0); }
  :focus-visible { outline: 2px solid var(--color-amber-hi); outline-offset: 3px; }
}

/* Film grain overlay used by the body wrapper */
@utility grain {
  position: relative;
  &::after {
    content: '';
    pointer-events: none;
    position: fixed;
    inset: 0;
    z-index: 60;
    opacity: 0.06;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }
}

/* Soft amber "steam" glow */
@utility steam-glow {
  background:
    radial-gradient(60% 50% at 50% 0%, rgb(245 167 66 / 0.18), transparent 70%),
    radial-gradient(40% 40% at 80% 20%, rgb(255 107 53 / 0.08), transparent 70%);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Delete the template's `src/app/(frontend)/styles.css` and its import in `src/app/(frontend)/layout.tsx`; import `./globals.css` instead (the layout itself moves to `[locale]` in T03).

- [ ] **Step 7: Primitives**

`src/components/ui/button.tsx`:

```tsx
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'ghost' | 'outline'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,box-shadow] duration-300 ease-[var(--ease-out-expo)] will-change-transform disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-amber text-bg-0 hover:bg-amber-hi shadow-[var(--shadow-amber)]',
  ghost: 'bg-transparent text-ink-0 hover:bg-bg-3',
  outline: 'bg-transparent text-ink-0 border border-line-hi hover:border-line-amber hover:text-amber-hi',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
}

export function buttonClasses({ variant = 'primary', size = 'md' }: { variant?: Variant; size?: Size }): string {
  return cn(base, variants[variant], sizes[size])
}

type ButtonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
} & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'>)
  | ({ href?: undefined } & Omit<ComponentProps<'button'>, 'className' | 'children'>)
)

export function Button({ variant, size, className, children, ...rest }: ButtonProps) {
  const classes = cn(buttonClasses({ variant, size }), className)
  if ('href' in rest && rest.href) {
    const { href, ...linkProps } = rest
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} {...(rest as ComponentProps<'button'>)}>
      {children}
    </button>
  )
}
```

`src/components/ui/container.tsx`:

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}
```

`src/components/ui/section.tsx`:

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Container } from './container'

type Props = {
  id?: string
  eyebrow?: string
  title?: ReactNode
  lead?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ id, eyebrow, title, lead, children, className }: Props) {
  return (
    <section id={id} className={cn('relative py-24 sm:py-32', className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <Container>
        {(eyebrow || title || lead) && (
          <header className="mb-14 max-w-3xl">
            {eyebrow && (
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-amber">{eyebrow}</p>
            )}
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className="text-4xl font-semibold sm:text-5xl lg:text-6xl">
                {title}
              </h2>
            )}
            {lead && <p className="mt-6 text-lg text-ink-2">{lead}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  )
}
```

`src/components/ui/badge.tsx`:

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-line-hi bg-bg-2 px-3 py-1 font-mono text-xs text-ink-1', className)}>
      {children}
    </span>
  )
}
```

`src/components/ui/glass-card.tsx`:

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-1/60 p-6 backdrop-blur-xl',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgb(245_167_66/0.12),transparent_40%)]',
        'transition-colors duration-300 hover:border-line-amber',
        className,
      )}
    >
      {children}
    </div>
  )
}
```

`src/components/ui/terminal-line.tsx`:

```tsx
export function TerminalLine({ prompt = '~ coffeeprojects $', command }: { prompt?: string; command: string }) {
  return (
    <p className="font-mono text-sm text-ink-2">
      <span className="text-mint">{prompt}</span> <span className="text-ink-0">{command}</span>
      <span aria-hidden className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-amber" />
    </p>
  )
}
```

- [ ] **Step 8: Run — expect PASS**

```bash
pnpm vitest run tests/unit/cn.test.ts tests/unit/button.test.ts && pnpm typecheck
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ui): add brand tokens, fonts and UI primitives"
```
