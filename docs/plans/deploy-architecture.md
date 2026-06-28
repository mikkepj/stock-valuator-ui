# Propuesta de Arquitectura de Deploy — Stock Valuator

> Fecha: 2026-06-06
> Alcance: FE (`stock-valuator-ui`) + BE (`stock-valuator`)
> Contexto: proyecto personal, bajo tráfico, prioridad **costo $0** (al menos por ahora)

---

## 1. Análisis del stack actual

### Frontend — `stock-valuator-ui`

| Aspecto | Detalle |
|---------|---------|
| Tipo | **SPA estática** (sin SSR) |
| Build | `tsc -b && vite build` → carpeta `dist/` |
| Runtime en prod | Ninguno — solo sirve archivos estáticos (HTML/JS/CSS) |
| Stack | React 19, Vite 8, react-router-dom 7, Tailwind v4 |
| Config de backend | Proxy `/api` en dev; en prod usa `VITE_API_URL` (build-time) |

**Implicación de deploy:** es lo más fácil. Cualquier CDN/static host gratuito sirve. **No consume horas de cómputo ni se "duerme".** El único requisito es inyectar `VITE_API_URL` en build y configurar un rewrite SPA (todas las rutas → `index.html`) para que `react-router` funcione en refresh.

### Backend — `stock-valuator`

| Aspecto | Detalle |
|---------|---------|
| Tipo | **Proceso JVM siempre vivo** (Spring Boot 3.3.7, Java 21) |
| Build | Maven multi-módulo (3) → JAR ejecutable en `api-web` |
| Base de datos | **PostgreSQL 16 obligatorio** — Flyway gestiona el schema (9 migraciones V1–V9), `ddl-auto: validate` |
| Estado | Persistente: valuaciones, watchlist, FCF estimates, statements financieros |
| Dependencias externas | **FMP API** (Financial Modeling Prep) — requiere `FMP_API_KEY` |
| Cache | Caffeine en memoria (`maximumSize=500, expireAfterWrite=24h`) |
| Scheduler | Cron **semanal** — refresco de datos sábados 6:00 AM (`0 0 6 * * SAT`) |
| Resiliencia | Resilience4j (retries/timeouts a FMP) |
| CORS | Configurable por `stockvaluator.cors.allowed-origins` (env-overridable) |
| Memoria | JVM necesita **~200–300 MB de overhead** + heap. En 512 MB es ajustado pero viable para bajo tráfico |

**Secrets necesarios en prod:** `DB_USERNAME`, `DB_PASSWORD`, `DB_URL` (o `SPRING_DATASOURCE_*`), `FMP_API_KEY`, y `STOCKVALUATOR_CORS_ALLOWED-ORIGINS` con la URL real del FE.

**Puntos críticos para el deploy del BE:**

1. **Necesita Postgres persistente.** No sirve una DB que se borre. Ojo: la mayoría de DB gratuitas tienen políticas de expiración o pausa por inactividad.
2. **El cold start de la JVM es lento** (~30 s en hosts con poca CPU). En hosts que "duermen" tras 15 min de inactividad, la primera petición tras dormir tardará bastante.
3. **El scheduler semanal NO se ejecutará si el proceso está dormido** el sábado a las 6 AM. Si el host duerme por inactividad, el refresco automático se pierde (mitigable con un trigger externo o un host que no duerma).

---

## 2. Decisión de diseño base

Se recomienda **separar las tres piezas** (patrón estándar para este stack):

```
┌─────────────────┐      ┌──────────────────────┐      ┌────────────────────┐
│  FE estático    │ ───► │  BE Spring Boot      │ ───► │  PostgreSQL 16     │
│  (CDN gratis)   │ HTTPS│  (host de cómputo)   │ JDBC │  (DB gestionada)   │
└─────────────────┘      └──────────────────────┘      └────────────────────┘
                                   │
                                   ▼
                            FMP API (externa)
```

El FE casi siempre es gratis y sin fricción. **La decisión real está en dónde corre el BE + qué Postgres usar.** Las opciones de abajo se centran en eso.

---

## 3. Opciones de deploy del Frontend (todas $0)

| Opción | Costo | Setup | Limitaciones | Compatibilidad |
|--------|-------|-------|--------------|----------------|
| **Vercel** ⭐ | $0 (Hobby) | Muy bajo — detecta Vite solo, deploy on push | Uso personal/no comercial en Hobby; 100 GB/mes banda | Total. Rewrite SPA en `vercel.json`. Ya previsto en CLAUDE.md (Fase 4.5) |
| **Netlify** | $0 | Muy bajo | 100 GB/mes banda | Total. `_redirects` para SPA |
| **Cloudflare Pages** | $0 | Bajo | Builds/mes limitados, banda **ilimitada** | Total. Mejor CDN/banda del grupo |
| **GitHub Pages** | $0 | Medio (Actions para build) | Sin rewrites nativos cómodos para SPA; requiere truco 404 | Funciona pero es el más incómodo para router |

