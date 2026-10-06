/** Shared layout for generated Open Graph images (default font: no network access needed at build). */
export function OgCard({ eyebrow, headline }: { eyebrow: string; headline: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: 'radial-gradient(80% 80% at 50% 0%, rgba(245,167,66,.35), #0b0706 70%)',
        color: '#fff7e8',
      }}
    >
      <div style={{ fontSize: 36, color: '#f5a742', fontFamily: 'monospace' }}>{eyebrow}</div>
      <div style={{ fontSize: headline.length > 60 ? 64 : 88, fontWeight: 700, lineHeight: 1.05 }}>{headline}</div>
      <div style={{ fontSize: 32, color: '#a89584' }}>coffeeprojects.es</div>
    </div>
  )
}
