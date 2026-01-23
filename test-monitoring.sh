#!/bin/bash

# 🧪 Script de Testing del Sistema de Monitoreo
# Uso: ./test-monitoring.sh [tu-app-url]

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL base (usar argumento o valor por defecto)
BASE_URL="${1:-https://tu-app.vercel.app}"

# Tokens (leerlos de .env.local si existe)
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

METRICS_TOKEN="${METRICS_AUTH_TOKEN:-tu_token}"
CRON_SECRET_TOKEN="${CRON_SECRET:-tu_secret}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 Testing Sistema de Monitoreo      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}Base URL:${NC} $BASE_URL"
echo ""

# Función helper para mostrar resultados
check_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
  else
    echo -e "${RED}❌ FAIL${NC}"
  fi
  echo ""
}

# Test 1: Health Check
echo -e "${BLUE}1️⃣  Testing Health Check...${NC}"
echo -e "${YELLOW}   GET $BASE_URL/api/monitoring/health${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/monitoring/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
  echo "$body" | jq . 2>/dev/null || echo "$body"
  check_result 0
else
  echo -e "${RED}HTTP $http_code${NC}"
  echo "$body"
  check_result 1
fi

# Test 2: Métricas en formato JSON
echo -e "${BLUE}2️⃣  Testing Metrics (JSON format)...${NC}"
echo -e "${YELLOW}   GET $BASE_URL/api/monitoring/metrics${NC}"
response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $METRICS_TOKEN" \
  "$BASE_URL/api/monitoring/metrics")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
  echo "$body" | jq . 2>/dev/null || echo "$body"
  check_result 0
elif [ "$http_code" == "401" ]; then
  echo -e "${YELLOW}⚠️  Unauthorized - ¿Configuraste METRICS_AUTH_TOKEN?${NC}"
  check_result 1
else
  echo -e "${RED}HTTP $http_code${NC}"
  echo "$body"
  check_result 1
fi

# Test 3: Métricas en formato Prometheus
echo -e "${BLUE}3️⃣  Testing Metrics (Prometheus format)...${NC}"
echo -e "${YELLOW}   GET $BASE_URL/api/monitoring/metrics?format=prometheus${NC}"
response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $METRICS_TOKEN" \
  "$BASE_URL/api/monitoring/metrics?format=prometheus")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
  echo "$body" | head -n 20
  if [ $(echo "$body" | wc -l) -gt 20 ]; then
    echo "... (truncated)"
  fi
  check_result 0
else
  echo -e "${RED}HTTP $http_code${NC}"
  check_result 1
fi

# Test 4: Health Check Cron (manual trigger)
echo -e "${BLUE}4️⃣  Testing Health Check Cron Job...${NC}"
echo -e "${YELLOW}   POST $BASE_URL/api/monitoring/cron/health-check${NC}"
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN" \
  "$BASE_URL/api/monitoring/cron/health-check")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo -e "${GREEN}✅ Deberías haber recibido una notificación en Slack${NC}"
  check_result 0
elif [ "$http_code" == "401" ]; then
  echo -e "${YELLOW}⚠️  Unauthorized - ¿Configuraste CRON_SECRET?${NC}"
  check_result 1
else
  echo -e "${RED}HTTP $http_code${NC}"
  echo "$body"
  check_result 1
fi

# Test 5: Daily Report Cron (manual trigger)
echo -e "${BLUE}5️⃣  Testing Daily Report Cron Job...${NC}"
echo -e "${YELLOW}   POST $BASE_URL/api/monitoring/cron/daily-report${NC}"
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN" \
  "$BASE_URL/api/monitoring/cron/daily-report")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo -e "${GREEN}✅ Deberías haber recibido el reporte en Slack${NC}"
  check_result 0
else
  echo -e "${RED}HTTP $http_code${NC}"
  echo "$body"
  check_result 1
fi

# Test 6: Verificar que vercel.json existe
echo -e "${BLUE}6️⃣  Checking vercel.json configuration...${NC}"
if [ -f vercel.json ]; then
  echo -e "${GREEN}✅ vercel.json encontrado${NC}"
  echo ""
  echo "Cron jobs configurados:"
  cat vercel.json | jq '.crons' 2>/dev/null || cat vercel.json
  check_result 0
else
  echo -e "${RED}❌ vercel.json no encontrado${NC}"
  check_result 1
fi

# Resumen
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         📊 Resumen de Tests            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Próximos pasos:${NC}"
echo "1. Verifica Slack para las notificaciones de los cron jobs"
echo "2. Configura Better Stack para dashboards (opcional)"
echo "3. Configura BetterUptime para uptime monitoring (opcional)"
echo "4. Aplica el middleware withMonitoring a tus APIs"
echo ""
echo -e "${YELLOW}Documentación:${NC}"
echo "- Quick Start: docs/QUICK_START.md"
echo "- Setup completo: docs/MONITORING_SETUP.md"
echo "- Ejemplos: docs/INTEGRATION_EXAMPLES.md"
echo ""
echo -e "${BLUE}✨ Testing completado!${NC}"

