export type DeviceProfile = { reducedMotion: boolean; cores?: number; memoryGb?: number; saveData?: boolean; width: number }

/** Whether the hero 3D scene is worth its cost on this device. Unknown hardware counts as capable. */
export function shouldRender3D(d: DeviceProfile): boolean {
  if (d.reducedMotion || d.saveData) return false
  if (d.cores !== undefined && d.cores < 4) return false
  if (d.memoryGb !== undefined && d.memoryGb < 4) return false
  return d.width >= 320
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function readDevice(): DeviceProfile {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return {
    reducedMotion: prefersReducedMotion(),
    cores: nav.hardwareConcurrency,
    memoryGb: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    width: window.innerWidth,
  }
}
