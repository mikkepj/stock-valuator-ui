import type { Verdict } from '@/types/api'

const VERDICT_LABELS: Record<Verdict, string> = {
  UNDERVALUED: 'Infravalorada',
  FAIR_VALUE: 'Precio justo',
  OVERVALUED: 'Sobrevalorada',
}

const VERDICT_STYLES: Record<Verdict, { color: string; bg: string; border: string }> = {
  UNDERVALUED: { color: 'var(--verdict-under)', bg: 'color-mix(in srgb, var(--verdict-under) 12%, transparent)', border: 'color-mix(in srgb, var(--verdict-under) 35%, transparent)' },
  FAIR_VALUE:  { color: 'var(--verdict-fair)',  bg: 'color-mix(in srgb, var(--verdict-fair) 12%, transparent)',  border: 'color-mix(in srgb, var(--verdict-fair) 35%, transparent)' },
  OVERVALUED:  { color: 'var(--verdict-over)',  bg: 'color-mix(in srgb, var(--verdict-over) 12%, transparent)',  border: 'color-mix(in srgb, var(--verdict-over) 35%, transparent)' },
}

interface Props {
  verdict: Verdict
}

export function VerdictBadge({ verdict }: Props) {
  const { color, bg, border } = VERDICT_STYLES[verdict]
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold tracking-wide"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  )
}
