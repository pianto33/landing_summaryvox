/**
 * 🛡️ CAPA 1: Rate Limiter en Memoria
 * 
 * Protección rápida contra ataques obvios/agresivos.
 * - No consume comandos de Upstash
 * - Bloquea bots/scripts que hacen muchas requests rápidas
 * - Cada instancia serverless tiene su propio contador
 * 
 * Limitaciones:
 * - No es distribuido (cada instancia tiene su propio estado)
 * - Se resetea en cold starts
 * - Por eso necesitamos la Capa 2 (Upstash) para rate limiting fino
 */

interface RequestRecord {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockedUntil: number;
}

// Cache en memoria para tracking de IPs
const ipCache = new Map<string, RequestRecord>();

// Configuración
const CONFIG = {
  // Ventana de tiempo para contar requests (ms)
  WINDOW_MS: 10 * 1000, // 10 segundos
  
  // Máximo de requests por ventana antes de bloquear
  MAX_REQUESTS_PER_WINDOW: 50,
  
  // Tiempo de bloqueo cuando se detecta ataque (ms)
  BLOCK_DURATION_MS: 60 * 1000, // 1 minuto
  
  // Intervalo de limpieza del cache (ms)
  CLEANUP_INTERVAL_MS: 60 * 1000, // 1 minuto
  
  // Máximo de entradas en cache antes de forzar limpieza
  MAX_CACHE_SIZE: 10000,
};

// Limpieza periódica del cache
let lastCleanup = Date.now();

function cleanupCache() {
  const now = Date.now();
  
  // Solo limpiar cada CLEANUP_INTERVAL_MS o si el cache está muy grande
  if (now - lastCleanup < CONFIG.CLEANUP_INTERVAL_MS && ipCache.size < CONFIG.MAX_CACHE_SIZE) {
    return;
  }
  
  lastCleanup = now;
  
  // Eliminar entradas expiradas
  for (const [ip, record] of ipCache.entries()) {
    const windowExpired = now - record.firstRequest > CONFIG.WINDOW_MS;
    const blockExpired = record.blocked && now > record.blockedUntil;
    
    if (windowExpired && (!record.blocked || blockExpired)) {
      ipCache.delete(ip);
    }
  }
}

export interface MemoryRateLimitResult {
  allowed: boolean;
  blocked: boolean;
  reason?: string;
  requestsInWindow: number;
  retryAfterMs?: number;
}

/**
 * Verifica si una IP debe ser bloqueada por la Capa 1 (memoria)
 * 
 * @param ip - Dirección IP del cliente
 * @returns Resultado indicando si la request está permitida
 */
export function checkMemoryRateLimit(ip: string): MemoryRateLimitResult {
  const now = Date.now();
  
  // Limpiar cache periódicamente
  cleanupCache();
  
  // Obtener o crear registro para esta IP
  let record = ipCache.get(ip);
  
  if (!record) {
    record = {
      count: 0,
      firstRequest: now,
      blocked: false,
      blockedUntil: 0,
    };
    ipCache.set(ip, record);
  }
  
  // Si está bloqueada, verificar si el bloqueo expiró
  if (record.blocked) {
    if (now < record.blockedUntil) {
      return {
        allowed: false,
        blocked: true,
        reason: 'IP temporarily blocked due to excessive requests',
        requestsInWindow: record.count,
        retryAfterMs: record.blockedUntil - now,
      };
    }
    
    // Bloqueo expiró, resetear
    record.blocked = false;
    record.blockedUntil = 0;
    record.count = 0;
    record.firstRequest = now;
  }
  
  // Si la ventana expiró, resetear contador
  if (now - record.firstRequest > CONFIG.WINDOW_MS) {
    record.count = 0;
    record.firstRequest = now;
  }
  
  // Incrementar contador
  record.count++;
  
  // Verificar si excedió el límite
  if (record.count > CONFIG.MAX_REQUESTS_PER_WINDOW) {
    record.blocked = true;
    record.blockedUntil = now + CONFIG.BLOCK_DURATION_MS;
    
    console.warn(`[MemoryRateLimit] IP ${ip} blocked: ${record.count} requests in ${CONFIG.WINDOW_MS}ms`);
    
    return {
      allowed: false,
      blocked: true,
      reason: 'Too many requests - IP temporarily blocked',
      requestsInWindow: record.count,
      retryAfterMs: CONFIG.BLOCK_DURATION_MS,
    };
  }
  
  return {
    allowed: true,
    blocked: false,
    requestsInWindow: record.count,
  };
}

/**
 * Obtiene estadísticas del rate limiter en memoria
 */
export function getMemoryRateLimitStats() {
  return {
    totalIPs: ipCache.size,
    blockedIPs: Array.from(ipCache.values()).filter(r => r.blocked).length,
    config: CONFIG,
  };
}

/**
 * Limpia manualmente el cache (útil para tests)
 */
export function clearMemoryRateLimitCache() {
  ipCache.clear();
}
