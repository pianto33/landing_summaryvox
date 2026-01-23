import type { NextApiRequest, NextApiResponse } from 'next';
import { runHealthCheck } from '@/monitoring/services/monitoringService';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  metrics?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  uptime: number;
  version: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
    });
  }

  try {
    const { healthy, metrics } = await runHealthCheck();

    const response: HealthResponse = {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      metrics: metrics || undefined,
      uptime: Math.round(process.uptime()),
      version: process.env.npm_package_version || '0.1.0',
    };

    // Si no está saludable, retornar 503
    const statusCode = healthy ? 200 : 503;

    return res.status(statusCode).json(response);
  } catch (error) {
    console.error('[Health Check] Error:', error);
    
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
    });
  }
}

