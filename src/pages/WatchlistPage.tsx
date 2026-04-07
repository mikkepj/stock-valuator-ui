import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWatchlist, removeFromWatchlist, calculate } from '../api/client'
import { usePageTitle } from '../hooks/usePageTitle'
import type { WatchlistItem } from '../types/api'
import { AddTickerModal } from '../components/AddTickerModal'
import { VerdictBadge } from '../components/VerdictBadge'
import { Spinner } from '../components/Spinner'
import { ErrorMessage } from '../components/ErrorMessage'
import './WatchlistPage.css'

export function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recalculating, setRecalculating] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  usePageTitle('Watchlist')

  const loadWatchlist = useCallback(async () => {
    try {
      setError(null)
      const data = await getWatchlist()
      setItems(data)
    } catch {
      setError('No se pudo cargar la watchlist. ¿Está el backend corriendo?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWatchlist()
  }, [loadWatchlist])

  const handleRecalculate = async (ticker: string) => {
    setRecalculating(prev => new Set(prev).add(ticker))
    try {
      await calculate(ticker)
      await loadWatchlist()
    } catch {
      setError(`Error al recalcular ${ticker}.`)
    } finally {
      setRecalculating(prev => {
        const next = new Set(prev)
        next.delete(ticker)
        return next
      })
    }
  }

  const handleRemove = async (ticker: string) => {
    try {
      await removeFromWatchlist(ticker)
      setItems(prev => prev.filter(i => i.ticker !== ticker))
    } catch {
      setError(`Error al eliminar ${ticker}.`)
    }
  }

  if (loading) return <Spinner text="Cargando watchlist..." />

  if (error && items.length === 0) {
    return <ErrorMessage message={error} onRetry={() => { setLoading(true); void loadWatchlist() }} />
  }

  return (
    <div className="watchlist">
      <div className="watchlist-header">
        <h1>Watchlist</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Agregar ticker
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {items.length === 0 ? (
        <p className="watchlist-empty">
          No hay tickers en la watchlist. Agregá uno para empezar.
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="watchlist-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Empresa</th>
                <th>Precio</th>
                <th>Valor Intrínseco</th>
                <th>Margen</th>
                <th>Veredicto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.ticker}>
                  <td className="ticker-cell">{item.ticker}</td>
                  <td>{item.companyName}</td>
                  <td>${item.currentPrice.toFixed(2)}</td>
                  <td>${item.intrinsicValue.toFixed(2)}</td>
                  <td className={item.marginOfSafety >= 0 ? 'positive' : 'negative'}>
                    {item.marginOfSafety.toFixed(1)}%
                  </td>
                  <td>
                    <VerdictBadge verdict={item.verdict} />
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-action"
                      onClick={() => navigate(`/ticker/${item.ticker}`)}
                    >
                      Ver
                    </button>
                    <button
                      className="btn-action"
                      disabled={recalculating.has(item.ticker)}
                      onClick={() => void handleRecalculate(item.ticker)}
                    >
                      {recalculating.has(item.ticker) ? '...' : 'Recalcular'}
                    </button>
                    <button
                      className="btn-action btn-danger"
                      onClick={() => void handleRemove(item.ticker)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddTickerModal
          onClose={() => setShowModal(false)}
          onAdded={() => {
            setShowModal(false)
            void loadWatchlist()
          }}
        />
      )}
    </div>
  )
}
