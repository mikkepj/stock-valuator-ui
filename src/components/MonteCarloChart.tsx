import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Cell, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts'
import type { MonteCarloResult } from '@/types/api'

interface MonteCarloChartProps {
  monteCarlo: MonteCarloResult
  marketPrice: number
}

const PERCENTILES: { key: keyof Omit<MonteCarloResult, 'simulationCount'>; label: string }[] = [
  { key: 'p10', label: 'P10' },
  { key: 'p25', label: 'P25' },
  { key: 'p50', label: 'P50' },
  { key: 'p75', label: 'P75' },
  { key: 'p90', label: 'P90' },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtSim(n: number) {
  return n.toLocaleString('es-AR')
}

export function MonteCarloChart({ monteCarlo, marketPrice }: MonteCarloChartProps) {
  const data = useMemo(
    () => PERCENTILES.map(({ key, label }) => ({
      name: label,
      value: monteCarlo[key],
      aboveMarket: monteCarlo[key] >= marketPrice,
    })),
    [monteCarlo, marketPrice]
  )

  const [domainMin, domainMax] = useMemo(() => {
    const allValues = [marketPrice, ...PERCENTILES.map(p => monteCarlo[p.key])]
    return [Math.min(...allValues) * 0.97, Math.max(...allValues) * 1.03]
  }, [monteCarlo, marketPrice])

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Basado en {fmtSim(monteCarlo.simulationCount)} simulaciones
      </p>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
            <XAxis
              type="number"
              domain={[domainMin, domainMax]}
              tickFormatter={v => typeof v === 'number' ? `$${fmt(v)}` : String(v)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={32}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`$${fmt(value)}`, 'Valor intrínseco']}
              cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
            />
            <ReferenceLine
              x={marketPrice}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 3"
              label={{ value: `Precio $${fmt(marketPrice)}`, position: 'insideTopRight', fontSize: 10, fill: 'var(--muted-foreground)' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.aboveMarket ? 'var(--verdict-under)' : 'var(--verdict-over)'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de referencia rápida */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {data.map(({ name, value, aboveMarket }) => (
          <div key={name} className="rounded-md border border-border bg-card px-2 py-2">
            <p className="text-xs text-muted-foreground mb-1">{name}</p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: aboveMarket ? 'var(--verdict-under)' : 'var(--verdict-over)' }}
            >
              ${fmt(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
