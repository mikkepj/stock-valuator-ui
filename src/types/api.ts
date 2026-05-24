// Tipos generados desde los DTOs del backend (stock-valuator BE)
// Mantener sincronizados con los records Java en api-web/.../dto/

export type Verdict = 'UNDERVALUED' | 'FAIR_VALUE' | 'OVERVALUED'

export interface ScenarioResult {
  scenarioName: string
  intrinsicValuePerShare: number
  marginOfSafety: number
  verdict: Verdict
  initialGrowthRate: number
  terminalGrowthRate: number
  wacc: number
}

export interface MonteCarloResult {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  simulationCount: number
}

export interface ValuationResponse {
  ticker: string
  companyName: string
  sector: string
  intrinsicValuePerShare: number
  marketPrice: number
  marginOfSafety: number
  verdict: Verdict
  wacc: number
  terminalGrowthRate: number
  projectionYears: number
  terminalValue: number
  netDebt: number
  betaUsed: number | null
  scenarios: ScenarioResult[]
  sensitivityMatrix: Record<string, Record<string, number>>
  breakdown: Record<string, number> & {
    terminalValueExitMultiple?: number
    effectiveTaxRate?: number
    creditSpread?: number
    sizeRiskPremium?: number
    roic?: number
    maxSustainableGrowth?: number
    growthExceedsRoic?: 0 | 1
  }
  monteCarlo?: MonteCarloResult
  qualityScore?: number
  lastUpdated: string
}

export interface WatchlistItem {
  ticker: string
  companyName: string
  currentPrice: number
  intrinsicValue: number
  marginOfSafety: number
  verdict: Verdict
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  path: string
}
