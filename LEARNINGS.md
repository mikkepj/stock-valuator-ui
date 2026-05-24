# LEARNINGS.md — stock-valuator-ui

Decisiones técnicas tomadas, problemas resueltos y quirks del stack descubiertos durante el desarrollo.
Ordenado por área. Actualizar cuando aparezca algo nuevo.

> **Última actualización:** 2026-05-24 — Fase 6 (métricas DCF avanzadas) implementada y validada sin cambios.

---

## Shadcn/ui + @base-ui/react

### El Tooltip NO usa Radix — usa @base-ui/react
La instalación de Shadcn con `base-nova` genera un `tooltip.tsx` basado en `@base-ui/react/tooltip`,
no en `@radix-ui/react-tooltip`. La diferencia crítica:

- **No existe la prop `asChild`** en `TooltipTrigger`.
- El trigger envuelve directamente el elemento hijo sin composición explícita.
- Para mostrar un tooltip sobre un ícono, alcanza con:

```tsx
<Tooltip>
  <TooltipTrigger>
    <Info size={12} className="cursor-help" />
  </TooltipTrigger>
  <TooltipContent>Texto del tooltip</TooltipContent>
</Tooltip>
```

- La nueva API de `@base-ui` acepta una prop `render` en el trigger, pero no es necesaria para uso básico.
- Toda la animación y posicionamiento está en `TooltipPrimitive.Positioner` + `TooltipPrimitive.Popup`, no en el trigger.

### TooltipProvider debe envolver la página, no cada tooltip
`<TooltipProvider>` configura el delay global. Ponerlo en cada `<Tooltip>` individual genera nesting
innecesario. El patrón correcto es envolverlo en el root de la página o en `Layout.tsx`.

### Componentes Shadcn: nunca editar `src/components/ui/` a mano
Los archivos en `ui/` los genera el CLI de Shadcn. Editarlos a mano se pierde al hacer
`npx shadcn@latest add` de nuevo. Toda customización va en el componente que los consume.

---

## Tailwind CSS v4

### No existe `tailwind.config.js`
En v4 la configuración completa va en `src/index.css` con directivas `@import` y `@custom-variant`.
El plugin es `@tailwindcss/vite` — no postcss, no archivo de configuración separado.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

### Dark mode con clase `.dark` en `<html>`
Se define con `@custom-variant dark (&:is(.dark *))` en `index.css`. La clase `.dark` se agrega
al elemento `<html>` desde `ThemeContext`. No usar `media` strategy — la preferencia del SO
solo se lee como valor inicial, el usuario puede overridearla.

### Tokens de color: oklch, no hex
Los tokens de Shadcn usan `oklch()`. Los colores de dominio DCF son hex normales como CSS vars:
`--verdict-under: #22c55e`, etc. Mezclar ambos está bien — oklch solo aplica a los tokens del sistema.

### Colores de veredicto: usar CSS vars, no clases Tailwind
No usar `text-green-500` para el veredicto — usar `style={{ color: 'var(--verdict-under)' }}`.
Esto centraliza los colores y permite cambiarlos desde un solo lugar (`index.css`).

**Excepción:** `QualityScoreBadge` usa clases Tailwind (`text-green-500`, `text-blue-500`, etc.)
porque son colores de UX genéricos (calidad del negocio), no colores del dominio DCF.

---

## Recharts v3

### BarChart horizontal requiere `layout="vertical"`
Contra-intuitivo: para barras que crecen de izquierda a derecha, el prop se llama `layout="vertical"`.
El eje de categorías (YAxis) debe tener `type="category"` y el de valores (XAxis) `type="number"`.

```tsx
<BarChart data={data} layout="vertical">
  <XAxis type="number" dataKey="value" />
  <YAxis type="category" dataKey="name" />
  <Bar dataKey="value" />
</BarChart>
```

### Cell para colores condicionales por barra
Para colorear cada barra individualmente se usa `<Cell>` dentro de `<Bar>`:

