import type { Attribution } from '@/features/tracking/attribution'
import type { ContactInput } from './schema'

/**
 * The `contacts` row for a validated submission. `marketing` is the consent read server-side from the
 * consent cookie: the form's `marketingConsent` field is client-controlled and is never stored as-is.
 */
export function toContactRecord(
  data: ContactInput & { ipHash: string },
  { marketing, attribution }: { marketing: boolean; attribution: Attribution | null },
) {
  // `maintenance` has no column: the choice is stored in the quoted summary, with its price.
  const { privacy, nda, marketingConsent: _formValue, maintenance: _maintenance, ...rest } = data
  return {
    ...rest,
    // The "existing website" paths may omit the message (the URL is the key data); the column is required.
    message: rest.message || '—',
    marketingConsent: marketing,
    privacyAccepted: privacy,
    ndaRequested: nda,
    status: 'new' as const,
    ...(attribution && {
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmContent: attribution.utmContent,
      utmTerm: attribution.utmTerm,
      fbclid: attribution.fbclid,
    }),
  }
}
