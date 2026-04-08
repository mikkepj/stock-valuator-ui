import axios from 'axios'
import type { ValuationResponse, WatchlistItem } from '../types/api'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// --- Valuaciones ---

export const getValuation = (ticker: string): Promise<ValuationResponse> =>
  http.get<ValuationResponse>(`/valuations/${ticker}`).then(r => r.data)

export const calculate = (ticker: string): Promise<ValuationResponse> =>
  http.post<ValuationResponse>(`/valuations/${ticker}/calculate`).then(r => r.data)

// --- Watchlist ---

export const getWatchlist = (): Promise<WatchlistItem[]> =>
  http.get<WatchlistItem[]>('/watchlist').then(r => r.data)

export const addToWatchlist = (ticker: string): Promise<void> =>
  http.post(`/watchlist/${ticker}`).then(() => undefined)

export const removeFromWatchlist = (ticker: string): Promise<void> =>
  http.delete(`/watchlist/${ticker}`).then(() => undefined)

// --- FCF Estimates ---

export const getFcfEstimates = (ticker: string): Promise<number[]> =>
  http.get<number[]>(`/companies/${ticker}/fcf-estimates`).then(r => r.data)

export const saveFcfEstimates = (ticker: string, estimates: number[]): Promise<void> =>
  http.post(`/companies/${ticker}/fcf-estimates`, { estimates }).then(() => undefined)
