import { notFound } from 'next/navigation'

// Unknown localized paths land here so they render the localized, branded not-found page.
export default function CatchAll() {
  notFound()
}
