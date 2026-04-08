import { useState, useEffect } from 'react'
import { getFcfEstimates, saveFcfEstimates, calculate } from '../api/client'
import type { ValuationResponse } from '../types/api'
import './FcfEstimatesForm.css'

interface Props {
  ticker: string
  onRecalculated: (data: ValuationResponse) => void
}

const SLOTS = 5

function toDisplayValue(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function FcfEstimatesForm({ ticker, onRecalculated }: Props) {
  const [values, setValues] = useState<string[]>(Array(SLOTS).fill(''))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getFcfEstimates(ticker)
      .then(existing => {
        if (cancelled) return
        if (existing.length > 0) {
          const prefilled = Array(SLOTS).fill('').map((_, i) =>
            i < existing.length ? toDisplayValue(existing[i]) : ''
          )
          setValues(prefilled)
        }
      })
      .catch(() => { /* sin estimates guardados — inputs vacíos */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ticker])

  const handleChange = (index: number, raw: string) => {
    const next = [...values]
    next[index] = raw
    setValues(next)
    setSaved(false)
  }

  const handleSaveAndRecalculate = async () => {
    const estimates = values
      .map(v => parseFloat(v.replace(/,/g, '')))
      .filter(n => !isNaN(n))

    if (estimates.length === 0) {
      setError('Ingresá al menos un valor de FCF.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await saveFcfEstimates(ticker, estimates)
      const updated = await calculate(ticker)
      onRecalculated(updated)
      setSaved(true)
    } catch {
      setError('Error al guardar o recalcular. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const hasValues = values.some(v => v.trim() !== '')

  return (
    <div className="fcf-form">
      <p className="fcf-hint">
        Estimaciones de FCF de analistas (ej: de Koyfin) en unidades absolutas USD.
        {loading && <span className="fcf-loading"> Cargando valores guardados...</span>}
      </p>
      <div className="fcf-inputs">
        {values.map((v, i) => (
          <div key={i} className="fcf-input-group">
            <label className="fcf-label">Año {i + 1}</label>
            <input
              className="fcf-input"
              type="text"
              inputMode="decimal"
              placeholder="ej: 99,220,000,000"
              value={v}
              onChange={e => handleChange(i, e.target.value)}
              disabled={saving || loading}
            />
          </div>
        ))}
      </div>
      {error && <p className="fcf-error">{error}</p>}
      {saved && <p className="fcf-success">Guardado y recalculado correctamente.</p>}
      <button
        className="btn-primary"
        disabled={saving || loading || !hasValues}
        onClick={() => void handleSaveAndRecalculate()}
      >
        {saving ? 'Guardando...' : 'Guardar y recalcular'}
      </button>
    </div>
  )
}
