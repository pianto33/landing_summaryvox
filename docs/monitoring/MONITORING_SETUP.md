# 📊 Guía de Configuración de Monitoreo

Esta guía te ayudará a configurar un sistema completo de monitoreo **100% GRATUITO** para tu aplicación Next.js en Vercel.

## 🎯 Sistema de Alertas Implementado

### ✅ Características
- ⚡ Monitoreo de memoria y CPU en tiempo real
- 🐌 Detección de respuestas lentas (> 5 segundos)
- 🔴 Alertas de errores del servidor (5xx)
- 📊 Health checks periódicos
- 📈 Reportes diarios automáticos
- 🔍 Métricas exportables para dashboards

### 📍 Endpoints Creados

1. **`/api/health`** - Health check del sistema
   - Retorna estado del sistema
   - Métricas de memoria y CPU
   - Uptime del servidor

2. **`/api/metrics`** - Exportación de métricas
   - Formato JSON o Prometheus
   - Compatible con Grafana/Better Stack

3. **`/api/cron/health-check`** - Cron job (cada 15 minutos)
   - Verifica estado del sistema
   - Alerta si hay problemas

4. **`/api/cron/daily-report`** - Reporte diario (9am UTC)
   - Envía resumen diario a Slack

---

## 🔧 Configuración Paso a Paso

### 1️⃣ Variables de Entorno

Agrega estas variables en Vercel (Settings > Environment Variables):

```bash
# Slack Webhooks (ya los tienes)
SLACK_WEBHOOK_SUCCESS=your_webhook_url
SLACK_WEBHOOK_RED_ALERT=your_webhook_url
SLACK_WEBHOOK_LOGS=your_webhook_url
SLACK_WEBHOOK_MONITORING=your_webhook_url_monitoring

# Nuevo: Secret para Cron Jobs (genera uno seguro)
CRON_SECRET=tu_token_super_secreto_aleatorio

# Opcional: Token para endpoint de métricas
METRICS_AUTH_TOKEN=otro_token_secreto

# Opcional: Log todas las requests (solo en desarrollo)
LOG_ALL_REQUESTS=false
```

### 2️⃣ Vercel Cron Jobs (GRATIS en Plan Pro)

Los cron jobs ya están configurados en `vercel.json`:

- **Health Check**: Cada 15 minutos
- **Reporte Diario**: Todos los días a las 9am UTC

#### Para desplegarlos:
```bash
# 1. Commitea vercel.json
git add vercel.json
git commit -m "Add cron jobs for monitoring"
git push

# 2. Vercel detectará automáticamente los cron jobs
# 3. Verifica en: Vercel Dashboard > Settings > Cron Jobs
```

### 3️⃣ Uso del Middleware de Monitoreo

Para monitorear automáticamente tus APIs, envuelve tus handlers:

```typescript
// Ejemplo: src/pages/api/tu-endpoint.ts
import { withMonitoring } from '@/middleware/apiMonitoring';

async function handler(req, res) {
  // Tu lógica aquí
  res.json({ success: true });
}

// ✅ Exporta con monitoreo
export default withMonitoring(handler);
```

Esto automáticamente:
- ⏱️ Mide tiempo de respuesta
- 💾 Mide uso de memoria
- 🚨 Alerta si es lento (> 5s)
- 🔴 Alerta si hay error (5xx)

---

## 📊 Herramientas de Dashboard (GRATUITAS)

### Opción 1: Better Stack (Recomendado ⭐)

**Plan Gratuito:** 1GB logs/mes, 3 usuarios, retención 7 días

