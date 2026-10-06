'use client'
import dynamic from 'next/dynamic'
import { Component, type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { readDevice, shouldRender3D } from './device'
import { HeroPoster } from './hero-poster'

// three.js / R3F live only in this lazy chunk, so no route pays for them in its first load.
const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false })

/** Any failure inside the 3D scene (chunk load, WebGL, three) silently leaves the poster in place. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Server-rendered poster first; the 3D scene fades in over it on capable devices once the page is idle. */
export function HeroVisual() {
  const [enable3D, setEnable3D] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!shouldRender3D(readDevice()) || !supportsWebGL()) return
    // Load 3D only after the page is idle so it never competes with LCP.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setEnable3D(true), { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(() => setEnable3D(true), 1200)
    return () => window.clearTimeout(id)
  }, [])

  const fail = () => {
    setSceneReady(false)
    setFailed(true)
  }
  const showScene = enable3D && !failed

  return (
    <div className="relative h-full w-full">
      <div className={cn('h-full w-full transition-opacity duration-1000', showScene && sceneReady && 'opacity-0')}>
        <HeroPoster />
      </div>
      {showScene && (
        <div className={cn('absolute inset-0 opacity-0 transition-opacity duration-1000', sceneReady && 'opacity-100')}>
          <SceneBoundary onError={fail}>
            <HeroScene onReady={() => setSceneReady(true)} onContextLost={fail} />
          </SceneBoundary>
        </div>
      )}
    </div>
  )
}
