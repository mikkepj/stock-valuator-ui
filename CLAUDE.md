# CLAUDE.md — stock-valuator-ui

Guía de referencia para Claude Code al trabajar en este proyecto. Todo basado en el código real existente.

---

## Contexto del proyecto

Frontend React para **Stock Valuator** — herramienta de valuación de acciones por DCF.
FE de arquitectura split: **este repo (React/Vite)** + **BE (stock-valuator, Spring Boot)** comunicados vía REST.

**Repo del backend:** `stock-valuator` (Spring Boot 3.3, Java 21) — rama principal `develop`

---

## Arquitectura

```
stock-valuator-ui/
├── src/
│   ├── api/
│   │   └── client.ts          ← único lugar donde viven las llamadas HTTP (axios)
│   ├── types/
│   │   └── api.ts             ← tipos TypeScript espejo exacto de DTOs Java del BE
│   ├── context/
│   │   └── ThemeContext.tsx   ← ThemeProvider + ThemeContext (dark/light)
│   ├── hooks/
│   │   ├── usePageTitle.ts    ← título dinámico de pestaña
│   │   └── useTheme.ts        ← consume ThemeContext
│   ├── lib/
│   │   └── utils.ts           ← fn cn() para combinar clases Tailwind (clsx + twMerge)
│   ├── components/
│   │   ├── ui/                ← componentes Shadcn/ui (NO editar directamente)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── tooltip.tsx
│   │   ├── Layout.tsx         ← shell: header sticky + <Outlet />
│   │   ├── ThemeToggle.tsx    ← botón Sol/Luna que llama useTheme().toggle()
│   │   ├── VerdictBadge.tsx   ← badge coloreado por veredicto DCF
│   │   ├── Spinner.tsx        ← loading state con Loader2 de lucide
│   │   ├── ErrorMessage.tsx   ← error state con AlertTriangle + botón Reintentar
│   │   ├── AddTickerModal.tsx ← Dialog de Shadcn para agregar ticker a watchlist
│   │   ├── FcfEstimatesForm.tsx ← formulario 5 inputs para FCF estimates de analistas
│   │   ├── SensitivityHeatmap.tsx ← tabla 5×5 con gradiente rojo→verde
│   │   ├── QualityScoreBadge.tsx ← score 0–100 con categoría y tooltip (Fase 6)
│   │   └── MonteCarloChart.tsx   ← BarChart horizontal P10–P90 con Recharts (Fase 6)
│   ├── pages/
│   │   ├── WatchlistPage.tsx  ← ruta `/` — lista de tickers con cards de resumen
│   │   └── TickerDetailPage.tsx ← ruta `/ticker/:ticker` — detalle DCF completo
│   ├── App.tsx                ← BrowserRouter + Routes (Layout wrappea ambas rutas)
│   ├── main.tsx               ← entry point — ThemeProvider wrappea <App />
│   └── index.css              ← tokens Shadcn (oklch), @import tailwindcss, .dark class
├── components.json            ← configuración Shadcn/ui (estilo base-nova, alias @/)
├── vite.config.ts             ← plugins: react + tailwindcss; alias @/ → src/; proxy /api
├── tsconfig.app.json          ← paths @/* → ./src/*
├── plan-fase4-dashboard.md    ← plan de ejecución del proyecto
├── LEARNINGS.md               ← decisiones técnicas, problemas resueltos y quirks del stack
└── docs/plans/                ← planes de feature branches
```

### Flujo de datos

```
BE (Spring Boot :8080)
    ↓ REST
src/api/client.ts  (axios, baseURL /api/v1 via proxy Vite)
    ↓ Promise<ValuationResponse | WatchlistItem[]>
pages/  (estado local con useState + useCallback)
    ↓ props
components/  (presentacionales, sin lógica HTTP)
```

---

