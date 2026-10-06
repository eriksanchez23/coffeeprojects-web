'use client'
import dynamic from 'next/dynamic'
import { Component, type ReactNode, useEffect, useState } from 'react'
import { clsx } from 'clsx'
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
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    // Release the probe context right away so it doesn't coexist with the scene's own context.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}

/** Server-rendered poster first; the 3D scene fades in over it on capable devices once the visitor engages. */
export function HeroVisual() {
  const [enable3D, setEnable3D] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!shouldRender3D(readDevice()) || !supportsWebGL()) return
    // three.js is ~240 KB and >1 s of main-thread work on a mid-range phone, so it loads only once the visitor
    // engages (moves the pointer, touches, scrolls or types) and the browser is idle. Visitors who just read
    // keep the static poster and never pay for it; it also never competes with LCP or the first interactions.
    let idleId: number | undefined
    const start = () => {
      removeListeners()
      const enable = () => setEnable3D(true)
      idleId =
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback(enable, { timeout: 1500 })
          : window.setTimeout(enable, 200)
    }
    const events = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'keydown'] as const
    const removeListeners = () => events.forEach((e) => window.removeEventListener(e, start))
    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }))
    return () => {
      removeListeners()
      if (idleId === undefined) return
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId)
      else window.clearTimeout(idleId)
    }
  }, [])

  const fail = () => {
    setSceneReady(false)
    setFailed(true)
  }
  const showScene = enable3D && !failed

  return (
    <div className="relative h-full w-full">
      <div className={clsx('h-full w-full transition-opacity duration-1000', showScene && sceneReady && 'opacity-0')}>
        <HeroPoster />
      </div>
      {showScene && (
        <div className={clsx('absolute inset-0 transition-opacity duration-1000', sceneReady ? 'opacity-100' : 'opacity-0')}>
          <SceneBoundary onError={fail}>
            <HeroScene onReady={() => setSceneReady(true)} onContextLost={fail} />
          </SceneBoundary>
        </div>
      )}
    </div>
  )
}
