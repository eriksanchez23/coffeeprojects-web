/** Brand cup as inline SVG (same drawing as the site logo); emoji glyphs render inconsistently across platforms. */
export function CupMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ color: 'var(--cp-accent)', flexShrink: 0 }}>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}
