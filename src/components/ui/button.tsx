import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { clsx } from 'clsx'

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
  // Plain clsx (no tailwind-merge): Button ships in client bundles, and base/variant/size classes never conflict.
  // className overrides must therefore only add classes (spacing, width), never restyle the base.
  return clsx(base, variants[variant], sizes[size])
}

type ButtonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
} & (
  | ({ href: ComponentProps<typeof Link>['href'] } & Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'>)
  | ({ href?: undefined } & Omit<ComponentProps<'button'>, 'className' | 'children'>)
)

export function Button({ variant, size, className, children, ...rest }: ButtonProps) {
  const classes = clsx(buttonClasses({ variant, size }), className)
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
