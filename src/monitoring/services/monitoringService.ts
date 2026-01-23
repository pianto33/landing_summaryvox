import { sendSlackNotification } from '@/services/slackService';

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  responseTime: number;
  timestamp: string;
}

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  memory?: number;
  timestamp: string;
  userAgent?: string;
  country?: string;
}

interface ErrorMetrics {
  message: string;
  stack?: string;
  endpoint?: string;
  statusCode?: number;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Obtiene métricas del sistema (solo funciona en Node.js/Vercel)
 */
export const getSystemMetrics = (): SystemMetrics | null => {
  if (typeof window !== 'undefined') return null;

  try {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const percentage = (usedMem / totalMem) * 100;

    return {
      memory: {
        used: Math.round(usedMem / 1024 / 1024), // MB
        total: Math.round(totalMem / 1024 / 1024), // MB
        percentage: Math.round(percentage * 100) / 100,
      },
      cpu: {
        usage: Math.round(process.cpuUsage().user / 1000000), // ms
      },
      responseTime: 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error obteniendo métricas del sistema:', error);
    return null;
  }
};


/**
 * Monitorea el rendimiento de una petición API
 */
export class PerformanceMonitor {
  private startTime: number;
  private endpoint: string;
  private method: string;
  private startMemory?: number;

  constructor(endpoint: string, method: string = 'GET') {
    this.startTime = Date.now();
    this.endpoint = endpoint;
    this.method = method;
    
    // Capturar memoria inicial
    if (typeof window === 'undefined') {
      try {
        this.startMemory = process.memoryUsage().heapUsed;
      } catch {
        // Ignorar si falla
      }
    }
  }

  /**
   * Finaliza el monitoreo y reporta métricas
   */
  async end(statusCode: number = 200, metadata?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    
    let memoryDelta: number | undefined;
    if (this.startMemory && typeof window === 'undefined') {
      try {
        const endMemory = process.memoryUsage().heapUsed;
        memoryDelta = Math.round((endMemory - this.startMemory) / 1024); // KB
      } catch {
        // Ignorar si falla
      }
    }

    const metrics: PerformanceMetrics = {
      endpoint: this.endpoint,
      method: this.method,
      duration,
      statusCode,
      memory: memoryDelta,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // Alertar si la respuesta es muy lenta (> 5 segundos)
    if (duration > 5000) {
      await this.reportSlowResponse(metrics);
    }

    // Alertar si hay un error del servidor
    if (statusCode >= 500) {
      await this.reportServerError(metrics);
    }

    // Log de todas las requests (solo en desarrollo o con flag)
    if (process.env.LOG_ALL_REQUESTS === 'true') {
      console.log('[Performance]', metrics);
    }

    return metrics;
  }

  private async reportSlowResponse(metrics: PerformanceMetrics) {
    const message = `🐌 *Respuesta Lenta Detectada*\n⏱️ Duración: *${metrics.duration}ms*`;
    const metadata = {
      Endpoint: metrics.endpoint,
      Método: metrics.method,
      Duración: `${metrics.duration}ms`,
      'Código Estado': metrics.statusCode,
      'Memoria Usada': metrics.memory ? `${metrics.memory}KB` : 'N/A',
      Timestamp: new Date(metrics.timestamp).toLocaleString('es-ES'),
    };

    await sendSlackNotification('monitoring', message, metadata);
  }

  private async reportServerError(metrics: PerformanceMetrics) {
    const message = `🔴 *Error del Servidor*\n❌ Código: *${metrics.statusCode}*`;
    const metadata = {
      Endpoint: metrics.endpoint,
      Método: metrics.method,
      'Código Estado': metrics.statusCode,
      Duración: `${metrics.duration}ms`,
      Timestamp: new Date(metrics.timestamp).toLocaleString('es-ES'),
    };

    await sendSlackNotification('red-alert', message, metadata);
  }
}

/**
 * Detecta si estamos en un entorno serverless (Vercel Functions)
 * Las serverless functions tienen memoria muy limitada (~19-50MB)
 */
const isServerlessEnvironment = (metrics: SystemMetrics): boolean => {
  // Si la memoria total es < 100MB, asumimos que es serverless
  return metrics.memory.total < 100;
};

/**
 * Reporta métricas del sistema si exceden umbrales
 */
export const checkSystemHealth = async (): Promise<void> => {
  const metrics = getSystemMetrics();
  
  if (!metrics) return;

  // En entornos serverless (Vercel), no alertar por uso de memoria normal
  // Las serverless functions tienen ~19MB total y usar 18MB (95%) es completamente normal
  if (isServerlessEnvironment(metrics)) {
    // Solo alertar si la memoria usada es anormalmente alta (> 150MB absolutos)
    // o si el porcentaje es extremo (> 98%) Y la memoria total es mayor a lo normal
    if (metrics.memory.used > 150 || (metrics.memory.percentage > 98 && metrics.memory.total > 50)) {
      const message = `⚠️ *Alto Uso de Memoria Detectado (Serverless)*\n📊 ${metrics.memory.used}MB utilizados`;
      const metadata = {
        'Memoria Usada': `${metrics.memory.used}MB`,
        'Memoria Total': `${metrics.memory.total}MB`,
        Porcentaje: `${metrics.memory.percentage}%`,
        'CPU Usage': `${metrics.cpu.usage}ms`,
        Entorno: 'Serverless Function',
        Timestamp: new Date(metrics.timestamp).toLocaleString('es-ES'),
      };

      await sendSlackNotification('monitoring', message, metadata);
    }
    return;
  }

  // Para entornos no-serverless (tradicionales), usar el umbral de 95%
  if (metrics.memory.percentage > 95) {
    const message = `⚠️ *Alto Uso de Memoria Detectado*\n📊 ${metrics.memory.percentage}% utilizado`;
    const metadata = {
      'Memoria Usada': `${metrics.memory.used}MB`,
      'Memoria Total': `${metrics.memory.total}MB`,
      Porcentaje: `${metrics.memory.percentage}%`,
      'CPU Usage': `${metrics.cpu.usage}ms`,
      Timestamp: new Date(metrics.timestamp).toLocaleString('es-ES'),
    };

    await sendSlackNotification('monitoring', message, metadata);
  }
};

/**
 * Middleware para monitorear todas las peticiones API
 */
export const createApiMonitor = (endpoint: string, method: string = 'GET') => {
  return new PerformanceMonitor(endpoint, method);
};

/**
 * Hook para reportar errores del cliente
 */
export const reportClientError = async (error: ErrorMetrics) => {
  const message = `🔴 *Error del Cliente*\n💥 ${error.message}`;
  const metadata = {
    Error: error.message,
    Stack: error.stack?.substring(0, 200) || 'N/A',
    Endpoint: error.endpoint || 'N/A',
    'User Agent': error.userAgent || 'N/A',
    ...(error.metadata || {}),
    Timestamp: new Date().toLocaleString('es-ES'),
  };

  await sendSlackNotification('red-alert', message, metadata);
};

/**
 * Monitor de Health Check periódico
 */
export const runHealthCheck = async (): Promise<{ healthy: boolean; metrics: SystemMetrics | null }> => {
  const metrics = getSystemMetrics();
  
  if (!metrics) {
    return { healthy: true, metrics: null };
  }

  // Ajustar criterios de salud según el entorno
  let isHealthy: boolean;
  
  if (isServerlessEnvironment(metrics)) {
    // En serverless, es normal tener 95%+ de uso con 19MB total
    // Solo considerar no saludable si hay uso absoluto muy alto o extremo
    isHealthy = metrics.memory.used < 150 && 
                !(metrics.memory.percentage > 98 && metrics.memory.total > 50);
  } else {
    // En entornos tradicionales, mantener el umbral del 95%
    isHealthy = metrics.memory.percentage < 95;
  }

  if (!isHealthy) {
    await checkSystemHealth();
  }

  return { healthy: isHealthy, metrics };
};

/**
 * Formatea métricas para exportar a servicios externos (Grafana, Better Stack, etc.)
 */
export const formatMetricsForExport = (metrics: SystemMetrics | PerformanceMetrics) => {
  // Formato compatible con Prometheus/Grafana
  return {
    ...metrics,
    timestamp_ms: new Date().getTime(), // Timestamp en milisegundos para compatibilidad
  };
};

const monitoringService = {
  getSystemMetrics,
  checkSystemHealth,
  createApiMonitor,
  reportClientError,
  runHealthCheck,
  formatMetricsForExport,
};

export default monitoringService;

