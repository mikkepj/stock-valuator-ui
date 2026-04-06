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
- [ ] Configurar `react-router-dom` con rutas en `App.tsx`
- [ ] Limpiar boilerplate de Vite (App.tsx, App.css, index.css)
- [ ] Layout base con navegación (header con link a Watchlist)

---

## Fase 4.2 — Pantalla Watchlist (`/`)

**Ruta:** `/`

- [ ] `WatchlistPage.tsx` — tabla con columnas: Ticker | Empresa | Precio | Valor Intrínseco | Margen | Veredicto | Acciones
- [ ] Color coding por veredicto: verde `#22c55e` (UNDERVALUED), amarillo `#eab308` (FAIR_VALUE), rojo `#ef4444` (OVERVALUED)
- [ ] Botón "Agregar ticker" → `AddTickerModal`
- [ ] `AddTickerModal.tsx` — input de ticker, llama `POST /watchlist/{ticker}`, refresca lista
- [ ] Botón "Recalcular" por fila → llama `POST /valuations/{ticker}/calculate`, muestra loading
- [ ] Botón "Ver detalle" por fila → navega a `/ticker/:ticker`
- [ ] Botón "Eliminar" por fila → llama `DELETE /watchlist/{ticker}`, refresca lista
- [ ] Estado de carga y error manejado en cada acción

---

## Fase 4.3 — Pantalla Detalle de Ticker (`/ticker/:ticker`)

**Ruta:** `/ticker/:ticker`

### Header
- [ ] Nombre, sector, ticker
- [ ] Precio de mercado vs valor intrínseco (Base)
- [ ] Badge de veredicto con color

### Panel de Escenarios
- [ ] Tabla o cards con los 3 escenarios: Base / Optimista / Pesimista
- [ ] Columnas: Nombre | IV/acción | Margen de seguridad | Veredicto | CAGR inicial | WACC

### DCF Breakdown
- [ ] Tabla simple: WACC | Terminal Growth | Terminal Value | Net Debt | Projection Years
- [ ] `sumPvFcfs` y `terminalValue` del breakdown

### FCF Estimates (entrada manual)
- [ ] Formulario para ingresar hasta 5 valores de FCF estimados (de Koyfin)
- [ ] Llama `POST /companies/{ticker}/fcf-estimates`
- [ ] Botón "Recalcular con nuevas estimaciones" post-guardado

### Sensitivity Heatmap
- [ ] `SensitivityHeatmap.tsx` — tabla 5×5 con gradiente de color
- [ ] Eje X (columnas): ajuste de WACC (`-1%` → `+1%`)
- [ ] Eje Y (filas): ajuste de terminal growth (`-2%` → `+2%`)
- [ ] Celda central resaltada (escenario base)
- [ ] Gradiente: rojo (valores bajos) → verde (valores altos)

---

## Fase 4.4 — Polish y UX

- [ ] Loading spinner global mientras carga datos
- [ ] Manejo de error con mensaje amigable (ticker no encontrado, error de red)
- [ ] Responsive básico (funciona en tablet)
- [ ] Favicon y título de página dinámico (`MSFT — Stock Valuator`)

---

## Fase 4.5 — Deploy

- [ ] Crear `.env.production` con `VITE_API_URL` apuntando al BE en Railway/Render
- [ ] Configurar deploy en Vercel (conectar repo, variable de entorno)
- [ ] Verificar CORS: agregar URL de Vercel a `stockvaluator.cors.allowed-origins` en el BE
- [ ] Smoke test en producción: valuación MSFT end-to-end

---

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/types/api.ts` | Tipos TypeScript espejo de los DTOs Java — mantener sincronizados |
| `src/api/client.ts` | Todas las llamadas HTTP al BE — no hacer fetch directo en componentes |
| `CLAUDE.md` | Contexto del proyecto, contratos API, convenciones |
| `vite.config.ts` | Proxy dev hacia BE en localhost:8080 |

---

## Para retomar mañana

Decirle a Claude: **"Continuemos con la Fase 4, empieza por 4.1 completando el setup base"**

O ir directo a una sección: **"Implementa la WatchlistPage"**
