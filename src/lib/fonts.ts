import { Geist, Instrument_Serif, JetBrains_Mono } from 'next/font/google'

// Geist for headings and body (sober, very legible); Instrument Serif only as an editorial accent in the hero.
const body = Geist({ subsets: ['latin'], variable: '--ff-body', display: 'swap' })
// Only ever set in italics (hero accent, taglines): the upright style would be a wasted download.
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--ff-serif', display: 'swap' })
// Mono only appears below the fold (technology chips, code-ish details): never preloaded with the first paint.
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--ff-mono', display: 'swap', preload: false })

export const fontVariables = `${body.variable} ${serif.variable} ${mono.variable}`
