interface Props {
  matrix: Record<string, Record<string, number>>
  basePrice: number
}

const WACC_ADJUSTMENTS = ['-1.00%', '-0.50%', '0.00%', '+0.50%', '+1.00%']
const GROWTH_ADJUSTMENTS = ['+2.00%', '+1.00%', '0.00%', '-1.00%', '-2.00%']

function interpolateColor(ratio: number): string {
  const r = Math.round(239 + (34 - 239) * ratio)
  const g = Math.round(68 + (197 - 68) * ratio)
  const b = Math.round(68 + (94 - 68) * ratio)
  return `rgb(${r},${g},${b})`
}

export function SensitivityHeatmap({ matrix, basePrice }: Props) {
  const allValues: number[] = []
  for (const waccAdj of WACC_ADJUSTMENTS) {
    for (const gAdj of GROWTH_ADJUSTMENTS) {
      const val = matrix[waccAdj]?.[gAdj]
      if (val !== undefined) allValues.push(val)
    }
  }

  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = max - min || 1

  const getCell = (waccAdj: string, gAdj: string) => {
    const val = matrix[waccAdj]?.[gAdj]
    if (val === undefined) return { val: null, ratio: 0, isBase: false }
    const ratio = (val - min) / range
    const isBase = waccAdj === '0.00%' && gAdj === '0.00%'
    return { val, ratio, isBase }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground font-medium px-3 py-2 whitespace-nowrap">g \ WACC</th>
              {WACC_ADJUSTMENTS.map(w => (
                <th key={w} className="text-center text-muted-foreground font-medium px-3 py-2 whitespace-nowrap">{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROWTH_ADJUSTMENTS.map(gAdj => (
              <tr key={gAdj}>
                <td className="text-muted-foreground font-medium px-3 py-1.5 whitespace-nowrap">{gAdj}</td>
                {WACC_ADJUSTMENTS.map(wAdj => {
                  const { val, ratio, isBase } = getCell(wAdj, gAdj)
                  if (val === null) return <td key={wAdj} className="text-center px-3 py-1.5">—</td>

                  const bg = interpolateColor(ratio)
                  const margin = ((val - basePrice) / basePrice) * 100
                  const textColor = ratio > 0.55 ? '#052e16' : ratio < 0.45 ? '#450a0a' : '#1c1917'

                  return (
                    <td
                      key={wAdj}
                      className={`text-center px-3 py-1.5 rounded-sm ${isBase ? 'ring-2 ring-offset-1 ring-foreground/40' : ''}`}
                      style={{ background: bg, color: textColor }}
                      title={`IV: $${val.toFixed(2)} | Margen: ${margin.toFixed(1)}%`}
                    >
                      <div className="font-semibold tabular-nums">${val.toFixed(0)}</div>
                      <div className="tabular-nums opacity-80">
                        {margin >= 0 ? '+' : ''}{margin.toFixed(0)}%
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Cada celda muestra el valor intrínseco estimado y el margen vs precio de mercado (${basePrice.toFixed(2)}).
        La celda <strong>0.00% / 0.00%</strong> es el escenario Base.
      </p>
    </div>
  )
}