#### Setup:
1. Ve a [betterstack.com](https://betterstack.com) y crea cuenta
2. Crea un nuevo "Log Source"
3. Copia el Source Token
4. Agrega en Vercel:
   ```bash
   BETTERSTACK_SOURCE_TOKEN=tu_token
   ```

5. Actualiza `slackService.ts` para enviar también a Better Stack:
   ```typescript
   // En sendSlackNotification, agrega:
   if (process.env.BETTERSTACK_SOURCE_TOKEN) {
     await fetch('https://in.logs.betterstack.com', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${process.env.BETTERSTACK_SOURCE_TOKEN}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         message,
         metadata,
         level: channel === 'red-alert' ? 'error' : 'info',
       }),
     });
   }
   ```

#### Ventajas:
- ✅ Dashboards hermosos y automáticos
- ✅ Búsqueda y filtros potentes
- ✅ Alertas configurables
- ✅ Integración directa con Slack

---

### Opción 2: Grafana Cloud

**Plan Gratuito:** 10K series, 50GB logs, 14 días retención

#### Setup:
1. Crea cuenta en [grafana.com](https://grafana.com)
2. Ve a "Connections" > "Add new connection" > "Prometheus"
3. Configura tu endpoint de métricas:
   ```
   URL: https://tu-app.vercel.app/api/metrics?format=prometheus
   Auth: Bearer tu_METRICS_AUTH_TOKEN
   ```

4. Importa dashboards pre-hechos:
   - Node.js Dashboard: ID 11159
   - API Monitoring: ID 3662

#### Ventajas:
- ✅ Dashboards profesionales
- ✅ Alertas avanzadas
- ✅ Múltiples fuentes de datos
- ✅ Muy usado en la industria

---

### Opción 3: BetterUptime (Para Uptime Monitoring)

**Plan Gratuito:** 10 monitores, 3 minutos check interval

#### Setup:
1. Ve a [betteruptime.com](https://betteruptime.com)
2. Crea un nuevo "Monitor"
3. Configura:
   ```
   URL: https://tu-app.vercel.app/api/health
   Method: GET
   Expected Status: 200
   Check Interval: 3 minutos
   ```

4. Agrega integración con Slack para alertas

#### Ventajas:
- ✅ Status page pública (gratis)
- ✅ Monitoreo de uptime
- ✅ Alertas por múltiples canales
- ✅ Muy fácil de configurar

---

### Opción 4: Vercel Analytics (YA INCLUIDO en tu Plan Pro)

#### Setup:
1. Ve a Vercel Dashboard > Analytics
2. Actívalo si no lo está
3. Agrega Web Vitals a tu app:

```typescript
// pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

4. Instala el paquete:
```bash
npm install @vercel/analytics
```

#### Ventajas:
- ✅ Ya está pagado en tu plan
- ✅ Web Vitals automáticos
- ✅ Análisis de performance
- ✅ Integrado con Vercel

---

## 🚀 Mi Recomendación de Setup Completo

### Para Empezar (Gratis Total):
1. ✅ **Vercel Cron Jobs** - Ya configurado
2. ✅ **Slack Alerts** - Ya configurado
3. ✅ **Vercel Analytics** - Actívalo (ya lo pagas)
4. ✅ **BetterUptime** - Para uptime monitoring

### Si Quieres Dashboards Potentes:
5. ✅ **Better Stack** - Para logs y dashboards hermosos
   
### Si Eres más Técnico:
6. ✅ **Grafana Cloud** - Para métricas y dashboards personalizados

---

## 📱 Tipos de Alertas que Recibirás en Slack

### 🟢 Canal: `#logs`
- Actividad normal del sistema
- Reportes diarios
- Logs de eventos importantes

### 🟡 Canal: `#success`
- Pagos exitosos
- Eventos positivos

### 🔴 Canal: `#red-alert`
- Errores del sistema
- Alto uso de memoria (> 80%)
- Respuestas lentas (> 5s)
- Errores de servidor (5xx)
- Fallos en health checks

---

## 🧪 Testing del Sistema

### 1. Probar Health Check:
```bash
curl https://tu-app.vercel.app/api/health
```

### 2. Probar Métricas:
```bash
curl -H "Authorization: Bearer tu_METRICS_AUTH_TOKEN" \
  https://tu-app.vercel.app/api/metrics
```

### 3. Probar Formato Prometheus:
```bash
curl -H "Authorization: Bearer tu_METRICS_AUTH_TOKEN" \
  "https://tu-app.vercel.app/api/metrics?format=prometheus"
```

### 4. Simular Cron Job:
```bash
curl -X POST \
  -H "Authorization: Bearer tu_CRON_SECRET" \
  https://tu-app.vercel.app/api/cron/health-check
```

---

## 📊 Ejemplo de Dashboard en Grafana

Crea un dashboard con estos paneles:

1. **Memory Usage** - Gauge
   ```promql
   nodejs_memory_percentage
   ```

2. **Memory Over Time** - Graph
   ```promql
   nodejs_memory_used_mb
   ```

3. **API Response Times** - Heatmap
   (Requiere logs de Better Stack)

4. **Error Rate** - Graph
   (Filtrar logs de nivel error)

---

## 🔄 Siguiente Paso: Aplicar el Middleware

Para que el monitoreo funcione en tus APIs existentes, actualiza tus handlers:

```typescript
// Antes:
export default async function handler(req, res) { ... }

// Después:
import { withMonitoring } from '@/middleware/apiMonitoring';

async function handler(req, res) { ... }
export default withMonitoring(handler);
```

---

## ❓ FAQ

**Q: ¿Cuánto cuesta todo esto?**
A: $0 USD. Todo es gratuito excepto Vercel Pro que ya pagas.

**Q: ¿Los cron jobs consumen mis límites de Vercel?**
A: Sí, pero mínimamente. Los health checks son muy ligeros.

**Q: ¿Puedo desactivar alertas en desarrollo?**
A: Sí, los servicios ya verifican `process.env.NODE_ENV`.

**Q: ¿Cómo evito spam de alertas?**
A: Ajusta los umbrales en `monitoringService.ts` (ej: cambiar 80% a 90%).

**Q: ¿Funciona con serverless?**
A: Sí, está diseñado específicamente para Vercel/serverless.

---

## 🎓 Recursos Adicionales

- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs)
- [Better Stack Docs](https://betterstack.com/docs)
- [Grafana Cloud Docs](https://grafana.com/docs)
- [Prometheus Format](https://prometheus.io/docs/instrumenting/exposition_formats/)

---

¿Necesitas ayuda? Revisa los logs en Slack canal `#logs` o contacta al equipo de desarrollo.