**Recomendación FE: Vercel** (alineado con el plan existente) o **Cloudflare Pages** si prefieres banda ilimitada. Ambos gratis de forma sostenible para este caso.

---

## 4. Opciones de deploy del Backend + Base de datos

> Aquí está el verdadero trade-off. Ordenadas de **menor a mayor esfuerzo de setup**.

### Opción A — Render (Web Service) + Neon (Postgres) ⭐ *Recomendada para arrancar rápido*

| | |
|---|---|
| **Costo** | **$0** |
| **Setup** | Bajo-medio. Render: conectar repo, build con `mvn package`, start con `java -jar`. Neon: crear proyecto, copiar connection string a env vars |
| **BE** | Render free: 512 MB RAM, 0.1 CPU, **se duerme tras 15 min** de inactividad (cold start ~1 min + arranque JVM) |
| **DB** | **Neon** en vez del Postgres de Render. Neon free no expira a los 30 días (el de Render **sí**), tiene scale-to-zero y reanuda en <500 ms. 0.5 GB storage — sobra para este dominio |
| **Limitaciones** | El sleep de Render hace lenta la 1ª petición tras inactividad. **El scheduler semanal se pierde si el servicio está dormido el sábado 6 AM** (mitigable: cron-ping externo tipo cron-job.org, o llamar al endpoint de refresco manualmente). 750 horas-instancia/mes (suficiente con sleep) |
| **Compatibilidad** | Total. Spring Boot + Postgres es el caso canónico. Solo cuidar memoria (perfil JVM `-XX:MaxRAMPercentage=75`) |

> ⚠️ **Clave:** usar **Neon** y NO el Postgres free de Render — este último **expira a los 30 días** (+14 de gracia) y luego borra los datos. Neon evita ese problema.

### Opción B — Railway (BE + Postgres en un solo lugar)

| | |
|---|---|
| **Costo** | $0 *teórico* con $5 de crédito/mes — pero el BE JVM **consume ese crédito rápido** (la JVM no escala a cero; corriendo 24/7 supera $5/mes) |
| **Setup** | **El más bajo.** Detecta el proyecto, provisiona Postgres con un click, env vars autoinyectadas |
| **BE** | 512 MB / 0.5 vCPU. No duerme → scheduler semanal **sí funciona** |
| **DB** | Postgres gestionado en la misma plataforma, persistente |
| **Limitaciones** | El crédito gratis **no alcanza para 24/7** de un proceso JVM. Sirve para demos cortas o si aceptas pagar ~$5–10/mes cuando crezca. No es "gratis sostenible 24/7" |
| **Compatibilidad** | Excelente DX. El mejor si en algún momento aceptas pagar poco |

### Opción C — Oracle Cloud Always Free (VM ARM) + Postgres en la misma VM

| | |
|---|---|
| **Costo** | **$0 real y sostenible** (Always Free, sin expiración) |
| **Setup** | **Alto.** Provisionar VM, instalar JDK 21, Postgres 16, systemd para el JAR, Nginx/Caddy como reverse proxy + TLS, firewall, security lists. Todo manual |
| **BE** | VM Ampere ARM: hasta **4 OCPU + 24 GB RAM** gratis. Sobradísimo. **No duerme** → scheduler semanal funciona perfecto |
| **DB** | Postgres 16 instalado en la misma VM (o Autonomous DB de Oracle). Persistente, sin límites de las DB serverless |
| **Limitaciones** | Capacidad ARM a veces "Out of Capacity" al crear. Mantenimiento del SO es tu responsabilidad (parches, backups, TLS). Requiere tarjeta para registrarse. Verificar que el JAR ARM corra (Java es multiplataforma, sin problema) |
| **Compatibilidad** | Total y con muchísimo margen de recursos. Es la opción "gratis de verdad para siempre" a cambio de operar tú la infra |

### Opción D — Koyeb (BE) + Neon (Postgres)

| | |
|---|---|
| **Costo** | $0 |
| **Setup** | Bajo (git-based). Similar a Render |
| **BE** | 1 web service, 512 MB / 0.1 vCPU |
| **Limitaciones** | RAM ajustada para JVM bajo carga. (Nota: Koyeb fue adquirido por Mistral AI en feb-2026 — su free tier podría cambiar de enfoque). Banda 1 GB |
| **Compatibilidad** | Buena, equivalente a Render. Menos probado para este caso |

