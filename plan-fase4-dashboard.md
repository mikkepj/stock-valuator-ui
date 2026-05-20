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

- [x] **FCF Estimates pre-cargados:** `GET /companies/{ticker}/fcf-estimates` devuelve `number[]`. `FcfEstimatesForm` carga los valores al montar y pre-rellena los inputs. Si no hay estimates en BD los inputs quedan vacíos.
- [x] **Beta override en recálculo:** input numérico opcional en `TickerDetailPage`; si se ingresa, se envía `{ betaOverride }` en el body del `POST /valuations/{ticker}/calculate`. `betaUsed` se muestra en el DCF Breakdown.

---

## Fase 5 — UI Redesign: Shadcn/ui + Tailwind + Tema oscuro/claro

> **Rama:** `feature/ui-redesign-shadcn`
> **Objetivo:** Llevar la interfaz al nivel de herramientas modernas (Linear, Vercel). Migrar el CSS artesanal a Tailwind v4 + Shadcn/ui. Sin tocar lógica de negocio, API ni tipos.

### 5.1 — Setup de dependencias
- [x] Instalar Tailwind CSS v4 y configurar en `vite.config.ts` / `index.css`
- [x] Instalar y configurar Shadcn/ui (`npx shadcn init`)
- [x] Configurar alias de paths (`@/`) en `tsconfig.app.json` y `vite.config.ts`
- [x] Eliminar todos los archivos `.css` de componentes y páginas (reemplazados por Tailwind)

### 5.2 — Sistema de temas
- [x] Definir tokens CSS de Shadcn para tema oscuro y claro en `index.css`
- [x] `ThemeProvider` — context con estado `'light' | 'dark'`, persiste en `localStorage`
- [x] Toggle dark/light en el header (ícono sol/luna con `lucide-react`)
- [x] Detectar preferencia del SO como valor inicial si no hay preferencia guardada

### 5.3 — Layout y navegación
- [x] Migrar `Layout.tsx` — header con Tailwind, logo, nav links, toggle de tema
- [x] Agregar componente `ThemeToggle` en el header

### 5.4 — WatchlistPage
- [x] Cards de resumen en la parte superior: total tickers | undervalued count | avg margen
- [x] `VerdictBadge` migrado con tokens de color semánticos
- [x] `AddTickerModal` migrado a Shadcn `Dialog`
- [x] Tabla con filas alternadas, hover states, botones Shadcn
- [x] Columnas ordenables por margen de seguridad y veredicto (`@tanstack/react-table`)

### 5.5 — TickerDetailPage
- [x] Header con `Card` de Shadcn: ticker, empresa, sector, precios, badge de veredicto
- [x] DCF Breakdown como grid de `Card`
- [x] Input de beta override con Shadcn `Input` + `Label` + `Tooltip` (referencia Damodaran)
- [x] Sensitivity Heatmap reestilizada con Tailwind

### 5.6 — Componentes compartidos
- [x] `Spinner` con `Loader2` animado de lucide-react
- [x] `ErrorMessage` con `AlertTriangle` y botón Reintentar
- [x] `FcfEstimatesForm` con Shadcn `Input`, `Button`, layout Tailwind
- [x] `SensitivityHeatmap` con Tailwind, celda base resaltada con ring

### 5.7 — Polish final
- [x] Transiciones suaves en cambio de tema (`transition-colors duration-200` global)
- [x] Build de TypeScript sin errores (`tsc --noEmit`)
- [x] Smoke test visual validado en dark y light mode
- [x] Columnas ordenables en WatchlistPage (Margen y Veredicto)

---

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/types/api.ts` | Tipos TypeScript espejo de los DTOs Java — mantener sincronizados |
| `src/api/client.ts` | Todas las llamadas HTTP al BE — no hacer fetch directo en componentes |
| `src/components/` | `VerdictBadge`, `Spinner`, `ErrorMessage`, `AddTickerModal`, `SensitivityHeatmap`, `FcfEstimatesForm`, `Layout`, `ThemeToggle` |
| `src/hooks/usePageTitle.ts` | Título dinámico de pestaña |
| `src/hooks/useTheme.ts` | Hook para leer y cambiar el tema activo |
| `src/lib/utils.ts` | `cn()` helper de Shadcn para combinar clases Tailwind |
| `CLAUDE.md` | Contexto del proyecto, contratos API, convenciones |
| `vite.config.ts` | Proxy dev hacia BE en localhost:8080, alias `@/` |
| `vercel.json` | Rewrite SPA para deploy en Vercel |
| `.env.production.example` | Plantilla de variable de entorno para producción |
| `components.json` | Configuración de Shadcn/ui |
