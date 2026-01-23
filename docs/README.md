# 📊 Sistema de Monitoreo y Alertas

Sistema completo de monitoreo, métricas y alertas para tu aplicación Next.js desplegada en Vercel.

## 🎯 ¿Qué incluye este sistema?

### ✅ Sistema de Alertas en Tiempo Real
- 🔴 **Alertas Críticas**: Errores del servidor, alto uso de memoria, respuestas lentas
- 🟡 **Advertencias**: Problemas menores que requieren atención
- 🟢 **Éxitos**: Pagos completados, operaciones importantes
- 📝 **Logs**: Actividad general del sistema

### ✅ Monitoreo Automático
- 💾 **Memoria y CPU**: Monitoreo continuo de recursos del servidor
- ⏱️ **Tiempos de Respuesta**: Detección automática de APIs lentas (> 5s)
- 🔍 **Health Checks**: Verificaciones periódicas cada 15 minutos
- 📊 **Reportes Diarios**: Resumen automático del estado del sistema

### ✅ Métricas Exportables
- 📈 **Formato JSON**: Para integraciones personalizadas
- 🎯 **Formato Prometheus**: Compatible con Grafana
- 🔌 **Webhooks**: Integración con Better Stack, Grafana Cloud, etc.

### ✅ Cron Jobs (Gratis en Vercel Pro)
- Health check cada 15 minutos
- Reporte diario a las 9am UTC
- Triggers personalizables

---

## 🚀 Empezar Ahora

### Para Empezar Rápido (10 minutos):
👉 **[QUICK_START.md](./QUICK_START.md)** - Configuración básica en 5 pasos

### Para Setup Completo con Dashboards (30 minutos):
👉 **[MONITORING_SETUP.md](./MONITORING_SETUP.md)** - Guía detallada completa

### Para Integraciones con Herramientas Externas:
👉 **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** - Ejemplos de Better Stack, Grafana, BetterUptime

---

## 📁 Archivos Creados

### Servicios
- `src/services/monitoringService.ts` - Core del sistema de monitoreo
- `src/services/betterStackService.ts` - Integración con Better Stack
- `src/services/grafanaService.ts` - Integración con Grafana Cloud
- `src/services/slackService.ts` - **Actualizado** con integración a Better Stack

### Middleware
- `src/middleware/apiMonitoring.ts` - Middleware para monitorear APIs automáticamente

### Endpoints API
- `src/pages/api/health.ts` - Health check del sistema
- `src/pages/api/metrics.ts` - Exportación de métricas (JSON/Prometheus)
- `src/pages/api/cron/health-check.ts` - Cron job de health check
- `src/pages/api/cron/daily-report.ts` - Cron job de reporte diario

### Configuración
- `vercel.json` - Configuración de cron jobs
- `test-monitoring.sh` - Script de testing del sistema

### Documentación
- `docs/README.md` - Este archivo
- `docs/QUICK_START.md` - Guía rápida
- `docs/MONITORING_SETUP.md` - Guía completa
- `docs/INTEGRATION_EXAMPLES.md` - Ejemplos de integración

---

## 🎨 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Tu Aplicación Next.js                     │
│                   (Desplegada en Vercel)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Genera métricas
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Monitoring Service (Core)                       │
│  - Captura métricas (memoria, CPU, tiempos)                 │
│  - Detecta anomalías (lento, errores, alta memoria)         │
│  - Formatea datos para exportación                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  Slack Service   │  │  Better Stack    │
         │  - Alertas       │  │  - Logs          │
         │  - Notificaciones│  │  - Dashboards    │
         └──────────────────┘  └──────────────────┘
                    │
                    ▼
         ┌──────────────────────────────────────┐
         │         Canales de Slack              │
         │  #red-alert  #success  #logs          │
         └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Vercel Cron Jobs                          │
│  - health-check (cada 15 min)                               │
│  - daily-report (diario 9am UTC)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Consulta
                              ▼
         ┌──────────────────────────────────────┐
         │      API Endpoints Públicos          │
         │  /api/health                         │
         │  /api/metrics (JSON/Prometheus)      │
         └──────────────────────────────────────┘
                              │
                              │ Consumen
                              ▼
         ┌──────────────────────────────────────┐
         │   Herramientas Externas              │
         │  - Grafana Cloud (dashboards)        │
         │  - BetterUptime (uptime)             │
         │  - Otros monitores externos          │
         └──────────────────────────────────────┘
