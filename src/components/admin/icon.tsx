import { CupMark } from './cup-mark'

export function Icon() {
  return (
    <span role="img" aria-label="CoffeeProjects" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <CupMark size={22} />
    </span>
  )
}
