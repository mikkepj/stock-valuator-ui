# Plan — Fase 6: Exposición de métricas DCF avanzadas del backend

## Objetivo

Exponer en el frontend las 10 mejoras del motor DCF ya disponibles en el backend
(`feature/dcf-quality-improvements`, mergeada a `develop` del BE). El frontend no
muestra ninguna de ellas. La fase cierra esa brecha sin tocar lógica de negocio,
llamadas HTTP ni tipos existentes — solo agrega tipos nuevos, campos nuevos en el
breakdown y dos componentes nuevos.

---

## Módulo destino

- `src/types/api.ts` — tipos
- `src/components/` — `QualityScoreBadge.tsx`, `MonteCarloChart.tsx`
- `src/pages/TickerDetailPage.tsx` — integración de los nuevos componentes y campos

---

## Archivos a crear o modificar

- [x] `src/types/api.ts` — agregar `MonteCarloResult`, extender `ValuationResponse` y `BreakdownMap`
- [x] `src/components/QualityScoreBadge.tsx` — nuevo componente (score 0–100 con tooltip)
- [x] `src/components/MonteCarloChart.tsx` — nuevo componente (percentiles P10–P90 con Recharts)
- [x] `src/pages/TickerDetailPage.tsx` — integrar nuevos campos en DCF Breakdown + renderizar `QualityScoreBadge` y `MonteCarloChart`

---

## Orden de implementación

1. **6.1** — Actualizar `src/types/api.ts` (base para todo lo demás)
2. **6.2** — Ampliar DCF Breakdown en `TickerDetailPage` con los nuevos campos del breakdown
3. **6.3** — Crear `QualityScoreBadge.tsx` e integrarlo en el header de `TickerDetailPage`
4. **6.4** — Crear `MonteCarloChart.tsx` e integrarlo debajo del Sensitivity Heatmap
5. **6.5** — Polish: manejo de `null`/`undefined`, `tsc --noEmit`, smoke test dark/light

---

## Criterios de aceptación

### 6.1 — Tipos
- Given: el BE devuelve `monteCarlo` con p10..p90 y `simulationCount`
- When: el frontend recibe la respuesta
- Then: TypeScript no lanza error — `ValuationResponse.monteCarlo` es `MonteCarloResult | undefined`

- Given: el BE devuelve `qualityScore: 90`
- When: se renderiza `TickerDetailPage`
- Then: `QualityScoreBadge` recibe `score={90}` sin error de tipos

### 6.2 — DCF Breakdown ampliado
- Given: `effectiveTaxRate = 0.143`
- When: se muestra en el breakdown
- Then: se formatea como `"14.3%"`

- Given: `growthExceedsRoic = 1`
- When: se renderiza el breakdown
- Then: se muestra badge/alerta destructiva; cuando es `0`, no aparece nada

- Given: `terminalValueExitMultiple = 1_600_000_000_000`
- When: se muestra
- Then: se formatea como `"$1.60T"`

- Given: algún campo nuevo es `null` o `undefined` (valoración antigua)
- When: se renderiza
- Then: la fila se omite completamente (no se muestra `"--"` ni `"undefined"`)

### 6.3 — QualityScoreBadge
- Given: `score = 90`
- When: se renderiza
- Then: muestra `90 / 100`, texto `"Excelente"` en verde

- Given: `score = 65`
- Then: `"Bueno"` en azul

- Given: `score = 50`
- Then: `"Moderado"` en amarillo

- Given: `score = 30`
- Then: `"Débil"` en rojo

- Given: `qualityScore` es `null` o `undefined`
- Then: el componente no se renderiza

- Given: el usuario hace hover sobre el badge
- Then: aparece tooltip con descripción de los factores del score

### 6.4 — MonteCarloChart
- Given: `monteCarlo` tiene los 5 percentiles y `simulationCount = 1000`
- When: se renderiza
- Then: muestra subtítulo `"Basado en 1.000 simulaciones"`

- Given: `P50 > marketPrice`
- Then: la barra/fila del P50 se colorea en verde

- Given: `P50 < marketPrice`
- Then: la barra/fila del P50 se colorea en rojo

- Given: `monteCarlo` es `null` o `undefined`
- Then: el componente no se renderiza

### 6.5 — Polish
- `npx tsc --noEmit` sin errores
- Smoke test AAPL en dark y light mode
- Alerta `growthExceedsRoic` NO aparece para AAPL (ROIC 82% >> crecimiento)

---

## Riesgos identificados

- **API de Recharts v3** — verificar con Context7 antes de implementar `MonteCarloChart`; la API de `BarChart` horizontal cambió entre v2 y v3.
- **Tooltip de Shadcn usa `@base-ui/react`** — no tiene prop `asChild`; el `TooltipTrigger` envuelve directamente el elemento hijo (ya documentado en CLAUDE.md).
- **Campos opcionales del backend** — valoraciones calculadas antes del merge de `dcf-quality-improvements` no tienen los nuevos campos; todos deben tratarse como `undefined` sin romper el render.
- **`growthExceedsRoic` viene como `BigDecimal` del BE** — en JSON llega como `number` (0 o 1), no como `boolean`; la comparación debe ser `=== 1`, no `=== true`.
- **Formato de grandes valores monetarios** — `$1.60T` requiere lógica de sufijos (T/B/M); implementar una función utilitaria pequeña en el mismo archivo o en `src/lib/utils.ts`.
