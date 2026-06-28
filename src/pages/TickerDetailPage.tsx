import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getValuation, calculate } from '@/api/client'
import type { ValuationResponse } from '@/types/api'
import { VerdictBadge } from '@/components/VerdictBadge'
import { SensitivityHeatmap } from '@/components/SensitivityHeatmap'
import { FcfEstimatesForm } from '@/components/FcfEstimatesForm'
import { Spinner } from '@/components/Spinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft, Info, RefreshCw } from 'lucide-react'
import { QualityScoreBadge } from '@/components/QualityScoreBadge'
import { MonteCarloChart } from '@/components/MonteCarloChart'

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(2)}%`
}

function fmtBig(n: number) {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${fmt(n)}`
}

export function TickerDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ValuationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const [betaOverrideInput, setBetaOverrideInput] = useState('')

  usePageTitle(data ? `${data.ticker} — ${data.companyName}` : ticker)

  const load = useCallback(async () => {
    if (!ticker) return
    try {
      setError(null)
      const val = await getValuation(ticker)
      setData(val)
    } catch {
      setError(`No se encontró valuación para "${ticker}".`)
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => { void load() }, [load])

  const handleRecalculate = async () => {
    if (!ticker) return
    setRecalculating(true)
    try {
      const parsed = parseFloat(betaOverrideInput)
      const betaOverride = !isNaN(parsed) && betaOverrideInput.trim() !== '' ? parsed : undefined
      const val = await calculate(ticker, betaOverride)
      setData(val)
    } catch {
      setError('Error al recalcular. Intentá de nuevo.')
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) return <Spinner text={`Cargando valuación de ${ticker ?? ''}...`} />

  if (error || !data) {
    return (
      <ErrorMessage
        message={error ?? 'Sin datos para este ticker.'}
        onRetry={() => { setLoading(true); void load() }}
      />
    )
  }

  const baseScenario = data.scenarios.find(s => s.scenarioName === 'Base') ?? data.scenarios[0]

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={16} className="mr-1" />
            Watchlist
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="beta-input" className="text-xs text-muted-foreground flex items-center gap-1">
                Beta override
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={12} className="cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-56 text-xs">
                    Sobreescribe el beta de mercado (FMP). Referencia Damodaran: semiconductores ≈ 1.5, software ≈ 1.1. Dejá vacío para usar el beta histórico.
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
            <Input
              id="beta-input"
              type="number"
              placeholder="ej. 1.5"
              min={0.1}
              max={5.0}
              step={0.05}
              value={betaOverrideInput}
              onChange={e => setBetaOverrideInput(e.target.value)}
              disabled={recalculating}
              className="w-28 h-8 text-sm"
            />
            <Button
              size="sm"
              disabled={recalculating}
              onClick={() => void handleRecalculate()}
            >
              <RefreshCw size={14} className={`mr-1.5 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculando...' : 'Recalcular DCF'}
            </Button>
          </div>
        </div>

        {/* Header card */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-2xl font-bold text-foreground">{data.ticker}</span>
                  <VerdictBadge verdict={data.verdict} />
                  {data.qualityScore != null && (
                    <QualityScoreBadge score={data.qualityScore} />
                  )}
                </div>
                <h1 className="text-lg font-medium text-foreground">{data.companyName}</h1>
                <span className="text-sm text-muted-foreground">{data.sector}</span>
              </div>

              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Precio de mercado</p>
                  <p className="text-xl font-semibold tabular-nums">${fmt(data.marketPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Valor intrínseco (Base)</p>
                  <p className="text-xl font-semibold tabular-nums">${fmt(baseScenario.intrinsicValuePerShare)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margen de seguridad</p>
                  <p
                    className="text-xl font-semibold tabular-nums"
                    style={{ color: data.marginOfSafety >= 0 ? 'var(--verdict-under)' : 'var(--verdict-over)' }}
                  >
                    {data.marginOfSafety.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escenarios */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Escenarios DCF</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Escenario', 'IV / acción', 'Margen', 'Veredicto', 'CAGR inicial', 'WACC', 'Terminal g'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.scenarios.map(s => (
                    <tr key={s.scenarioName} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 pl-5 font-medium text-foreground">{s.scenarioName}</td>
                      <td className="px-4 py-3 tabular-nums">${fmt(s.intrinsicValuePerShare)}</td>
                      <td
                        className="px-4 py-3 tabular-nums font-medium"
                        style={{ color: s.marginOfSafety >= 0 ? 'var(--verdict-under)' : 'var(--verdict-over)' }}
                      >
                        {s.marginOfSafety.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3"><VerdictBadge verdict={s.verdict} /></td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{fmtPct(s.initialGrowthRate)}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{fmtPct(s.wacc)}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{fmtPct(s.terminalGrowthRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* DCF Breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">DCF Breakdown</h2>

          {data.breakdown.growthExceedsRoic === 1 && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 mb-3 text-sm text-destructive">
              <Info size={14} className="shrink-0" />
              <span>El crecimiento proyectado supera el ROIC — el valor terminal puede estar sobreestimado.</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: 'WACC', value: fmtPct(data.wacc) },
              { label: 'Terminal Growth', value: fmtPct(data.terminalGrowthRate) },
              { label: 'Terminal Value (Gordon)', value: fmtBig(data.terminalValue) },
              { label: 'Net Debt', value: fmtBig(data.netDebt) },
              { label: 'Años de proyección', value: String(data.projectionYears) },
              ...(data.breakdown['sumPvFcfs'] !== undefined
                ? [{ label: 'Suma PV FCFs', value: fmtBig(data.breakdown['sumPvFcfs']) }]
                : []),
              ...(data.betaUsed !== null && data.betaUsed !== undefined
                ? [{ label: 'Beta utilizada', value: fmt(data.betaUsed) }]
                : []),
              ...(data.breakdown.terminalValueExitMultiple !== undefined
                ? [{ label: 'Terminal Value (Exit Multiple)', value: fmtBig(data.breakdown.terminalValueExitMultiple) }]
                : []),
              ...(data.breakdown.effectiveTaxRate !== undefined
                ? [{ label: 'Tasa impositiva efectiva', value: fmtPct(data.breakdown.effectiveTaxRate) }]
                : []),
              ...(data.breakdown.creditSpread !== undefined
                ? [{ label: 'Spread crediticio', value: fmtPct(data.breakdown.creditSpread) }]
                : []),
              ...(data.breakdown.sizeRiskPremium !== undefined
                ? [{ label: 'Prima por tamaño', value: fmtPct(data.breakdown.sizeRiskPremium) }]
                : []),
              ...(data.breakdown.roic !== undefined
                ? [{ label: 'ROIC', value: fmtPct(data.breakdown.roic) }]
                : []),
              ...(data.breakdown.maxSustainableGrowth !== undefined
                ? [{ label: 'Crecimiento máx. sostenible', value: fmtPct(data.breakdown.maxSustainableGrowth) }]
                : []),
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FCF Estimates */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">FCF Estimates</h2>
          <Card>
            <CardContent className="pt-5">
              <FcfEstimatesForm ticker={data.ticker} onRecalculated={setData} />
            </CardContent>
          </Card>
        </div>

        {/* Sensitivity Heatmap */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sensitivity Matrix</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Valor intrínseco por ajuste de WACC (columnas) y Terminal Growth Rate (filas)
          </p>
          <Card>
            <CardContent className="pt-5 overflow-x-auto">
              <SensitivityHeatmap matrix={data.sensitivityMatrix} basePrice={data.marketPrice} />
            </CardContent>
          </Card>
        </div>

        {/* Monte Carlo */}
        {data.monteCarlo != null && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Simulación Monte Carlo</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Distribución de valor intrínseco por percentil — verde si supera el precio de mercado
            </p>
            <Card>
              <CardContent className="pt-5">
                <MonteCarloChart monteCarlo={data.monteCarlo} marketPrice={data.marketPrice} />
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-right pb-4">
          Última actualización: {new Date(data.lastUpdated).toLocaleString('es-AR')}
        </p>
      </div>
    </TooltipProvider>
  )
}
