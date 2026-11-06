import { CupMark } from './cup-mark'

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'monospace', fontSize: 22, color: '#fff7e8' }}>
      <CupMark size={30} />
      <span>
        Coffee<span style={{ color: 'var(--cp-accent)' }}>Projects</span>
      </span>
      <span style={{ fontSize: 12, color: '#a89584', marginLeft: 8 }}>admin</span>
    </div>
  )
}
