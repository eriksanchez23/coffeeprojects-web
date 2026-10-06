'use client'
import { type ComponentProps, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from './language-switcher'

type NavLink = { href: ComponentProps<typeof Link>['href']; label: string }

export function MobileMenu({ links, ctaLabel, openLabel, closeLabel }: { links: NavLink[]; ctaLabel: string; openLabel: string; closeLabel: string }) {
  // Open state is tied to the pathname it was opened on, so navigating closes the menu without an effect.
  const pathname = usePathname()
  const [openPath, setOpenPath] = useState<string | null>(null)
  const open = openPath === pathname
  const setOpen = (next: boolean | ((o: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(open) : next
    setOpenPath(value ? pathname : null)
  }
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full border border-line-hi text-ink-0"
      >
        <span aria-hidden className="font-mono text-lg">{open ? '×' : '≡'}</span>
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col gap-6 bg-bg-0 p-6">
          <nav aria-label="Mobile" className="flex flex-col gap-4 text-2xl font-display">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className="text-ink-0" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher />
          <Button href="/contact" size="lg" className="mt-auto">
            {ctaLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