```

---

## 💰 Costos (Todo Gratis excepto lo que ya pagas)

| Herramienta | Plan | Costo | Incluido |
|-------------|------|-------|----------|
| **Vercel Pro** | Pro | **$20/mes** | ✅ Ya lo pagas |
| Vercel Cron Jobs | - | $0 | ✅ Incluido en Pro |
| Vercel Analytics | - | $0 | ✅ Incluido en Pro |
| Slack | Free | $0 | ✅ Webhooks gratis |
| Better Stack | Free | $0 | 1GB/mes, 3 usuarios |
| Grafana Cloud | Free | $0 | 10K series, 50GB logs |
| BetterUptime | Free | $0 | 10 monitores |
| **TOTAL** | - | **$0 extra** | Todo gratis |

---

## 📊 Tipos de Alertas que Recibirás

### 🔴 Canal: #red-alert (Crítico)
- Error del servidor (status 5xx)
- Errores graves de aplicación
- Fallos críticos del sistema

**Acción requerida:** Inmediata

### 📊 Canal: #monitoring (Importante)
- Alto uso de memoria (> 80%)
- Respuesta lenta (> 5 segundos)
- Health check falló
- Reportes diarios del sistema

**Acción requerida:** Revisar pronto

### 🟢 Canal: #success (Positivo)
- Pago exitoso completado
- Eventos importantes del negocio
- Operaciones críticas exitosas

**Acción requerida:** Ninguna (informativo)

### 📝 Canal: #logs (Informativo)
- Logs generales de la aplicación
- Reportes diarios del sistema
- Health checks exitosos
- Actividad normal

**Acción requerida:** Ninguna (monitoreo)

---

## 🧪 Testing del Sistema

### Opción 1: Script Automatizado (Recomendado)

```bash
# Hacer el script ejecutable
chmod +x test-monitoring.sh

# Ejecutar
./test-monitoring.sh https://tu-app.vercel.app
```

### Opción 2: Manual

```bash
# 1. Health Check
curl https://tu-app.vercel.app/api/health

# 2. Métricas JSON
curl -H "Authorization: Bearer TU_TOKEN" \
  https://tu-app.vercel.app/api/metrics

# 3. Métricas Prometheus
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://tu-app.vercel.app/api/metrics?format=prometheus"

# 4. Trigger Cron Health Check
curl -X POST \
  -H "Authorization: Bearer TU_CRON_SECRET" \
  https://tu-app.vercel.app/api/cron/health-check

# 5. Trigger Reporte Diario
curl -X POST \
  -H "Authorization: Bearer TU_CRON_SECRET" \
  https://tu-app.vercel.app/api/cron/daily-report
```

---

## 🔧 Configuración Requerida

### Variables de Entorno en Vercel

```bash
# Slack (ya configurados)
SLACK_WEBHOOK_SUCCESS=https://hooks.slack.com/services/...
SLACK_WEBHOOK_RED_ALERT=https://hooks.slack.com/services/...
SLACK_WEBHOOK_LOGS=https://hooks.slack.com/services/...
SLACK_WEBHOOK_MONITORING=https://hooks.slack.com/services/...

# Nuevas (requeridas)
CRON_SECRET=token_aleatorio_super_secreto_123
METRICS_AUTH_TOKEN=otro_token_secreto_456

# Opcionales (para dashboards)
BETTERSTACK_SOURCE_TOKEN=tu_token_de_betterstack
GRAFANA_PROMETHEUS_URL=https://prometheus-prod-XX.grafana.net/api/prom/push
GRAFANA_PROMETHEUS_USER=123456
GRAFANA_PROMETHEUS_PASSWORD=tu_password

# Opcional (para debugging)
LOG_ALL_REQUESTS=false
```

### Generar Tokens Seguros

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📱 Aplicaciones Móviles

Para recibir alertas en tu teléfono:

- **Slack** - [iOS](https://apps.apple.com/app/slack/id618783545) / [Android](https://play.google.com/store/apps/details?id=com.Slack)
- **Better Stack** - [iOS](https://apps.apple.com/app/logtail/id1564453538) / [Android](https://play.google.com/store/apps/details?id=com.logtail)
- **Grafana** - [iOS](https://apps.apple.com/app/grafana/id1463944812) / [Android](https://play.google.com/store/apps/details?id=com.grafana.mobile.android)
- **BetterUptime** - [iOS](https://apps.apple.com/app/better-uptime/id1525186096) / [Android](https://play.google.com/store/apps/details?id=com.betteruptime)

---

## 🎯 Uso del Middleware de Monitoreo

Para monitorear automáticamente tus APIs, simplemente envuelve el handler:

### Antes:
```typescript
export default async function handler(req, res) {
  // tu código
}
```

### Después:
```typescript
import { withMonitoring } from '@/middleware/apiMonitoring';

async function handler(req, res) {
  // tu código (sin cambios)
}

