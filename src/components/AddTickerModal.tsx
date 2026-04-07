import { useState, useRef, useEffect } from 'react'
import { addToWatchlist } from '../api/client'
import './AddTickerModal.css'

interface Props {
  onClose: () => void
  onAdded: () => void
}

export function AddTickerModal({ onClose, onAdded }: Props) {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = ticker.trim().toUpperCase()
    if (!t) return

    setLoading(true)
    setError(null)
    try {
      await addToWatchlist(t)
      onAdded()
    } catch {
      setError(`No se pudo agregar "${t}". Verificá que el ticker sea válido.`)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Agregar ticker</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={e => void handleSubmit(e)}>
          <div className="modal-body">
            <label htmlFor="ticker-input" className="modal-label">
              Ticker (ej: MSFT, AAPL)
            </label>
            <input
              id="ticker-input"
              ref={inputRef}
              className="modal-input"
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="MSFT"
              disabled={loading}
              autoComplete="off"
            />
            {error && <p className="modal-error">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-action" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !ticker.trim()}>
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
