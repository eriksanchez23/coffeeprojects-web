import { Geist, Instrument_Serif, JetBrains_Mono } from 'next/font/google'

// Geist for headings and body (sober, very legible); Instrument Serif only as an editorial accent in the hero.
const body = Geist({ subsets: ['latin'], variable: '--ff-body', display: 'swap' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--ff-serif', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--ff-mono', display: 'swap' })

export const fontVariables = `${body.variable} ${serif.variable} ${mono.variable}`