export default withMonitoring(handler);
```

El middleware automáticamente:
- ⏱️ Mide tiempo de respuesta
- 💾 Mide uso de memoria
- 🚨 Alerta si es lento (> 5s)
- 🔴 Alerta si hay error (5xx)
- 📊 Exporta métricas

---

## 📈 Roadmap y Mejoras Futuras

### En Progreso
- [x] Sistema de alertas básico
- [x] Monitoreo de memoria y CPU
- [x] Health checks automáticos
- [x] Cron jobs configurados
- [x] Integración con Better Stack
- [x] Integración con Grafana
- [x] Documentación completa

### Próximamente
- [ ] Dashboard personalizado en React
- [ ] Alertas por email
- [ ] Alertas por SMS (Twilio)
- [ ] Métricas de negocio (conversiones, ventas)
- [ ] A/B Testing tracking
- [ ] User analytics
- [ ] Error tracking avanzado (Sentry-like)

---

## ❓ FAQ

**Q: ¿Funciona en Vercel Hobby (gratis)?**
A: Parcialmente. Las alertas y monitoreo sí, pero los Cron Jobs requieren Vercel Pro.

**Q: ¿Puedo usar otro servicio en vez de Slack?**
A: Sí, puedes adaptar `slackService.ts` para usar Discord, Teams, email, etc.

**Q: ¿Afecta el rendimiento de mi app?**
A: Mínimamente. El monitoreo es asíncrono y no bloquea las respuestas.

**Q: ¿Puedo desactivar alertas en desarrollo?**
A: Sí, el sistema ya verifica `NODE_ENV` y solo envía alertas en producción.

**Q: ¿Cómo evito spam de alertas?**
A: Ajusta los umbrales en `monitoringService.ts` (ej: 80% → 90% para memoria).

**Q: ¿Funciona con Serverless?**
A: Sí, está diseñado específicamente para arquitecturas serverless como Vercel.

**Q: ¿Necesito saber Prometheus o Grafana?**
A: No. Better Stack es más fácil. Usa Grafana solo si quieres dashboards avanzados.

**Q: ¿Puedo ver métricas históricas?**
A: Sí, en Better Stack (7 días gratis) o Grafana Cloud (14 días gratis).

---

## 🆘 Soporte y Troubleshooting

### No recibo alertas en Slack
1. Verifica las variables `SLACK_WEBHOOK_*` en Vercel
2. Asegúrate de estar en ambiente `production`
3. Revisa logs en Vercel Dashboard > Deployments > Logs

### Los Cron Jobs no se ejecutan
1. Verifica que `vercel.json` esté en la raíz
2. Chequea Vercel Dashboard > Settings > Cron Jobs
3. Espera al menos 15 minutos para la primera ejecución
4. Revisa logs de función en Vercel

### Errores 401 en /api/metrics
1. Verifica que configuraste `METRICS_AUTH_TOKEN`
2. Usa el header: `Authorization: Bearer TU_TOKEN`
3. El token debe coincidir exactamente

### Better Stack no recibe logs
1. Verifica `BETTERSTACK_SOURCE_TOKEN` en Vercel
2. Redespliega la app después de agregar la variable
3. Revisa la consola del navegador/servidor para errores

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Analytics](https://vercel.com/analytics)
- [Better Stack Docs](https://betterstack.com/docs)
- [Grafana Cloud Docs](https://grafana.com/docs/grafana-cloud/)
- [Prometheus Format](https://prometheus.io/docs/instrumenting/exposition_formats/)

### Tutoriales Recomendados
- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder)
- [Grafana Dashboard Gallery](https://grafana.com/grafana/dashboards/)
- [Better Stack University](https://betterstack.com/community)

---

## 🤝 Contribuciones

¿Mejoras o sugerencias? 

1. Actualiza el código
2. Actualiza la documentación
3. Prueba con `./test-monitoring.sh`
4. Crea un PR con descripción clara

---

## 📄 Licencia

Este sistema de monitoreo es parte de tu proyecto y sigue la misma licencia.

---

## 🎉 ¡Felicitaciones!

Has implementado un sistema de monitoreo profesional completamente **GRATIS**.

**Próximos pasos recomendados:**

1. ✅ Sigue [QUICK_START.md](./QUICK_START.md) para configurarlo
2. ✅ Configura Better Stack para dashboards hermosos
3. ✅ Configura BetterUptime para uptime monitoring
4. ✅ Instala las apps móviles para recibir alertas
5. ✅ Aplica `withMonitoring` a tus APIs críticas

---

**¿Preguntas?** Revisa la documentación o los ejemplos de integración.

**Happy Monitoring! 🚀📊**

