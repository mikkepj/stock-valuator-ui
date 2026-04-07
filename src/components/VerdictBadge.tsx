import type { Verdict } from '../types/api'

const VERDICT_LABELS: Record<Verdict, string> = {
  UNDERVALUED: 'Infravalorada',
  FAIR_VALUE: 'Precio justo',
  OVERVALUED: 'Sobrevalorada',
}

const VERDICT_COLORS: Record<Verdict, string> = {
  UNDERVALUED: '#22c55e',
  FAIR_VALUE: '#eab308',
  OVERVALUED: '#ef4444',
}

interface Props {
  verdict: Verdict
}

export function VerdictBadge({ verdict }: Props) {
  const color = VERDICT_COLORS[verdict]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.3px',
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  )
}
