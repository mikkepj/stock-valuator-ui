# CLAUDE.md — stock-valuator-ui

Guía de referencia para Claude Code al trabajar en este proyecto.

---

## Contexto del proyecto

Frontend React para **Stock Valuator** — herramienta de valuación de acciones por DCF.
Este repo es el FE de la arquitectura split: **FE (este repo) + BE (stock-valuator)** comunicados vía REST.

**Repo del backend:** `stock-valuator` (Spring Boot 3.3, Java 21)
**Rama principal BE:** `develop`

---

## Arquitectura

```
stock-valuator-ui/          ← este repo (React + Vite + TypeScript)
    src/
    ├── api/                ← funciones axios que llaman al BE
    │   └── client.ts       ← un cliente por dominio (valuations, watchlist)
    ├── types/
    │   └── api.ts          ← tipos TypeScript espejo de los DTOs Java del BE
    ├── pages/              ← una carpeta por página/ruta
    └── components/         ← componentes reutilizables

stock-valuator/             ← repo del BE (Spring Boot)
    api-web/                ← controllers, services, DTOs
    valuation-engine/       ← lógica DCF pura (sin Spring)
    data-ingestion/         ← cliente FMP API, entidades JPA
```

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + Vite |
| Lenguaje | TypeScript |
| Routing | react-router-dom |
| HTTP | axios |
| Gráficos | Recharts |
| Build | Vite |

---

## API del backend

**Base URL dev:** `http://localhost:8080/api/v1` (proxy Vite → sin CORS en dev)
**Base URL prod:** variable de entorno `VITE_API_URL`

### Endpoints disponibles

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/valuations/{ticker}` | Última valuación cacheada |
| POST | `/valuations/{ticker}/calculate` | Fuerza recálculo DCF |
| GET | `/watchlist` | Lista de tickers en watchlist |
| POST | `/watchlist/{ticker}` | Agrega ticker a watchlist |
| DELETE | `/watchlist/{ticker}` | Elimina ticker de watchlist |
| POST | `/companies/{ticker}/fcf-estimates` | Guarda FCF estimates de analistas |

### Response principal — `ValuationResponse`

```typescript
{
  ticker: string
  companyName: string
  sector: string
  intrinsicValuePerShare: number   // valor intrínseco calculado por DCF
  marketPrice: number              // precio de mercado actual
  marginOfSafety: number           // % margen: (IV - price) / price × 100
  verdict: 'UNDERVALUED' | 'FAIR_VALUE' | 'OVERVALUED'
  wacc: number                     // ej: 0.0917
  terminalGrowthRate: number       // ej: 0.025
  projectionYears: number          // siempre 10
  terminalValue: number
  netDebt: number
  scenarios: ScenarioResult[]      // Base, Optimista, Pesimista
  sensitivityMatrix: Record<string, Record<string, number>>  // WACC × growth 5×5
  breakdown: Record<string, number>
  lastUpdated: string              // ISO datetime
}
```

### Escenarios DCF

El BE calcula siempre tres escenarios:
- **Base:** CAGR histórico con decay lineal (o FCF estimates de analistas)
- **Optimista:** CAGR × 1.30 (cap 25%), WACC base
- **Pesimista:** CAGR × 0.75, WACC + 0.5%

### Sensitivity Matrix

Objeto 5×5 donde las claves del eje X son ajustes de WACC (`"-1.00%"`, `"-0.50%"`, `"0.00%"`, `"+0.50%"`, `"+1.00%"`) y las del eje Y ajustes de terminal growth rate (`"-2.00%"` a `"+2.00%"`). La celda `"0.00%"."0.00%"` coincide con el escenario Base.

### Errors

```typescript
{ timestamp: string, status: number, error: string, path: string }
```

---

## Tipos TypeScript

Los tipos viven en `src/types/api.ts` y son el espejo exacto de los records Java en el BE.
**Nunca usar `any` para datos de la API** — siempre tipar con los tipos de `api.ts`.

---

## Convenciones de código

- Componentes en PascalCase, archivos en PascalCase (`WatchlistPage.tsx`)
- Hooks en camelCase con prefijo `use` (`useValuation.ts`)
- Una página por ruta, componentes reutilizables en `components/`
- `async/await` para llamadas HTTP, manejar errores con try/catch
- No usar `default export` en tipos — siempre named exports
- Colores de veredicto: verde `#22c55e` (UNDERVALUED), amarillo `#eab308` (FAIR_VALUE), rojo `#ef4444` (OVERVALUED)

---

## Variables de entorno

```
VITE_API_URL=http://localhost:8080/api/v1   # dev (opcional, el proxy de Vite lo maneja)
VITE_API_URL=https://tu-backend.railway.app/api/v1  # prod
```

---

## Comandos útiles

```bash
npm run dev        # servidor de desarrollo en :5173
npm run build      # build de producción en dist/
npm run preview    # previsualizar build
npm run lint       # linter
```

---

## Directivas obligatorias

1. **Usar context7** antes de usar cualquier API de librería (Recharts, react-router-dom, axios). No asumir APIs de memoria.
2. **TypeScript estricto** — no usar `any`, tipar todos los props de componentes.
3. **No duplicar lógica** — las llamadas HTTP van siempre en `src/api/client.ts`.
