# 🚀 Quick Start - Sistema de Monitoreo

Guía rápida para empezar a monitorear tu aplicación en **menos de 10 minutos**.

---

## ⚡ Paso 1: Configurar Variables de Entorno (2 minutos)

Ve a tu proyecto en Vercel Dashboard > Settings > Environment Variables y agrega:

```bash
# Slack Webhooks (ya los tienes configurados)
SLACK_WEBHOOK_SUCCESS=tu_webhook
SLACK_WEBHOOK_RED_ALERT=tu_webhook
SLACK_WEBHOOK_LOGS=tu_webhook
SLACK_WEBHOOK_MONITORING=tu_webhook_canal_monitoreo

# NUEVO: Seguridad para Cron Jobs
CRON_SECRET=genera_un_token_aleatorio_seguro

# NUEVO: Seguridad para endpoint de métricas (opcional)
METRICS_AUTH_TOKEN=otro_token_aleatorio_seguro
```

**💡 Tip:** Genera tokens seguros con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ⚡ Paso 2: Desplegar (1 minuto)

```bash
# Commitea y pushea los cambios
git add .
git commit -m "Add monitoring system"
git push
```

Vercel desplegará automáticamente y activará los cron jobs.

---

## ⚡ Paso 3: Verificar que Funciona (2 minutos)

### Prueba 1: Health Check
```bash
curl https://tu-app.vercel.app/api/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "metrics": {
    "memory": { "used": 45, "total": 128, "percentage": 35.16 },
    "cpu": { "usage": 123 }
  },
  "uptime": 123,
  "version": "0.1.0"
}
```

### Prueba 2: Trigger Manual de Cron
```bash
curl -X POST \
  -H "Authorization: Bearer TU_CRON_SECRET" \
  https://tu-app.vercel.app/api/cron/health-check
```

Deberías recibir una notificación en Slack (canal `#logs`).

---

## ⚡ Paso 4: Vercel Analytics

✅ **Ya instalado y configurado automáticamente**

El paquete `@vercel/analytics` ya está instalado y agregado en `_app.tsx`.  
Solo necesitas desplegar para activarlo.

---

## ⚡ Paso 5: Monitoreo de APIs

✅ **Ya aplicado a todas las APIs principales**

El middleware `withMonitoring` ya está configurado en:
- ✅ `create-customer.ts`
- ✅ `create-intent.ts`
- ✅ `create-subscription.ts`
- ✅ `check-customer.ts`
- ✅ `check-subscriptions.ts`

Cada vez que estas APIs se ejecuten, se monitorearán automáticamente.

---

## 🎉 ¡Listo! Ya estás monitoreando

Ahora recibirás alertas automáticas en Slack:

### Canal `#monitoring`:
- 🐌 APIs lentas (> 5 segundos)
- ⚠️ Alto uso de memoria (> 80%)
- ⚠️ Health check falló
- 📊 Reporte diario (9am UTC)

### Canal `#red-alert`:
- 🔴 Errores del servidor (5xx) - **Solo errores críticos**
- 🚨 Errores de aplicación graves

### Canal `#success`:
- ✅ Pagos exitosos

### Canal `#logs`:
- 📝 Logs generales de la aplicación

---

## 🚀 Siguiente Nivel: Agregar Dashboards (Opcional)

### Opción A: Better Stack (Recomendado - Más Fácil)

1. Crea cuenta gratis en [betterstack.com](https://betterstack.com)
2. Crea un "Log Source" tipo HTTP
3. Copia el Source Token
4. Agrega en Vercel:
   ```bash
   BETTERSTACK_SOURCE_TOKEN=tu_token
   ```
5. Despliega
6. ¡Automáticamente verás dashboards hermosos con todos tus logs!

**Tiempo: 5 minutos**

### Opción B: BetterUptime (Para Uptime)

1. Crea cuenta en [betteruptime.com](https://betteruptime.com)
2. Crea monitor:
   - URL: `https://tu-app.vercel.app/api/health`
   - Interval: 3 minutos
3. Conecta con Slack
4. ¡Listo! Tienes status page gratis: `tu-app.betteruptime.com`

**Tiempo: 3 minutos**

### Opción C: Grafana Cloud (Para Métricas Avanzadas)

Solo si quieres dashboards super profesionales.

[Ver guía completa en INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md#-grafana-cloud)

**Tiempo: 15 minutos**

---

## 📱 Ver Alertas en tu Móvil

Instala la app de Slack en tu teléfono y activa notificaciones para los canales:
- `#red-alert` (crítico - errores graves)
- `#monitoring` (importante - métricas del sistema)
- `#success` (pagos exitosos)
- `#logs` (informativo, silenciar si quieres)

---

## 🧪 Comandos Útiles

### Ver estado del sistema:
```bash
curl https://tu-app.vercel.app/api/health | jq
```

### Ver métricas en formato Prometheus:
```bash
curl -H "Authorization: Bearer $METRICS_AUTH_TOKEN" \
  "https://tu-app.vercel.app/api/metrics?format=prometheus"
```

### Trigger manual del reporte diario:
```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://tu-app.vercel.app/api/cron/daily-report
```

---

## 🎯 Checklist de Verificación

- [ ] Variables de entorno configuradas (CRON_SECRET, METRICS_AUTH_TOKEN, SLACK_WEBHOOK_MONITORING)
- [ ] Código desplegado en Vercel
- [ ] Health check responde correctamente (`/api/health`)
- [ ] Recibiste notificación de prueba en Slack
- [ ] Vercel Analytics activado (ya instalado)
- [ ] APIs principales monitoreadas (ya aplicado)
- [ ] (Opcional) Better Stack configurado
- [ ] (Opcional) BetterUptime configurado

---

## ❓ ¿Problemas?

### No recibo alertas en Slack
1. Verifica que las variables `SLACK_WEBHOOK_*` estén en Vercel
2. Chequea que estés en ambiente `production`
3. Revisa logs en Vercel Dashboard

### Los cron jobs no se ejecutan
1. Asegúrate que `vercel.json` esté en la raíz del proyecto
2. Verifica en Vercel Dashboard > Settings > Cron Jobs
3. Mira los logs de ejecución en Vercel

### Errores de TypeScript
```bash
npm install
npm run build
```

---

## 📚 Documentación Completa

- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Guía completa
- [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - Ejemplos de integración
- [Vercel Cron Docs](https://vercel.com/docs/cron-jobs)

---

## 💡 Próximos Pasos Recomendados

1. **Personaliza los umbrales** en `monitoringService.ts`
   - Cambia 80% a 90% para memoria si recibes muchas alertas
   - Ajusta 5 segundos para respuestas lentas

2. **Agrega más métricas personalizadas**
   - Cuenta de pagos por día
   - Tasa de conversión
   - Países con más tráfico

3. **Crea dashboards personalizados** en Better Stack o Grafana

4. **Configura alertas personalizadas** según tu negocio

---

¿Listo para empezar? ¡Sigue el Paso 1! 🚀

