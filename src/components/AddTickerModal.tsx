import { useState, useRef, useEffect } from 'react'
import { addToWatchlist } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

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
    setTimeout(() => inputRef.current?.focus(), 50)
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
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar ticker</DialogTitle>
        </DialogHeader>

        <form onSubmit={e => void handleSubmit(e)}>
          <div className="py-2 space-y-2">
            <Label htmlFor="ticker-input">Ticker (ej: MSFT, AAPL)</Label>
            <Input
              id="ticker-input"
              ref={inputRef}
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="MSFT"
              disabled={loading}
              autoComplete="off"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !ticker.trim()}>
              {loading ? 'Agregando...' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
