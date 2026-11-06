import type { Shot } from '@/components/showcase/device-frames'

/**
 * Real screenshots of our projects (public/showcase), used by the home hero. Empty slots fall back to a neutral
 * CSS sketch, so the hero never shows invented content.
 */
export const heroShowcase: { desktop?: Shot & { url: string }; mobile?: Shot } = {}
