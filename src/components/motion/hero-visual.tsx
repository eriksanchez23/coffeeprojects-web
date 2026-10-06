'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { readDevice, shouldRender3D } from './device'
import { HeroPoster } from './hero-poster'

// three.js / R3F live only in this lazy chunk, so no route pays for them in its first load.
const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false })

/** Server-rendered poster first; the 3D scene fades in over it on capable devices once the page is idle. */
export function HeroVisual() {
  const [enable3D, setEnable3D] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    if (!shouldRender3D(readDevice())) return
    // Load 3D only after the page is idle so it never competes with LCP.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setEnable3D(true), { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(() => setEnable3D(true), 1200)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="relative h-full w-full">
      <div className={cn('h-full w-full transition-opacity duration-1000', sceneReady && 'opacity-0')}>
        <HeroPoster />
      </div>
      {enable3D && (
        <div className={cn('absolute inset-0 opacity-0 transition-opacity duration-1000', sceneReady && 'opacity-100')}>
          <HeroScene onReady={() => setSceneReady(true)} />
        </div>
      )}
    </div>
  )
}
