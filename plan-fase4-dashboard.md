# stock-valuator-ui — Plan Fase 4: Dashboard

> **Contexto:** FE React + TypeScript en repo separado que consume el BE `stock-valuator` vía REST.
> El BE ya está completo (Fases 1–3.6): valuaciones DCF con 3 escenarios, watchlist, sensitivity matrix.
>
> **Directivas obligatorias:** Usar context7 antes de usar cualquier API de librería. TypeScript estricto, sin `any`.

---

## Fase 4.1 — Setup base

- [x] Vite + React 19 + TypeScript
- [x] Dependencias: `axios`, `react-router-dom`, `recharts`
- [x] Proxy Vite → BE en `localhost:8080`
- [x] `src/types/api.ts` — tipos espejo de los DTOs Java
- [x] `src/api/client.ts` — funciones axios para todos los endpoints
- [x] Configurar `react-router-dom` con rutas en `App.tsx`
- [x] Limpiar boilerplate de Vite (App.tsx, App.css, index.css)
- [x] Layout base con navegación (header con link a Watchlist)

---

## Fase 4.2 — Pantalla Watchlist (`/`)

**Ruta:** `/`

- [x] `WatchlistPage.tsx` — tabla con columnas: Ticker | Empresa | Precio | Valor Intrínseco | Margen | Veredicto | Acciones
- [x] Color coding por veredicto: verde `#22c55e` (UNDERVALUED), amarillo `#eab308` (FAIR_VALUE), rojo `#ef4444` (OVERVALUED)
- [x] Botón "Agregar ticker" → `AddTickerModal`
- [x] `AddTickerModal.tsx` — input de ticker, llama `POST /watchlist/{ticker}`, refresca lista
- [x] Botón "Recalcular" por fila → llama `POST /valuations/{ticker}/calculate`, muestra loading
- [x] Botón "Ver detalle" por fila → navega a `/ticker/:ticker`
- [x] Botón "Eliminar" por fila → llama `DELETE /watchlist/{ticker}`, refresca lista
- [x] Estado de carga y error manejado en cada acción

---

## Fase 4.3 — Pantalla Detalle de Ticker (`/ticker/:ticker`)

**Ruta:** `/ticker/:ticker`

### Header
- [x] Nombre, sector, ticker
- [x] Precio de mercado vs valor intrínseco (Base)
- [x] Badge de veredicto con color

### Panel de Escenarios
- [x] Tabla o cards con los 3 escenarios: Base / Optimista / Pesimista
- [x] Columnas: Nombre | IV/acción | Margen de seguridad | Veredicto | CAGR inicial | WACC

### DCF Breakdown
- [x] Tabla simple: WACC | Terminal Growth | Terminal Value | Net Debt | Projection Years
- [x] `sumPvFcfs` y `terminalValue` del breakdown

### FCF Estimates (entrada manual)
- [x] Formulario para ingresar hasta 5 valores de FCF estimados (de Koyfin)
- [x] Llama `POST /companies/{ticker}/fcf-estimates`
- [x] Botón "Recalcular con nuevas estimaciones" post-guardado

### Sensitivity Heatmap
- [x] `SensitivityHeatmap.tsx` — tabla 5×5 con gradiente de color
- [x] Eje X (columnas): ajuste de WACC (`-1%` → `+1%`)
- [x] Eje Y (filas): ajuste de terminal growth (`-2%` → `+2%`)
- [x] Celda central resaltada (escenario base)
- [x] Gradiente: rojo (valores bajos) → verde (valores altos)

---

## Fase 4.4 — Polish y UX

- [x] Loading spinner global mientras carga datos
- [x] Manejo de error con mensaje amigable (ticker no encontrado, error de red)
- [x] Responsive básico (funciona en tablet)
- [x] Favicon y título de página dinámico (`MSFT — Stock Valuator`)

---

## Fase 4.5 — Deploy

- [x] `vercel.json` con rewrite SPA para que `/ticker/:ticker` no dé 404 al refrescar
- [x] `.env.production.example` con placeholder de `VITE_API_URL`
- [ ] Cuando tengas URL del BE: crear `.env.production` (o variable en Vercel dashboard) con `VITE_API_URL=https://...`
- [ ] Conectar repo a Vercel (import project → framework Vite, build command `npm run build`, output `dist`)
- [ ] Agregar URL de Vercel a `stockvaluator.cors.allowed-origins` en el BE
- [ ] Smoke test en producción: valuación MSFT end-to-end

---

## Mejoras pendientes

- [ ] **FCF Estimates pre-cargados:** El BE debe exponer los FCF estimates guardados en BD (campo `fcfEstimates: number[]` en `ValuationResponse` o endpoint `GET /companies/{ticker}/fcf-estimates`). Una vez disponible, pre-rellenar los inputs de `FcfEstimatesForm` con los valores existentes para no tener que reintroducirlos todos al querer cambiar uno solo.

---

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/types/api.ts` | Tipos TypeScript espejo de los DTOs Java — mantener sincronizados |
| `src/api/client.ts` | Todas las llamadas HTTP al BE — no hacer fetch directo en componentes |
| `src/components/` | `VerdictBadge`, `Spinner`, `ErrorMessage`, `AddTickerModal`, `SensitivityHeatmap`, `FcfEstimatesForm`, `Layout` |
| `src/hooks/usePageTitle.ts` | Título dinámico de pestaña |
| `CLAUDE.md` | Contexto del proyecto, contratos API, convenciones |
| `vite.config.ts` | Proxy dev hacia BE en localhost:8080 |
| `vercel.json` | Rewrite SPA para deploy en Vercel |
| `.env.production.example` | Plantilla de variable de entorno para producción |
