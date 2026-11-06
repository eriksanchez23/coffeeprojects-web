import type { Service } from '@/payload-types'

/** Main website line (home, /services, header menu). Docs saved before the `line` field existed count as web. */
export const isWebService = (s: Pick<Service, 'line'>): boolean => (s.line ?? 'web') === 'web'
export const webServices = <T extends Pick<Service, 'line'>>(services: readonly T[]): T[] => services.filter(isWebService)
export const otherServices = <T extends Pick<Service, 'line'>>(services: readonly T[]): T[] => services.filter((s) => !isWebService(s))