## Stack técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | React | ^19.2.4 |
| Lenguaje | TypeScript | ~5.9.3 |
| Build | Vite | ^8.0.1 |
| Routing | react-router-dom | ^7.14.0 |
| HTTP | axios | ^1.14.0 |
| UI components | Shadcn/ui (base-nova) | shadcn ^4.7.0 |
| Estilos | Tailwind CSS v4 | ^4.3.0 |
| Primitivos UI | @base-ui/react | ^1.4.1 |
| Íconos | lucide-react | ^1.14.0 |
| Gráficos | recharts | ^3.8.1 |
| Fuente | Geist Variable | @fontsource-variable/geist |
| Tablas | @tanstack/react-table | ^8.x — sorting client-side en WatchlistPage |
| Utilidades CSS | clsx + tailwind-merge | via cn() en src/lib/utils.ts |

**Configuración clave de Vite:**
- Plugin Tailwind: `@tailwindcss/vite` (NO postcss, NO tailwind.config.js)
- Alias: `@` → `./src`
- Proxy dev: `/api` → `http://localhost:8080`

**Tailwind v4:** la configuración va en `src/index.css` con `@import "tailwindcss"`. No existe `tailwind.config.js`.

---

## Componentes existentes

### Páginas

**`WatchlistPage`** (`/`)
- Carga `getWatchlist()` al montar
- Cards de resumen: total tickers, infravaloradas/sobrevaloradas, margen promedio
- Tabla con `@tanstack/react-table`: columnas Margen y Veredicto ordenables (click en header)
- Orden de Veredicto: UNDERVALUED → FAIR_VALUE → OVERVALUED (custom `sortingFn`)
- Filas hover, VerdictBadge, botones Ver/Recalcular/Eliminar
- Modal AddTickerModal para agregar nuevos tickers

**`TickerDetailPage`** (`/ticker/:ticker`)
- Carga `getValuation(ticker)` al montar
- Header Card: ticker, empresa, sector, precios, VerdictBadge + QualityScoreBadge (si viene del BE)
- Input beta override (opcional) + botón Recalcular DCF con ícono animado
- Tabla de 3 escenarios (Base/Optimista/Pesimista)
- Grid de Cards: breakdown DCF — campos base + 6 campos opcionales de Fase 6 (se omiten si son `undefined`)
- Alerta destructiva si `growthExceedsRoic === 1` (comparar como `number`, no `boolean`)
- FcfEstimatesForm (preocarga estimates existentes)
- SensitivityHeatmap 5×5
- MonteCarloChart — sección condicional debajo del heatmap (solo si `monteCarlo != null`)

### Componentes reutilizables

| Componente | Props | Descripción |
|-----------|-------|-------------|
| `VerdictBadge` | `verdict: Verdict` | Badge con color semántico via CSS vars `--verdict-under/fair/over` |
| `Spinner` | `text?: string` | Loader2 animado centrado, texto opcional |
| `ErrorMessage` | `message: string`, `onRetry?: () => void` | AlertTriangle + párrafo + botón Reintentar opcional |
| `AddTickerModal` | `onClose: () => void`, `onAdded: () => void` | Dialog Shadcn, input ticker en uppercase, llama addToWatchlist |
| `FcfEstimatesForm` | `ticker: string`, `onRecalculated: (data: ValuationResponse) => void` | 5 inputs, precarga del BE, guarda y recalcula |
| `SensitivityHeatmap` | `matrix: Record<string,Record<string,number>>`, `basePrice: number` | Tabla 5×5 gradiente rojo→verde, celda base resaltada con ring |
| `QualityScoreBadge` | `score: number` | Score 0–100 con categoría (Excelente/Bueno/Moderado/Débil) y tooltip descriptivo |
| `MonteCarloChart` | `monteCarlo: MonteCarloResult`, `marketPrice: number` | BarChart horizontal P10–P90, barras verdes/rojas vs precio, ReferenceLine del precio |
| `ThemeToggle` | — | Botón Sun/Moon, consume useTheme() |
| `Layout` | — | Header sticky + `<Outlet />`, envuelve todas las rutas |

### Hooks

