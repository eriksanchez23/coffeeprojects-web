# T14 — Motion & 3D: smooth scroll, GSAP effects, hero 3D scene, page transitions

**Files:**
- Create: `src/components/motion/device.ts`, `src/components/motion/motion-provider.tsx`, `src/components/motion/scroll-effects.tsx`, `src/components/motion/cursor-glow.tsx`, `src/components/motion/hero-visual.tsx`, `src/components/motion/hero-poster.tsx`, `src/components/motion/hero-scene.tsx`
- Modify: `src/app/(frontend)/[locale]/layout.tsx` (wrap with `MotionProvider`, add `CursorGlow`), `src/components/layout/page-shell.tsx` (mount `ScrollEffects`, view transition wrapper), `src/app/(frontend)/[locale]/page.tsx` (pass `visual={<HeroVisual />}` to `Hero`), `next.config.ts` (`experimental.viewTransition`), `globals.css` (view-transition CSS)
- Test: `tests/unit/device.test.ts`

**Interfaces:**
- Consumes: data attributes emitted by earlier tasks: `data-reveal`, `data-reveal-group` (T08–T10), `data-split` (hero h1, service h1), `data-count-to` (T08 stats), `data-process` / `data-process-step` (T08), `data-magnetic` (CTA buttons).
- Produces:
  - `shouldRender3D(d: { reducedMotion: boolean; cores?: number; memoryGb?: number; saveData?: boolean; width: number }): boolean`
  - `prefersReducedMotion(): boolean`
  - `<MotionProvider>`, `<ScrollEffects />`, `<CursorGlow />`, `<HeroVisual />`

- [ ] **Step 1: Install**

```bash
pnpm add gsap @gsap/react lenis three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

Verify with Context7 before coding: (1) `lenis/react` export name (`ReactLenis`), (2) GSAP `SplitText` import path (`gsap/SplitText`), (3) Next.js `experimental.viewTransition` flag and whether the installed React exports `ViewTransition` or `unstable_ViewTransition`. Adjust imports below to the installed versions.

- [ ] **Step 2: Failing test** — `tests/unit/device.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { shouldRender3D } from '@/components/motion/device'

const capable = { reducedMotion: false, cores: 8, memoryGb: 8, saveData: false, width: 1440 }

describe('shouldRender3D', () => {
  it('renders on capable desktops', () => expect(shouldRender3D(capable)).toBe(true))
  it('never renders with reduced motion', () => expect(shouldRender3D({ ...capable, reducedMotion: true })).toBe(false))
  it('skips low-end devices', () => {
    expect(shouldRender3D({ ...capable, cores: 2 })).toBe(false)
    expect(shouldRender3D({ ...capable, memoryGb: 2 })).toBe(false)
  })
  it('respects data saver', () => expect(shouldRender3D({ ...capable, saveData: true })).toBe(false))
  it('renders on capable phones too', () => expect(shouldRender3D({ ...capable, width: 390, cores: 6, memoryGb: 4 })).toBe(true))
  it('treats unknown hardware as capable', () => expect(shouldRender3D({ reducedMotion: false, width: 1024 })).toBe(true))
})
```

- [ ] **Step 3: Run — expect FAIL**

```bash
pnpm vitest run tests/unit/device.test.ts
```

- [ ] **Step 4: Implement `src/components/motion/device.ts`**

```ts
export function shouldRender3D(d: { reducedMotion: boolean; cores?: number; memoryGb?: number; saveData?: boolean; width: number }): boolean {
  if (d.reducedMotion || d.saveData) return false
  if (d.cores !== undefined && d.cores < 4) return false
  if (d.memoryGb !== undefined && d.memoryGb < 4) return false
  return d.width >= 320
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function readDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return {
    reducedMotion: prefersReducedMotion(),
    cores: nav.hardwareConcurrency,
    memoryGb: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    width: window.innerWidth,
  }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
pnpm vitest run tests/unit/device.test.ts
```

- [ ] **Step 6: Motion provider (Lenis + GSAP ticker) `src/components/motion/motion-provider.tsx`**

```tsx
'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ReactLenis, type LenisRef } from 'lenis/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './device'

gsap.registerPlugin(ScrollTrigger, SplitText)

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(true) // SSR-safe default: no smooth scroll until we know
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => setReduced(prefersReducedMotion()), [])

  useEffect(() => {
    if (reduced) return
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    lenisRef.current?.lenis?.on('scroll', ScrollTrigger.update)
    return () => gsap.ticker.remove(update)
  }, [reduced])

  if (reduced) return <>{children}</>
  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, anchors: true }}>
      {children}
    </ReactLenis>
  )
}
```

- [ ] **Step 7: Scroll effects `src/components/motion/scroll-effects.tsx`**

```tsx
'use client'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { usePathname } from 'next/navigation'
import { prefersReducedMotion } from './device'