---

## 5. Comparativa resumida del Backend

| Opción | Costo real 24/7 | Setup | Scheduler semanal | DB persistente | Riesgo principal |
|--------|-----------------|-------|-------------------|----------------|------------------|
| **A. Render + Neon** ⭐ | $0 | Bajo-medio | ⚠️ falla si duerme | ✅ (Neon) | Cold start + scheduler |
| **B. Railway** | ~$5–10/mes | **Muy bajo** | ✅ | ✅ | No es gratis 24/7 |
| **C. Oracle Always Free** | **$0** | **Alto** | ✅ | ✅ | Operación manual / capacidad ARM |
| **D. Koyeb + Neon** | $0 | Bajo | ⚠️ si duerme | ✅ (Neon) | RAM, futuro incierto |

---

## 6. Recomendación final

### Para arrancar YA con mínimo esfuerzo y $0 → **Opción A**

```
FE  → Vercel (o Cloudflare Pages)
BE  → Render (Web Service free)
DB  → Neon (Postgres serverless free)
```

**Por qué:**
- Es 100 % gratis y sostenible (Neon no expira como el Postgres de Render).
- Setup en una tarde, sin administrar servidores.
- Cubre de sobra "proyecto personal, bajo tráfico".

**Mitigaciones a aplicar:**
1. **Scheduler semanal:** como Render duerme, configurar un **cron-ping externo gratuito** (p. ej. cron-job.org) que golpee un endpoint el sábado ~5:55 AM para despertar el servicio antes del refresco; o exponer un endpoint manual de refresco y dispararlo tú.
2. **Memoria JVM:** añadir `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75 -XX:+UseSerialGC` para vivir cómodo en 512 MB.
3. **Cold start:** asumible para uso personal (la 1ª petición tras dormir tarda ~1–1.5 min). Si molesta, un ping cada 14 min lo mantiene despierto (consume horas-instancia, vigilar el límite de 750 h/mes).
4. **CORS:** setear `STOCKVALUATOR_CORS_ALLOWED-ORIGINS=https://<tu-fe>.vercel.app`.
5. **FE:** setear `VITE_API_URL=https://<tu-be>.onrender.com/api/v1` en las env vars de build de Vercel.

### Si quieres $0 de verdad para siempre, sin sleep y con el scheduler garantizado → **Opción C (Oracle Always Free)**

A cambio de operar tú la VM (JDK, Postgres, Nginx+TLS, backups). Recursos enormes (24 GB RAM). Ideal como **paso 2** cuando el proyecto madure y el sleep/cold-start de Render moleste.

### Si en el futuro aceptas pagar ~$5–10/mes por la mejor DX → **Opción B (Railway)**

Todo en un lugar, scheduler garantizado, cero ops. La transición desde A es trivial.

---

## 7. Pasos siguientes sugeridos (para Opción A)

1. **Preparar el BE para cloud:**
   - Verificar que `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` se leen de env (hoy usa `DB_USERNAME/DB_PASSWORD` con defaults locales — añadir override de `url` por env).
   - Externalizar `stockvaluator.cors.allowed-origins` por env var (ya soportado vía YAML, confirmar binding).
   - Opcional: añadir un `Dockerfile` (hoy no existe) o usar el buildpack nativo de Render para Maven.
2. **Crear DB en Neon**, copiar el connection string (incluye `?sslmode=require`).
3. **Desplegar BE en Render** con build `./mvnw -pl api-web -am clean package -DskipTests` y start `java -jar api-web/target/*.jar`.
4. **Configurar cron-ping externo** para el scheduler semanal.
5. **Desplegar FE en Vercel** con `VITE_API_URL` y rewrite SPA.
6. **Smoke test end-to-end** con AAPL.

---

## Fuentes

- [Platforms with a real free tier for developers in 2026 — Render](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026)
- [Free PostgreSQL instances now expire after 30 days (Render Changelog)](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90)
- [Deploy for Free — Render Docs](https://render.com/docs/free)
- [Free Hosting for Spring Boot 2026 — BSWEN](https://docs.bswen.com/blog/2026-02-28-springboot-free-hosting/)
- [Neon vs Supabase Free Tier — 2026](https://agentdeals.dev/neon-vs-supabase)
- [Railway vs Render 2026 — The Software Scout](https://thesoftwarescout.com/railway-vs-render-2026-best-platform-for-deploying-apps/)
- [Oracle Cloud Free Tier 2026 — cloudpricecheck](https://cloudpricecheck.com/free-tier/oracle)
- [Deploy a Spring Boot App — Koyeb Docs](https://www.koyeb.com/docs/deploy/spring-boot)
