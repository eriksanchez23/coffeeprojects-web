'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function MobileCtaBar({ label }: { label: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-3 bottom-3 z-40 transition-transform duration-500 md:hidden ${visible ? 'translate-y-0' : 'translate-y-[150%]'}`}
    >
      <Button href="/contact" size="lg" className="w-full" tabIndex={visible ? 0 : -1}>
        {label}
      </Button>
    </div>
  )
}