export function ScrollEffects() {
  const pathname = usePathname()

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const mm = gsap.matchMedia()

      // 1. Reveal cards in batches
      gsap.set('[data-reveal]', { autoAlpha: 0, y: 40 })
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }),
      })

      // 2. Headline split reveal
      document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
        const split = SplitText.create(el, { type: 'words', mask: 'words' })
        gsap.from(split.words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.04 })
      })

      // 3. Counters (final value is already in the HTML; animate from 0 only here)
      document.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => {
        const to = Number(el.dataset.countTo)
        const obj = { v: 0 }
        gsap.to(obj, {
          v: to,
          duration: 1.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v))
          },
        })
      })

      // 4. Process: pinned horizontal progress on desktop
      mm.add('(min-width: 1024px)', () => {
        const list = document.querySelector<HTMLElement>('[data-process]')
        if (!list) return
        const steps = gsap.utils.toArray<HTMLElement>('[data-process-step]', list)
        gsap.set(steps, { opacity: 0.25 })
        const tl = gsap.timeline({
          scrollTrigger: { trigger: list, start: 'top 30%', end: `+=${steps.length * 220}`, pin: list.closest('section') ?? list, scrub: 0.6 },
        })
        steps.forEach((s) => tl.to(s, { opacity: 1, y: -8, duration: 1 }))
      })

      // 5. Magnetic CTAs (pointer devices only)
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const cleanups: (() => void)[] = []
        document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
          const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' })
          const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' })
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            xTo((e.clientX - (r.left + r.width / 2)) * 0.25)
            yTo((e.clientY - (r.top + r.height / 2)) * 0.35)
          }
          const leave = () => {
            xTo(0)
            yTo(0)
          }
          el.addEventListener('pointermove', move)
          el.addEventListener('pointerleave', leave)
          cleanups.push(() => {
            el.removeEventListener('pointermove', move)
            el.removeEventListener('pointerleave', leave)
          })
        })
        return () => cleanups.forEach((c) => c())
      })

      return () => mm.revert()
    },
    { dependencies: [pathname], revertOnUpdate: true },
  )

  return null
}
```

Mount `<ScrollEffects />` at the end of `PageShell`.

> Check: `data-reveal` elements start hidden only after this effect runs on the client, so SSR HTML and no-JS users always see content (no CLS: `autoAlpha` + transform do not affect layout).

- [ ] **Step 8: Cursor glow `src/components/motion/cursor-glow.tsx`**

```tsx
'use client'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './device'

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    el.style.opacity = '1'
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
    const move = (e: PointerEvent) => {
      xTo(e.clientX - 200)
      yTo(e.clientY - 200)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full opacity-0 mix-blend-screen transition-opacity duration-700"
      style={{ background: 'radial-gradient(circle, rgba(245,167,66,.12), transparent 65%)' }}
    />
  )
}
```

- [ ] **Step 9: Hero visual (poster + lazy 3D)**

`src/components/motion/hero-poster.tsx` (static, also the fallback — pure SVG, no request):

```tsx
export function HeroPoster() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label="Coffee cup with code steam">
      <defs>
        <radialGradient id="glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#f5a742" stopOpacity=".45" />
          <stop offset="100%" stopColor="#0b0706" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cup" x1="0" x2="1">
          <stop offset="0%" stopColor="#241812" />
          <stop offset="60%" stopColor="#3a2619" />
          <stop offset="100%" stopColor="#1a1310" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="170" r="190" fill="url(#glow)" />
      <path d="M110 200h170v50a80 80 0 0 1-80 80h-10a80 80 0 0 1-80-80z" fill="url(#cup)" stroke="#c7782a" strokeOpacity=".5" />
      <path d="M280 215h18a30 30 0 0 1 0 60h-22" fill="none" stroke="#c7782a" strokeOpacity=".6" strokeWidth="10" />
      <ellipse cx="195" cy="200" rx="85" ry="14" fill="#3b2416" stroke="#f5a742" strokeOpacity=".4" />
      <g fill="#ffc165" fontFamily="monospace" fontSize="22" opacity=".85">
        <text x="160" y="160">{'{'}</text>
        <text x="200" y="125">{'</>'}</text>
        <text x="230" y="165">{'}'}</text>
        <text x="185" y="85" opacity=".5">;</text>
      </g>
    </svg>
  )
}
```

`src/components/motion/hero-visual.tsx`:

```tsx
'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { readDevice, shouldRender3D } from './device'
import { HeroPoster } from './hero-poster'

const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false, loading: () => <HeroPoster /> })

export function HeroVisual() {
  const [enable3D, setEnable3D] = useState(false)

  useEffect(() => {
    if (!shouldRender3D(readDevice())) return
    // Load 3D only after the page is idle so it never competes with LCP.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200))
    const id = idle(() => setEnable3D(true))
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id as number)
  }, [])

  return enable3D ? <HeroScene /> : <HeroPoster />
}
```

`src/components/motion/hero-scene.tsx`:

```tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const GLYPHS = ['{', '}', '<', '/>', ';', '=>', '()', '$', '[]']

