import type { NextApiRequest, NextApiResponse } from 'next';
import { notifySystemError } from '@/services/slackService';
import { betterStack } from '@/monitoring/services/betterStackService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Declarar variables fuera del try para que sean accesibles en el catch
  const { level, message, metadata } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Extraer sessionId si existe (ya viene del cliente)
    const sessionId = metadata?.sessionId || 'unknown';

    // Agregar información de la request al metadata (sin duplicar sessionId)
    const enrichedMetadata = {
      sessionId, // Mantener sessionId al principio
      ...metadata,
      timestamp: new Date().toISOString(),
    };

    // Enviar según el nivel
    if (level === 'payment-success') {
      // Manejo especial para pagos exitosos
      const { notifyPaymentSuccess } = await import('@/services/slackService');
      await notifyPaymentSuccess(
        metadata.email,
        metadata.amount,
        metadata.currency,
        metadata.customerId
      );
    } else if (level === 'error' || level === 'red-alert') {
      await notifySystemError(
        metadata?.context || 'Client Error',
        message,
        enrichedMetadata
      );
    } else {
      // Logs normales van a Better Stack (no a Slack)
      const levelEmoji = {
        log: '📝',
        info: 'ℹ️',
        warn: '⚠️',
        visit: '👁️',
        click: '🖱️',
      };
      const emoji = levelEmoji[level as keyof typeof levelEmoji] || '📝';
      const logLevel = level === 'warn' ? 'warn' : 'info';
      await betterStack.sendLog(logLevel, `${emoji} [${level?.toUpperCase() || 'LOG'}] ${message}`, enrichedMetadata);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[API Log] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

