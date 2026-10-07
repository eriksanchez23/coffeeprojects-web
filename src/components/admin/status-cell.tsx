import { contactStatusLabels } from '@/fields/labels'

export const statusColors: Record<string, string> = {
  new: '#f5a742',
  'in-progress': '#7cc5ff',
  answered: '#6ee7b7',
  archived: '#6b5d4f',
}

const lightTextOn = new Set(['archived'])

export function statusLabel(value: string, language = 'es') {
  const label = contactStatusLabels[value]
  if (!label) return value
  return language.startsWith('en') ? label.en : label.es
}

// Server cell: Payload passes the admin `i18n`; the badge text follows the panel language (default Spanish).
export function StatusCell({ cellData, i18n }: { cellData?: string; i18n?: { language?: string } }) {
  const value = cellData || 'new'
  return (
    <span
      data-status={value}
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontFamily: 'monospace',
        color: lightTextOn.has(value) ? '#fff7e8' : '#0b0706',
        background: statusColors[value] ?? '#a89584',
      }}
    >
      {statusLabel(value, i18n?.language)}
    </span>
  )
}
