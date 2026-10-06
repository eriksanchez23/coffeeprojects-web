'use client'
import { createContext, type ReactNode, useContext } from 'react'
import type { Locale } from '@/i18n/locales'

type Alternates = Record<Locale, string> | null
const AlternatesContext = createContext<Alternates>(null)

export function AlternatesProvider({ value, children }: { value: Record<Locale, string>; children: ReactNode }) {
  return <AlternatesContext.Provider value={value}>{children}</AlternatesContext.Provider>
}

export function useAlternates(): Alternates {
  return useContext(AlternatesContext)
}
