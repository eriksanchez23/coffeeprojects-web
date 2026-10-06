export function JsonLd({ data }: { data: object | object[] }) {
  // Escape "<" so CMS-provided strings can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
