import { getShortSessionId } from './sessionId';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'red-alert' | 'visit' | 'click';

interface LogMetadata {
  [key: string]: any;
}

/**
 * Logger para el cliente que envía logs al servidor de forma no bloqueante
 */
class ClientLogger {
  private async sendLog(level: LogLevel, message: string, metadata?: LogMetadata) {
    // Enviar de forma no bloqueante (fire and forget)
    try {
      fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          metadata: {
            sessionId: getShortSessionId(),
            ...metadata,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          },
        }),
        // keepalive permite que la request continúe incluso si el usuario navega
        keepalive: true,
      }).catch(() => {
        // Silenciar errores para no interrumpir el flujo del usuario
      });
    } catch {
      // Silenciar errores
    }
  }

  log(message: string, metadata?: LogMetadata) {
    this.sendLog('log', message, metadata);
  }

  info(message: string, metadata?: LogMetadata) {
    this.sendLog('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    this.sendLog('warn', message, metadata);
  }

  error(message: string, metadata?: LogMetadata) {
    this.sendLog('error', message, metadata);
  }

  redAlert(message: string, metadata?: LogMetadata) {
    this.sendLog('red-alert', message, metadata);
  }

  visit(pageName: string, metadata?: LogMetadata) {
    this.sendLog('visit', `Page Visit: ${pageName}`, metadata);
  }

  click(element: string, metadata?: LogMetadata) {
    this.sendLog('click', `User Click: ${element}`, metadata);
  }
}

// Exportar instancia única
export const clientLogger = new ClientLogger();

export default clientLogger;

