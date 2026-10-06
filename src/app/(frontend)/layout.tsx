import React from 'react'
import { fontVariables } from '@/lib/fonts'
import './globals.css'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={fontVariables}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
