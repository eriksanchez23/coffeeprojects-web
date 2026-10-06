export const statusColors: Record<string, string> = {
  new: '#f5a742',
  'in-progress': '#7cc5ff',
  answered: '#6ee7b7',
  archived: '#6b5d4f',
}

export function StatusCell({ cellData }: { cellData?: string }) {
  const value = cellData ?? 'new'
  return (
    <span
      data-status={value}
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#0b0706',
        background: statusColors[value] ?? '#a89584',
      }}
    >
      {value}
    </span>
  )
}