| Hook | Uso |
|------|-----|
| `usePageTitle(title?)` | Setea `document.title` al montar, restaura al desmontar |
| `useTheme()` | Retorna `{ theme: 'light'|'dark', toggle: () => void }` |

---

## Estándares de código

### Herramienta obligatoria: Context7

**SIEMPRE usar Context7 antes de implementar con cualquier librería del stack.**
Patrón obligatorio:
1. `mcp__context7__resolve-library-id` con el nombre de la librería
2. `mcp__context7__query-docs` con el ID obtenido y la consulta específica
3. Recién entonces implementar

Nunca asumir APIs de memoria, especialmente: Shadcn/ui, @base-ui/react, react-router-dom v7, Tailwind v4, Vite v8, recharts v3.

### Convenciones

- Componentes en PascalCase, archivos en PascalCase (`WatchlistPage.tsx`)
- Hooks en camelCase con prefijo `use` (`useTheme.ts`)
- Imports con alias `@/` para todo lo que esté en `src/` — no usar rutas relativas (`../`)
- Una página por ruta en `src/pages/`, componentes reutilizables en `src/components/`
- Llamadas HTTP **únicamente** en `src/api/client.ts` — nunca fetch/axios directo en componentes
- `async/await` con try/catch para errores
- **No usar `any`** — tipar siempre con tipos de `src/types/api.ts`
- Named exports en todo — no default exports en componentes
- No usar `default export` en tipos
- Componentes Shadcn en `src/components/ui/` — instalar con `npx shadcn@latest add <nombre>`, no editar a mano

### Sistema de tokens CSS

Los colores usan el sistema oklch de Shadcn definido en `src/index.css`:
- `bg-background`, `text-foreground`, `text-muted-foreground` — colores de superficie y texto
- `bg-card`, `border-border` — cards y bordes
- `text-destructive`, `bg-destructive/10` — errores
- `--verdict-under` (`#22c55e`), `--verdict-fair` (`#eab308`), `--verdict-over` (`#ef4444`) — colores de dominio DCF

La clase `.dark` en `<html>` activa el tema oscuro. Se gestiona via `ThemeProvider`.

---

## Integración con BE

**Base URL dev:** proxy Vite `/api/v1` → `http://localhost:8080/api/v1` (sin CORS en dev)
**Base URL prod:** variable de entorno `VITE_API_URL`

### Funciones en `src/api/client.ts`

```typescript
getValuation(ticker)                        // GET  /valuations/{ticker}
calculate(ticker, betaOverride?)            // POST /valuations/{ticker}/calculate — body { betaOverride } opcional
getWatchlist()                              // GET  /watchlist
addToWatchlist(ticker)                      // POST /watchlist/{ticker}
removeFromWatchlist(ticker)                 // DELETE /watchlist/{ticker}
getFcfEstimates(ticker)                     // GET  /companies/{ticker}/fcf-estimates
saveFcfEstimates(ticker, estimates)         // POST /companies/{ticker}/fcf-estimates
```

`calculate()` sin `betaOverride` omite el `Content-Type` para que el BE acepte body vacío.

### Tipos principales (`src/types/api.ts`)

- `ValuationResponse` — respuesta completa del DCF (ticker, precios, escenarios, matrix, breakdown, `betaUsed`, `monteCarlo?`, `qualityScore?`)
- `MonteCarloResult` — percentiles `p10/p25/p50/p75/p90` + `simulationCount`
- `WatchlistItem` — item resumido para la tabla de watchlist
- `ScenarioResult` — un escenario DCF (Base/Optimista/Pesimista)
- `Verdict` — `'UNDERVALUED' | 'FAIR_VALUE' | 'OVERVALUED'`
- `ApiError` — error estándar del BE `{ timestamp, status, error, path }`

**Regla:** mantener `api.ts` sincronizado con los records Java del BE. Nunca usar `any` para datos de la API.

