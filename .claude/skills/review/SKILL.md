---
name: review
description: "Workflow: Revisión de código React antes de merge — invoca al agente react-reviewer"
argument-hint: "[archivo o directorio a revisar] [--staged | --branch <rama>]"
---

# Workflow: Review de código React antes de merge

---

## PASO 0 - Workflow: Revisión de código React

Determinar qué revisar, invocar al agente `react-reviewer` con el diff correcto y reportar los hallazgos.

---

## PASO 1 — Determinar el alcance

Según el contexto del pedido:

| Situación | Qué revisar |
|-----------|-------------|
| "revisá los cambios antes de mergear" | diff de la rama actual contra `develop` |
| "revisá este archivo" | archivo específico indicado |
| "revisá lo que acabo de editar" | archivos con cambios staged (`git diff --cached`) |
| "revisá el PR" | diff completo de la feature branch contra `develop` |

Si el alcance no está claro, preguntar antes de continuar.

---

## PASO 2 — Obtener el diff

Ejecutar el comando correspondiente según el alcance:

**Cambios staged (pre-commit):**
```bash
git diff --cached
```

**Rama completa contra develop:**
```bash
git diff develop...HEAD
```

**Archivo específico:**
```bash
git diff develop...HEAD -- <archivo>
```

**Cambios sin stagear:**
```bash
git diff
```

Si el diff está vacío → informar al usuario y no invocar al agente.

---

## PASO 3 — Filtrar archivos relevantes

El agente `react-reviewer` solo debe recibir archivos del proyecto frontend. Excluir del diff:

- `*.md` — documentación
- `plan-*.md`, `CLAUDE.md` — archivos de proyecto
- `.claude/**` — configuración de Claude Code
- `public/**` — assets estáticos sin lógica
- `*.json` (excepto cambios en `package.json` o `components.json` que sí son relevantes)

Si tras filtrar no queda nada que revisar → informar al usuario.

---

## PASO 4 — Invocar al agente react-reviewer

Invocar al subagente **`react-reviewer`** pasándole:

1. El diff filtrado completo
2. El contexto del alcance (qué rama, qué archivos, si es pre-commit o pre-merge)

El agente aplicará su checklist sobre:
- TypeScript (`any`, interfaces, tipos de API)
- Arquitectura (HTTP fuera de `client.ts`, imports con `../`, rutas relativas)
- Estilos (colores hardcodeados, dark mode, `cn()`, ediciones a `src/components/ui/`)
- Componentes Shadcn (`asChild` en `@base-ui/react`, imports correctos)
- React (dependencias de `useEffect`, cleanup, estados de error/loading)
- Performance (`useCallback`, renders innecesarios)

---

## PASO 5 — Reportar hallazgos

Presentar los hallazgos del agente agrupados por nivel:

### Si hay BLOCKERs
Listarlos primero con énfasis. No continuar con el merge hasta resolverlos.

### Si hay WARNs
Listarlos con sugerencia de fix. Recomendar resolverlos antes de mergear.

### Si hay NITs
Listarlos al final, marcados como opcionales.

### Si el agente responde "LGTM"
Confirmar que el código está listo para merge.

---

## Cuándo NO invocar al agente

- El diff solo contiene archivos excluidos (docs, assets, config de Claude)
- No hay cambios en la rama (diff vacío)
- El usuario pide una revisión de arquitectura de alto nivel → hacer inline sin subagente
