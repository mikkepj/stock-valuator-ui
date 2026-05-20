# Workflow: Fix de bug visual (UI)

---

## PASO 1 — Describir el problema

Antes de tocar código, documentar:

1. **¿Qué se ve?** — describir el comportamiento visual actual
2. **¿Qué debería verse?** — comportamiento esperado
3. **¿Dónde?** — ruta (`/` o `/ticker/:ticker`), componente, breakpoint, modo (dark/light)
4. **¿Cuándo?** — siempre, al hover, al cargar, con datos específicos

Si tenés screenshot, adjuntarlo al mensaje. Claude Code puede leer imágenes directamente.

Ejemplo de descripción útil:
> "En `/ticker/MSFT` modo dark, el badge de veredicto `Infravalorada` tiene fondo blanco en lugar de verde translúcido. Solo pasa en dark mode. Screenshot adjunto."

---

## PASO 2 — Localizar el componente

Mapa rápido:

| Síntoma | Archivo a revisar |
|---------|------------------|
| Layout general roto | `src/components/Layout.tsx` |
| Header / nav / toggle | `src/components/Layout.tsx`, `src/components/ThemeToggle.tsx` |
| Badge de veredicto | `src/components/VerdictBadge.tsx` |
| Tabla de watchlist | `src/pages/WatchlistPage.tsx` |
| Cards de resumen (watchlist) | `src/pages/WatchlistPage.tsx` |
| Modal agregar ticker | `src/components/AddTickerModal.tsx` |
| Header de detalle (precios, badge) | `src/pages/TickerDetailPage.tsx` |
| Grid breakdown DCF | `src/pages/TickerDetailPage.tsx` |
| Tabla de escenarios | `src/pages/TickerDetailPage.tsx` |
| Input beta override | `src/pages/TickerDetailPage.tsx` |
| FCF estimates form | `src/components/FcfEstimatesForm.tsx` |
| Sensitivity heatmap | `src/components/SensitivityHeatmap.tsx` |
| Spinner / loading | `src/components/Spinner.tsx` |
| Error state | `src/components/ErrorMessage.tsx` |
| Tokens de color globales | `src/index.css` (variables CSS) |

---

## PASO 3 — Entender el sistema de estilos

Este proyecto usa **Tailwind v4 + tokens Shadcn**. No hay archivos `.css` por componente.

**Tokens principales en `src/index.css`:**
```css
/* Superficies */
--background    /* fondo de página */
--card          /* fondo de Card */
--border        /* bordes */

/* Texto */
--foreground         /* texto principal */
--muted-foreground   /* texto secundario */

/* Interacción */
--accent        /* hover bg */
--primary       /* color de acción principal */
--destructive   /* rojo para errores/eliminar */

/* Dominio DCF (no cambian entre temas) */
--verdict-under   #22c55e
--verdict-fair    #eab308
--verdict-over    #ef4444
```

**Dark mode:** la clase `.dark` en `<html>` activa los valores alternativos de cada token. Si algo se ve mal solo en dark, el problema suele ser un color hardcoded en lugar de un token semántico.

---

## PASO 4 — Patrones de fix comunes

**Color hardcodeado que no respeta dark mode:**
```tsx
// ❌ Mal
<span style={{ color: '#111827' }}>texto</span>

// ✅ Bien
<span className="text-foreground">texto</span>
```

**Fondo hardcodeado:**
```tsx
// ❌ Mal
<div style={{ background: '#ffffff' }}>

// ✅ Bien
<div className="bg-background">
```

**Colores de veredicto (estos SÍ son fijos, no cambian con el tema):**
```tsx
// ✅ Correcto — via CSS var
style={{ color: 'var(--verdict-under)' }}
```

**Clases condicionales:**
```tsx
import { cn } from '@/lib/utils'

<div className={cn('base-classes', condicion && 'clase-extra', otroBoolean ? 'a' : 'b')} />
```

---

## PASO 5 — Verificar el fix

1. `npx tsc --noEmit` — sin errores de tipos
2. `npm run lint` — sin warnings
3. Probar en **dark mode** y **light mode** (toggle en el header)
4. Probar en mobile (DevTools responsive, breakpoint `sm` = 640px)
5. Si el fix toca un componente compartido, verificar todas las páginas que lo usan
