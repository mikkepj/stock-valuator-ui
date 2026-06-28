Analiza completamente este proyecto. Lee todos los archivos relevantes:
CLAUDE.md existente, package.json, todos los componentes en src/, 
.claude/settings.local.json, y cualquier plan en la raíz.

Con ese contexto completo haz lo siguiente:

1. Reescribe CLAUDE.md con estas secciones reales del proyecto:
   - ARQUITECTURA (estructura de componentes real, flujo de datos)
   - STACK TÉCNICO (Vite, React, TypeScript — versiones exactas y configuración)
   - COMPONENTES EXISTENTES (qué hace cada uno, sus props, sus dependencias)
   - ESTÁNDARES DE CÓDIGO (patrones que ya usamos en este proyecto)
		--> Herramientas obligatorias: Context7: SIEMPRE usar antes de implementar con cualquier librería del stack.
			- Patrón: resolve library ID → get docs → implementar.
			- Nunca asumir APIs de memoria, especialmente: Spring Boot 3.x, 
			- Vite config, React hooks, JPA/Hibernate 6.x.
   - INTEGRACIÓN CON BE (cómo funciona api/client.ts, endpoints consumidos)
   - WORKFLOW DE DESARROLLO (cómo agregar componente, cómo hacer fix de UI)
   - ESTADO ACTUAL Y PENDIENTE (qué fases están completas, qué falta)

2. Crea .claude/commands/new-component.md con workflow para agregar 
   componentes React+TypeScript consistentes con los que ya existen.
	--> PASO 0 (antes de escribir código): Usa Context7 para verificar la API actual de cualquier librería que vayas a usar en esta feature. No asumas nada de memoria.

3. Crea .claude/commands/fix-ui.md con workflow para bugs visuales 
   (incluye cómo describir el problema con screenshots).

4. Crea .claude/agents/react-reviewer.md como sub-agente especializado 
   en React+TypeScript+Vite para este proyecto.

5. Actualiza .claude/settings.local.json con hooks para:
   - PostToolUse: npm run lint después de editar archivos .tsx/.ts
   - Stop: notificación de tarea completada

No inventes nada. Todo basado en el código real existente.