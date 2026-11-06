import { Link } from '@/i18n/navigation'

export function Logo() {
  return (
    <Link href="/" className="group flex min-h-11 items-center gap-2 font-display text-lg font-semibold text-ink-0" aria-label="CoffeeProjects">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand transition-transform duration-500 group-hover:-rotate-6" aria-hidden>
        <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-70" />
      </svg>
      <span>
        Coffee<span className="text-brand">Projects</span>
      </span>
    </Link>
  )
}
