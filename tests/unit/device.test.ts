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
