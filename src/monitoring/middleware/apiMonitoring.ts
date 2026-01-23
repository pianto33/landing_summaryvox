import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiMonitor } from '@/monitoring/services/monitoringService';

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Middleware para monitorear automáticamente todas las peticiones API
 * Uso:
 * 
 * export default withMonitoring(handler);
 */
export function withMonitoring(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const monitor = createApiMonitor(req.url || 'unknown', req.method || 'GET');

    // Capturar el statusCode original
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);

    let statusCode = 200;
    let finished = false;

    // Interceptar res.json
    res.json = function (body: any) {
      if (!finished) {
        statusCode = res.statusCode;
        finished = true;
        monitor.end(statusCode, {
          userAgent: req.headers['user-agent'],
          country: req.headers['x-vercel-ip-country'] as string,
        });
      }
      return originalJson(body);
    };

    // Interceptar res.send
    res.send = function (body: any) {
      if (!finished) {
        statusCode = res.statusCode;
        finished = true;
        monitor.end(statusCode, {
          userAgent: req.headers['user-agent'],
          country: req.headers['x-vercel-ip-country'] as string,
        });
      }
      return originalSend(body);
    };

    // Interceptar res.end
    res.end = function (...args: any[]) {
      if (!finished) {
        statusCode = res.statusCode;
        finished = true;
        monitor.end(statusCode, {
          userAgent: req.headers['user-agent'],
          country: req.headers['x-vercel-ip-country'] as string,
        });
      }
      return originalEnd(...args);
    };

    try {
      await handler(req, res);
    } catch (error) {
      statusCode = 500;
      if (!finished) {
        finished = true;
        await monitor.end(statusCode, {
          error: error instanceof Error ? error.message : 'Unknown error',
          userAgent: req.headers['user-agent'],
          country: req.headers['x-vercel-ip-country'] as string,
        });
      }
      throw error;
    }
  };
}

export default withMonitoring;

