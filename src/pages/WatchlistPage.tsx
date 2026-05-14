import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWatchlist, removeFromWatchlist, calculate } from '@/api/client'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { WatchlistItem } from '@/types/api'
import { AddTickerModal } from '@/components/AddTickerModal'
import { VerdictBadge } from '@/components/VerdictBadge'
import { Spinner } from '@/components/Spinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react'

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

  useEffect(() => { void loadWatchlist() }, [loadWatchlist])

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

  const undervalued = items.filter(i => i.verdict === 'UNDERVALUED').length
  const overvalued = items.filter(i => i.verdict === 'OVERVALUED').length
  const avgMargin = items.length > 0
    ? items.reduce((acc, i) => acc + i.marginOfSafety, 0) / items.length
    : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Watchlist</h1>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus size={16} className="mr-1" />
          Agregar ticker
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total tickers
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <span className="text-2xl font-bold text-foreground">{items.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <TrendingUp size={13} style={{ color: 'var(--verdict-under)' }} />
                Infravaloradas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <span className="text-2xl font-bold" style={{ color: 'var(--verdict-under)' }}>
                {undervalued}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                / {overvalued} sobrevaloradas
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                {avgMargin >= 0
                  ? <TrendingUp size={13} style={{ color: 'var(--verdict-under)' }} />
                  : <TrendingDown size={13} style={{ color: 'var(--verdict-over)' }} />}
                Margen promedio
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <span
                className="text-2xl font-bold"
                style={{ color: avgMargin >= 0 ? 'var(--verdict-under)' : 'var(--verdict-over)' }}
              >
                {avgMargin.toFixed(1)}%
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Minus size={40} className="text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay tickers en la watchlist.</p>
          <p className="text-sm text-muted-foreground mt-1">Agregá uno para empezar.</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Ticker</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Empresa</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Precio</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Valor Intrínseco</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Margen</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Veredicto</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.ticker}
                    className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">{item.ticker}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.companyName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">${item.currentPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">${item.intrinsicValue.toFixed(2)}</td>
                    <td
                      className="px-4 py-3 text-right tabular-nums font-medium"
                      style={{ color: item.marginOfSafety >= 0 ? 'var(--verdict-under)' : 'var(--verdict-over)' }}
                    >
                      {item.marginOfSafety.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <VerdictBadge verdict={item.verdict} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/ticker/${item.ticker}`)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={recalculating.has(item.ticker)}
                          onClick={() => void handleRecalculate(item.ticker)}
                        >
                          {recalculating.has(item.ticker) ? '...' : 'Recalcular'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                          onClick={() => void handleRemove(item.ticker)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <AddTickerModal
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); void loadWatchlist() }}
        />
      )}
    </div>
  )
}
