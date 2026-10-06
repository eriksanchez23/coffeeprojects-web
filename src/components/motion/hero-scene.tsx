'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const GLYPHS = ['{', '}', '<', '/>', ';', '=>', '()', '$', '[]']
const STEAM_HEIGHT = 3
const GLYPH_MIN_Y = 0.4
const GLYPH_MAX_Y = 3.2

/** Deterministic PRNG (mulberry32): keeps render pure while still scattering particles. */
function random(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function glyphTexture(ch: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#ffc165'
    ctx.font = 'bold 72px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#f5a742'
    ctx.shadowBlur = 18
    ctx.fillText(ch, 64, 64)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Cup() {
  const profile = useMemo(
    () =>
      [
        [0, 0],
        [0.85, 0],
        [0.95, 0.08],
        [1.08, 1.35],
        [1.13, 1.45],
        [1.04, 1.45],
        [0.95, 0.18],
        [0, 0.18],
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
    const rnd = random(7)
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rnd() - 0.5) * 1.2
      positions[i * 3 + 1] = rnd() * STEAM_HEIGHT
      positions[i * 3 + 2] = (rnd() - 0.5) * 1.2
      speeds[i] = 0.2 + rnd() * 0.5
    }
    return { positions, speeds }
  }, [count])

  useFrame((state, delta) => {
    const attr = ref.current?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined
    if (!attr) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + speeds[i] * delta
      if (y > STEAM_HEIGHT) y = 0
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
  const items = useMemo(() => {
    const rnd = random(42)
    return Array.from({ length: count }, (_, i) => ({
      glyph: i % GLYPHS.length,
      x: (rnd() - 0.5) * 2.4,
      y0: rnd() * (GLYPH_MAX_Y - GLYPH_MIN_Y),
      z: (rnd() - 0.5) * 1.5,
      speed: 0.15 + rnd() * 0.25,
      scale: 0.25 + rnd() * 0.25,
    }))
  }, [count])
  const refs = useRef<(THREE.Sprite | null)[]>([])
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    items.forEach((it, i) => {
      const s = refs.current[i]
      if (!s) return
      // Rise from the cup and wrap around: a pure function of time, so nothing is mutated per frame.
      const y = GLYPH_MIN_Y + ((it.y0 + it.speed * t) % (GLYPH_MAX_Y - GLYPH_MIN_Y))
      s.position.set(it.x + state.pointer.x * 0.2, y, it.z)
      ;(s.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - Math.abs(y - 1.6) / 1.6)
    })
  })

  return (
    <group position={[0, 0.2, 0]}>
      {items.map((it, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          scale={[it.scale, it.scale, it.scale]}
        >
          <spriteMaterial map={textures[it.glyph]} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

/** Coffee cup whose steam turns into code glyphs; follows the pointer. Renders only while on screen. */
export default function HeroScene({ onReady, onContextLost }: { onReady?: () => void; onContextLost?: () => void }) {
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
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.8, 5.2], fov: 38 }}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
        onCreated={({ gl }) => {
          // A lost context (GPU reset, too many contexts) hands the hero back to the poster.
          gl.domElement.addEventListener('webglcontextlost', () => onContextLost?.(), { once: true })
          onReady?.()
        }}
      >
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
