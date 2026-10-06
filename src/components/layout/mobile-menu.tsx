'use client'
import { type ComponentProps, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from './language-switcher'

type NavLink = { href: ComponentProps<typeof Link>['href']; label: string }

type Props = { links: NavLink[]; ctaLabel: string; navLabel: string; openLabel: string; closeLabel: string }

export function MobileMenu({ links, ctaLabel, navLabel, openLabel, closeLabel }: Props) {
  const pathname = usePathname()
  // The menu is open only on the page it was opened from; leaving that page clears the state (derived-state reset),
  // so navigating back never reopens it.
  const [openPath, setOpenPath] = useState<string | null>(null)
  if (openPath !== null && openPath !== pathname) setOpenPath(null)
  const open = openPath !== null

  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) toggleRef.current?.focus()
      wasOpen.current = false
      return
    }
    wasOpen.current = true
    // The panel is portaled to <body>, outside the blurred header (backdrop-filter would otherwise become the
    // containing block of the fixed panel). Background content is made inert while it is open.
    const background = [document.getElementById('main'), document.querySelector<HTMLElement>('body footer')].filter(
      (el): el is HTMLElement => el !== null,
    )
    for (const el of background) el.inert = true
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPath(null)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      for (const el of background) el.inert = false
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpenPath(open ? null : pathname)}
        className="grid h-10 w-10 place-items-center rounded-full border border-line-hi text-ink-0"
      >
        <span aria-hidden className="font-mono text-lg">
          {open ? '×' : '≡'}
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id="mobile-menu"
            className="fixed inset-x-0 top-16 bottom-0 z-[60] flex flex-col gap-6 bg-bg-0 p-6 md:hidden"
          >
            <nav aria-label={navLabel} className="flex flex-col gap-4 font-display text-2xl">
              {links.map((l) => (
                <Link key={l.label} href={l.href} className="text-ink-0" onClick={() => setOpenPath(null)}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <LanguageSwitcher />
            <Button href="/contact" size="lg" className="mt-auto" onClick={() => setOpenPath(null)}>
              {ctaLabel}
            </Button>
          </div>,
          document.body,
        )}
    </div>
  )
}