function glyphTexture(ch: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffc165'
  ctx.font = 'bold 72px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#f5a742'
  ctx.shadowBlur = 18
  ctx.fillText(ch, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Cup() {
  const profile = useMemo(
    () =>
      [
        [0, 0], [0.85, 0], [0.95, 0.08], [1.08, 1.35], [1.13, 1.45], [1.04, 1.45], [0.95, 0.18], [0, 0.18],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  )
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, state.pointer.x * 0.35, 0.05)
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -state.pointer.y * 0.12, 0.05)
  })
  return (
    <group ref={ref} position={[0, -1.1, 0]}>
      <mesh>
        <latheGeometry args={[profile, 96]} />
        <meshPhysicalMaterial color="#241812" roughness={0.22} metalness={0.05} clearcoat={1} clearcoatRoughness={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 64]} />
        <meshStandardMaterial color="#3b2416" roughness={0.3} emissive="#c7782a" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[1.18, 0.72, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.36, 0.08, 16, 48, Math.PI]} />
        <meshPhysicalMaterial color="#241812" roughness={0.22} clearcoat={1} />
      </mesh>
    </group>
  )
}

function Steam({ count = 420 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.2
      positions[i * 3 + 1] = Math.random() * 3
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2
      speeds[i] = 0.2 + Math.random() * 0.5
    }
    return { positions, speeds }
  }, [count])

  useFrame((state, delta) => {
    const attr = ref.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined
    if (!attr) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + speeds[i] * delta
      if (y > 3) y = 0
      attr.setY(i, y)
      attr.setX(i, attr.getX(i) + Math.sin(t * 0.8 + i) * 0.0015 * (1 + y))
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref} position={[0, 0.3, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#ffe8b5" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function Glyphs({ count = 14 }: { count?: number }) {
  const textures = useMemo(() => GLYPHS.map(glyphTexture), [])
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ glyph: i % GLYPHS.length, x: (Math.random() - 0.5) * 2.4, y: Math.random() * 3, z: (Math.random() - 0.5) * 1.5, speed: 0.15 + Math.random() * 0.25, scale: 0.25 + Math.random() * 0.25 })),
    [count],
  )
  const refs = useRef<(THREE.Sprite | null)[]>([])
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])

  useFrame((state, delta) => {
    items.forEach((it, i) => {
      const s = refs.current[i]
      if (!s) return
      it.y += it.speed * delta
      if (it.y > 3.2) it.y = 0.4
      s.position.set(it.x + state.pointer.x * 0.2, it.y, it.z)
      ;(s.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - Math.abs(it.y - 1.6) / 1.6)
    })
  })

  return (
    <group position={[0, 0.2, 0]}>
      {items.map((it, i) => (
        <sprite key={i} ref={(el) => (refs.current[i] = el)} scale={[it.scale, it.scale, it.scale]}>
          <spriteMaterial map={textures[it.glyph]} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

export default function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (!wrap.current) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(wrap.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} className="h-full w-full" aria-hidden>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.8, 5.2], fov: 38 }} frameloop={visible ? 'always' : 'never'} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <ambientLight intensity={0.35} />
        <spotLight position={[2, 5, 3]} angle={0.5} penumbra={0.8} intensity={60} color="#f5a742" />
        <pointLight position={[-3, 1, -2]} intensity={12} color="#6ee7b7" />
        <Cup />
        <Steam />
        <Glyphs />
      </Canvas>
    </div>
  )
}
```

Home: `<Hero hero={home.hero} visual={<HeroVisual />} />`.

- [ ] **Step 10: Provider + cursor in layout**

```tsx
<NextIntlClientProvider>
  <MotionProvider>
    {/* skip link, children, ConsentBanner, MetaPixel, AttributionCapture */}
  </MotionProvider>
  <CursorGlow />
</NextIntlClientProvider>
```

- [ ] **Step 11: View transitions**

`next.config.ts` → `experimental: { viewTransition: true }`. In `PageShell`, wrap `<main>` content:

```tsx
import { ViewTransition } from 'react' // or `unstable_ViewTransition as ViewTransition`, per Step 1 check
// …
<main id="main" tabIndex={-1} className="outline-none">
  <ViewTransition>{children}</ViewTransition>
</main>
```

`globals.css`:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 450ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}
```

If the installed Next/React combination doesn't support it (Step 1 check), skip this step — navigation still works; record the skip in the task log.

- [ ] **Step 12: Performance check**

```bash
pnpm build
```

Read the route table: the `/[locale]` First Load JS must stay < 200 KB (gzip) — three/R3F must **not** appear in it (it's in the dynamic `hero-scene` chunk). Then `pnpm start` and run Lighthouse (Chrome DevTools, mobile) on `/`: Performance ≥ 95, CLS < 0.1. With DevTools "Emulate prefers-reduced-motion: reduce": no 3D canvas, no smooth scroll, counters show final values immediately, headlines static.

- [ ] **Step 13: Full checks + commit**

```bash
pnpm typecheck && pnpm test
git add -A
git commit -m "feat(motion): add smooth scroll, GSAP scroll effects, lazy 3D hero and view transitions"
```
