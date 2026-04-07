import './SensitivityHeatmap.css'

interface Props {
  matrix: Record<string, Record<string, number>>
  basePrice: number
}

// Orden canónico de los ejes según el contrato del BE
const WACC_ADJUSTMENTS = ['-1.00%', '-0.50%', '0.00%', '+0.50%', '+1.00%']
const GROWTH_ADJUSTMENTS = ['+2.00%', '+1.00%', '0.00%', '-1.00%', '-2.00%']

function interpolateColor(ratio: number): string {
  // ratio 0 → rojo #ef4444, ratio 1 → verde #22c55e
  const r = Math.round(239 + (34 - 239) * ratio)
  const g = Math.round(68 + (197 - 68) * ratio)
  const b = Math.round(68 + (94 - 68) * ratio)
  return `rgb(${r},${g},${b})`
}

export function SensitivityHeatmap({ matrix, basePrice }: Props) {
  // Recopilar todos los valores para normalizar el gradiente
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
    <div className="heatmap-wrapper">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th className="heatmap-axis-label">g \ WACC</th>
            {WACC_ADJUSTMENTS.map(w => (
              <th key={w} className="heatmap-col-header">{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GROWTH_ADJUSTMENTS.map(gAdj => (
            <tr key={gAdj}>
              <td className="heatmap-row-header">{gAdj}</td>
              {WACC_ADJUSTMENTS.map(wAdj => {
                const { val, ratio, isBase } = getCell(wAdj, gAdj)
                if (val === null) return <td key={wAdj} className="heatmap-cell">—</td>

                const bg = interpolateColor(ratio)
                const margin = ((val - basePrice) / basePrice) * 100
                const textColor = ratio > 0.55 ? '#052e16' : ratio < 0.45 ? '#450a0a' : '#1c1917'

                return (
                  <td
                    key={wAdj}
                    className={`heatmap-cell${isBase ? ' heatmap-base' : ''}`}
                    style={{ background: bg, color: textColor }}
                    title={`IV: $${val.toFixed(2)} | Margen: ${margin.toFixed(1)}%`}
                  >
                    <span className="heatmap-iv">${val.toFixed(0)}</span>
                    <span className="heatmap-margin">
                      {margin >= 0 ? '+' : ''}{margin.toFixed(0)}%
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="heatmap-legend">
        Cada celda muestra el valor intrínseco estimado y el margen vs precio de mercado (${basePrice.toFixed(2)}).
        La celda <strong>0.00% / 0.00%</strong> es el escenario Base.
      </p>
    </div>
  )
}
