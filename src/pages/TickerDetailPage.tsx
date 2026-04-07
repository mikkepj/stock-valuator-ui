import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getValuation, calculate } from '../api/client'
import type { ValuationResponse } from '../types/api'
import { VerdictBadge } from '../components/VerdictBadge'
import { SensitivityHeatmap } from '../components/SensitivityHeatmap'
import { FcfEstimatesForm } from '../components/FcfEstimatesForm'
import { Spinner } from '../components/Spinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { usePageTitle } from '../hooks/usePageTitle'
import './TickerDetailPage.css'

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(2)}%`
}

function fmtBig(n: number) {
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
      const val = await calculate(ticker)
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
    <div className="detail">
      {/* ── Header ── */}
      <div className="detail-topbar">
        <button className="btn-action" onClick={() => navigate('/')}>← Watchlist</button>
        <button
          className="btn-primary"
          disabled={recalculating}
          onClick={() => void handleRecalculate()}
        >
          {recalculating ? 'Recalculando...' : 'Recalcular DCF'}
        </button>
      </div>

      <div className="detail-header">
        <div className="detail-title">
          <span className="detail-ticker">{data.ticker}</span>
          <h1>{data.companyName}</h1>
          <span className="detail-sector">{data.sector}</span>
        </div>
        <div className="detail-prices">
          <div className="price-block">
            <span className="price-label">Precio de mercado</span>
            <span className="price-value">${fmt(data.marketPrice)}</span>
          </div>
          <div className="price-block">
            <span className="price-label">Valor intrínseco (Base)</span>
            <span className="price-value">${fmt(baseScenario.intrinsicValuePerShare)}</span>
          </div>
          <div className="price-block">
            <span className="price-label">Margen de seguridad</span>
            <span className={`price-value ${data.marginOfSafety >= 0 ? 'positive' : 'negative'}`}>
              {data.marginOfSafety.toFixed(1)}%
            </span>
          </div>
          <VerdictBadge verdict={data.verdict} />
        </div>
      </div>

      {/* ── Escenarios ── */}
      <section className="detail-section">
        <h2>Escenarios DCF</h2>
        <div className="table-wrapper">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Escenario</th>
                <th>IV / acción</th>
                <th>Margen</th>
                <th>Veredicto</th>
                <th>CAGR inicial</th>
                <th>WACC</th>
                <th>Terminal g</th>
              </tr>
            </thead>
            <tbody>
              {data.scenarios.map(s => (
                <tr key={s.scenarioName}>
                  <td className="scenario-name">{s.scenarioName}</td>
                  <td>${fmt(s.intrinsicValuePerShare)}</td>
                  <td className={s.marginOfSafety >= 0 ? 'positive' : 'negative'}>
                    {s.marginOfSafety.toFixed(1)}%
                  </td>
                  <td><VerdictBadge verdict={s.verdict} /></td>
                  <td>{fmtPct(s.initialGrowthRate)}</td>
                  <td>{fmtPct(s.wacc)}</td>
                  <td>{fmtPct(s.terminalGrowthRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── DCF Breakdown ── */}
      <section className="detail-section">
        <h2>DCF Breakdown</h2>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <span className="breakdown-label">WACC</span>
            <span className="breakdown-value">{fmtPct(data.wacc)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Terminal Growth</span>
            <span className="breakdown-value">{fmtPct(data.terminalGrowthRate)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Terminal Value</span>
            <span className="breakdown-value">{fmtBig(data.terminalValue)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Net Debt</span>
            <span className="breakdown-value">{fmtBig(data.netDebt)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Años de proyección</span>
            <span className="breakdown-value">{data.projectionYears}</span>
          </div>
          {data.breakdown['sumPvFcfs'] !== undefined && (
            <div className="breakdown-item">
              <span className="breakdown-label">Suma PV FCFs</span>
              <span className="breakdown-value">{fmtBig(data.breakdown['sumPvFcfs'])}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── FCF Estimates ── */}
      <section className="detail-section">
        <h2>FCF Estimates</h2>
        <FcfEstimatesForm ticker={data.ticker} onRecalculated={setData} />
      </section>

      {/* ── Sensitivity Heatmap ── */}
      <section className="detail-section">
        <h2>Sensitivity Matrix</h2>
        <p className="section-subtitle">
          Valor intrínseco por ajuste de WACC (columnas) y Terminal Growth Rate (filas)
        </p>
        <SensitivityHeatmap matrix={data.sensitivityMatrix} basePrice={data.marketPrice} />
      </section>

      <p className="detail-updated">
        Última actualización: {new Date(data.lastUpdated).toLocaleString('es-AR')}
      </p>
    </div>
  )
}