```tsx
<Bar dataKey="value">
  {data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={entry.aboveMarket ? '#22c55e' : '#ef4444'} />
  ))}
</Bar>
```

### ReferenceLine para marcar precio de mercado
`<ReferenceLine x={marketPrice} />` dibuja una línea vertical en el valor dado. Solo funciona
si el eje correspondiente (`XAxis`) tiene `type="number"`.

### ResponsiveContainer requiere un contenedor con altura explícita
El padre de `<ResponsiveContainer>` necesita `height` definido (ej. `className="h-52"`).
Sin eso, Recharts no puede calcular las dimensiones y el gráfico no se renderiza.

---

## @tanstack/react-table v8

### Sorting de Veredicto: orden lógico DCF, no alfabético
El orden natural de strings sería `FAIR_VALUE → OVERVALUED → UNDERVALUED` (alfabético).
El orden correcto para DCF es `UNDERVALUED → FAIR_VALUE → OVERVALUED`. Se resuelve con
`sortingFn` custom usando un mapa de prioridades:

```ts
const VERDICT_ORDER = { UNDERVALUED: 0, FAIR_VALUE: 1, OVERVALUED: 2 }

sortingFn: (rowA, rowB) =>
  VERDICT_ORDER[rowA.original.verdict] - VERDICT_ORDER[rowB.original.verdict]
```

### La tabla es headless — el render es completamente manual
`@tanstack/react-table` no genera HTML. Todo el markup de `<table>`, `<thead>`, `<tr>`, etc.
es responsabilidad del componente. El hook solo provee el modelo de datos ordenado.
Usar `flexRender` para renderizar headers y cells con el contexto correcto.

### `useMemo` en la definición de columnas es obligatorio
Si las columnas se definen inline en el componente sin `useMemo`, se re-crean en cada render
y la tabla pierde el estado de sorting. Siempre wrappear con `useMemo([], [])`.

---

## React + Vite

### Proxy Vite: `/api` → `http://localhost:8080`
En desarrollo, las llamadas a `/api/v1/...` las intercepta Vite y las redirige al BE.
Esto elimina CORS en dev sin necesidad de configuración en el backend.
En producción, `VITE_API_URL` apunta directamente al BE (sin proxy).

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true }
  }
}
```

### `void` en handlers de eventos async
React muestra warning si un event handler retorna una Promise. El patrón correcto:

```tsx
onClick={() => void handleRecalculate(ticker)}
// En lugar de:
onClick={handleRecalculate}  // ← warning si handleRecalculate es async
```

### `useCallback` en funciones de carga de datos
Las funciones que hacen fetch y se usan en `useEffect` deben ir en `useCallback` para evitar
re-ejecuciones infinitas. El array de dependencias del `useEffect` incluye la función memoizada.

---

## Axios

### `calculate()` sin betaOverride: omitir Content-Type
El endpoint `POST /valuations/{ticker}/calculate` acepta body vacío. Axios con
`Content-Type: application/json` y body `undefined` envía `null` en algunos casos,
lo que Spring Boot rechaza. La solución:

```ts
export const calculate = (ticker: string, betaOverride?: number): Promise<ValuationResponse> => {
  const body = betaOverride !== undefined ? { betaOverride } : undefined
  return http.post(..., body, {
    headers: betaOverride !== undefined ? undefined : { 'Content-Type': undefined },
  })
}
```

Cuando `betaOverride` es `undefined`, se sobreescribe el header para que Axios no lo envíe.

---

## TypeScript

### `breakdown` tipado como intersección con campos opcionales
El campo `breakdown` del BE es `Record<string, number>` en el contrato base, pero las mejoras
de Fase 6 agregan campos nombrados específicos. Se tipó como intersección para mantener
compatibilidad y agregar autocompletado:

```ts
breakdown: Record<string, number> & {
  terminalValueExitMultiple?: number
  effectiveTaxRate?: number
  // ...
}
```

Esto permite acceder tanto con `breakdown['sumPvFcfs']` (campos dinámicos) como con
`breakdown.roic` (campos conocidos con tipo).

### `growthExceedsRoic` es `number`, no `boolean`
El backend lo devuelve como `BigDecimal` Java, que en JSON llega como `0` o `1`.
La comparación correcta es `=== 1`, no `=== true` ni conversión booleana implícita.

### Campos opcionales del BE: omitir la fila, no mostrar `"--"`
Para campos que pueden no venir en respuestas antiguas, el patrón es spread condicional:

```ts
...(data.breakdown.roic !== undefined
  ? [{ label: 'ROIC', value: fmtPct(data.breakdown.roic) }]
  : [])