**`breakdown` es una intersección:** `Record<string, number> & { roic?: number, effectiveTaxRate?: number, ... }` — permite acceso dinámico (`breakdown['sumPvFcfs']`) y tipado para los campos conocidos de Fase 6.

---

## Workflow de desarrollo

### Agregar un nuevo componente

1. **Context7 primero** — si el componente usa alguna librería (Shadcn, lucide, recharts), resolver ID y consultar docs antes de escribir código
2. Si es un componente Shadcn nuevo: `npx shadcn@latest add <nombre>`
3. Crear el archivo en `src/components/NombreComponente.tsx`
4. Usar imports con alias `@/` — nunca rutas relativas
5. Tipar todas las props con interface explícita
6. Verificar: `npx tsc --noEmit`

### Hacer un fix de UI

1. Identificar el componente afectado en la estructura de `src/`
2. Para cambios de color/espaciado: usar clases Tailwind o tokens CSS vars
3. Para layout: revisar si el problema está en el componente o en la página que lo usa
4. Verificar en dark y light mode (toggle en el header)
5. Verificar responsive (breakpoints `sm:`, `lg:`)

### Agregar un nuevo endpoint

1. Agregar el tipo de respuesta en `src/types/api.ts`
2. Agregar la función en `src/api/client.ts`
3. Consumir desde la página correspondiente — nunca desde un componente

---

## Estado actual del proyecto

### Completado

- **Fase 4** — Dashboard completo: WatchlistPage, TickerDetailPage, SensitivityHeatmap, FCF Estimates, escenarios DCF
- **Beta override** — input opcional en recálculo, `betaUsed` en breakdown
- **Fase 5** — UI Redesign completa: Shadcn/ui + Tailwind v4 + tema dark/light + columnas ordenables
- **Fase 6** — Métricas DCF avanzadas: QualityScoreBadge, MonteCarloChart, 6 campos nuevos en breakdown, alerta growthExceedsRoic

### Decisiones de diseño tomadas

- **Tooltip de Shadcn usa `@base-ui/react`**, no Radix — la prop `asChild` no existe; el `TooltipTrigger` envuelve directamente el elemento hijo.
- **Sorting de Veredicto** usa orden lógico DCF (`UNDERVALUED=0, FAIR_VALUE=1, OVERVALUED=2`), no alfabético.
- **`@tanstack/react-table`** se usa headless (sin estilos propios) — el render de filas y celdas es manual con Tailwind, igual al resto de la UI.
- **CSS artesanal eliminado** — no existen archivos `.css` por componente; todo estilo va en clases Tailwind o tokens CSS vars en `index.css`.
- **Campos opcionales del BE se omiten completamente** — cuando un campo del breakdown es `undefined`, la card no se renderiza. No mostrar `"--"` ni placeholders.
- **`growthExceedsRoic` se compara como `number`** — llega como `BigDecimal` de Java, en JSON es `0` o `1`. Comparar con `=== 1`, nunca `=== true`.
- **`fmtBig` soporta trillones** — `$1.60T` para `terminalValueExitMultiple` de empresas grandes. Umbral: `>= 1e12`.
- **`QualityScoreBadge` usa clases Tailwind directas** (`text-green-500`, etc.) en vez de CSS vars de veredicto — son colores de UX genéricos, no colores del dominio DCF.
- **`MonteCarloChart` requiere contenedor con altura explícita** — `ResponsiveContainer` de Recharts necesita un padre con `height` definido o el gráfico no se renderiza.
- **Commits y push requieren aprobación explícita del usuario** antes de ejecutarse.

### Pendiente

- **Fase 4.5** — Deploy a Vercel (requiere URL del BE en producción)
- **Fase 6 smoke test final** — validar con AAPL contra BE con `feature/dcf-quality-improvements` activa

### Git flow

- `main` — producción
- `develop` — integración
- `feature/fase6-dcf-advanced-metrics` — rama activa (Fase 6, pendiente de merge a develop)
- Siempre crear `feature/<nombre>` desde `develop`, mergear de vuelta con `--no-ff`
