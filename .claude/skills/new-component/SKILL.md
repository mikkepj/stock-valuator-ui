---
name: new-component
description: "Workflow: Agregar un nuevo componente React"
argument-hint: "[NombreComponente] [tipo: shadcn|dominio|pagina]"
---

# Workflow: Agregar un nuevo componente React

Seguir estos pasos en orden. No saltear el Paso 0.

---

## PASO 0 — Crear rama y plan de la feature

- Crear una nueva rama a partir de `develop` con el formato: 
`feature/<nombre-feature>` (ej: `feature/valuation-card`)

- Antes de cualquier otra cosa, crear el archivo:
`docs/plans/plan-<nombre-feature>.md` con la siguiente estructura:

### Objetivo
[Qué resuelve esta feature y por qué]

### Módulo destino
[api / components / otro]

### Archivos a crear o modificar
- [ ] archivo1.* — qué cambia
- [ ] archivo2.* — qué cambia

### Orden de implementación
1. ...
2. ...

### Criterios de aceptación (como tests)
- Given / When / Then por cada caso

### Riesgos identificados
- ...

**Esperar aprobación explícita antes de continuar al PASO 1.**

---

## PASO 1 — Context7 (obligatorio antes de escribir código)

Antes de tocar un solo archivo, usar Context7 para verificar la API actual de cada librería involucrada.

```
mcp__context7__resolve-library-id  →  nombre de la librería (ej: "shadcn/ui", "lucide-react", "recharts")
mcp__context7__query-docs          →  consulta específica (ej: "Card component props and usage")
```

No asumir nada de memoria. Las APIs de Shadcn, @base-ui/react, react-router-dom v7, Tailwind v4 y recharts v3 cambian frecuentemente.

---

## PASO 2 — Determinar el tipo de componente

**¿Es un componente Shadcn?**
- Instalar con CLI: `npx shadcn@latest add <nombre>`
- El archivo queda en `src/components/ui/<nombre>.tsx` — NO editar
- Verificar en `components.json` que el alias sea `@/components/ui`

**¿Es un componente de dominio reutilizable?**
- Crear en `src/components/NombreComponente.tsx`
- Puede usar componentes de `src/components/ui/`

**¿Es específico de una página?**
- Evaluar si realmente necesita su propio archivo o puede ir inline en la página

---

## PASO 3 — Estructura del archivo

```tsx
// Imports de librerías externas primero
import { useState } from 'react'
import { AlgunIcono } from 'lucide-react'

// Imports internos con alias @/
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AlgunTipo } from '@/types/api'

// Interface de props explícita — nunca inline sin nombre
interface Props {
  valor: string
  opcional?: number
  callback: (result: string) => void
}

// Named export — nunca default export
export function NombreComponente({ valor, opcional, callback }: Props) {
  // ...
}
```

---

## PASO 4 — Reglas de estilo

- **Clases Tailwind** para todo el layout y espaciado — no CSS externo
- **Tokens semánticos** de Shadcn: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`
- **Colores de veredicto DCF** (CSS vars): `var(--verdict-under)`, `var(--verdict-fair)`, `var(--verdict-over)`
- `cn()` de `@/lib/utils` para combinar clases condicionalmente
- Dark mode automático via `.dark` class — no agregar lógica manual de tema en componentes

---

## PASO 5 — Tipado

- Todas las props tipadas con interface nombrada
- Datos de la API: usar tipos de `@/types/api.ts` — nunca `any`
- Si el componente recibe un callback que actualiza estado del padre, el tipo del argumento debe coincidir exactamente con el tipo del estado

---

## PASO 6 — Verificación

```bash
npx tsc --noEmit          # sin errores de tipos
npm run lint              # sin warnings de ESLint
```

Probar en dark mode y light mode usando el toggle del header.

---

## Ejemplo mínimo

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ValuationResponse } from '@/types/api'

interface Props {
  data: ValuationResponse
}

export function ValuationCard({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {data.ticker}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <span className="text-lg font-semibold text-foreground">{data.companyName}</span>
      </CardContent>
    </Card>
  )
}
```