```

Nunca `breakdown.roic ?? '--'` — ocultar la card es mejor UX que mostrar un placeholder vacío.

---

## Arquitectura general

### Llamadas HTTP únicamente en `src/api/client.ts`
Ningún componente hace fetch directo. Las páginas llaman funciones de `client.ts` y pasan
los datos como props a los componentes. Esto centraliza el manejo de errores y la tipificación.

### `fmtBig` con soporte de trillones
La función original solo cubría B y M. Se agregó el caso T para `terminalValueExitMultiple`
que puede llegar a valores > $1T para empresas grandes (Apple, Microsoft):

```ts
function fmtBig(n: number) {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`
  return `$${fmt(n)}`
}
```

### Campos opcionales del BE: omitir la card, no mostrar placeholder
Para campos de Fase 6 que pueden no venir en valoraciones antiguas, el patrón correcto
es spread condicional que omite la entrada completamente:

```ts
...(data.breakdown.roic !== undefined
  ? [{ label: 'ROIC', value: fmtPct(data.breakdown.roic) }]
  : [])
```

Mostrar `"--"` o `"N/A"` genera ruido visual. Si el BE no lo trae, la card no existe.

### Heatmap: colores hardcodeados, no tokens CSS
`SensitivityHeatmap` usa `interpolateColor()` que genera RGB interpolado entre rojo y verde.
No puede usar variables CSS porque necesita calcular el color programáticamente en función
del ratio min/max de los valores. Es la única excepción al sistema de tokens.

### Git flow
- `main` → producción
- `develop` → integración (rama base para features)
- `feature/<nombre>` → feature branches, siempre desde `develop`, merge con `--no-ff`

---

## Workflow y proceso

### Estructura de feature branches: plan antes de código
Para cada feature nueva se crea un plan en `docs/plans/plan-<nombre>.md` antes de tocar
cualquier archivo de código. El plan incluye: objetivo, archivos a modificar, orden de
implementación, criterios de aceptación y riesgos. Se espera aprobación explícita del usuario
antes de arrancar.

### Context7: verificar antes de asumir APIs
Las APIs de Recharts v3, Shadcn/ui con @base-ui, y react-router-dom v7 cambiaron
suficientemente entre versiones como para no confiar en conocimiento de entrenamiento.
Siempre resolver library ID + query docs antes de implementar con estas librerías.
En esta sesión el flujo fue:
1. `mcp__context7__resolve-library-id` para recharts, shadcn/ui, lucide-react
2. `mcp__context7__query-docs` con consultas específicas (BarChart horizontal, Tooltip API)
3. Recién entonces implementar

Resultado: la API del Tooltip de Shadcn confirmó que `render` prop existe en `TooltipTrigger`
pero no es necesaria para uso básico — el trigger envuelve el hijo directamente.

### `tsc --noEmit` como gate obligatorio
Antes de declarar una feature completa, siempre correr `npx tsc --noEmit`.
En Fase 6: pasó sin errores en el primer intento gracias al tipado cuidadoso de la
intersección en `breakdown` y los campos opcionales en `ValuationResponse`.
