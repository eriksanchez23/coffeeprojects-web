import { Bricolage_Grotesque, Geist, JetBrains_Mono } from 'next/font/google'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--ff-display', display: 'swap' })
const body = Geist({ subsets: ['latin'], variable: '--ff-body', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--ff-mono', display: 'swap' })

export const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`
