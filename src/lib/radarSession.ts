import type { Stripe } from "@stripe/stripe-js";
import { logger } from "@/utils/logger";

/**
 * Snapshot de browser/device para Stripe Radar.
 * Non-blocking: si falla, el checkout sigue sin session.
 */
export async function createRadarSessionId(
  stripe: Stripe
): Promise<string | undefined> {
  try {
    const { radarSession, error } = await stripe.createRadarSession();
    if (error) throw error;
    return radarSession?.id;
  } catch (e) {
    logger.warn("Error creating Radar session", e);
    return undefined;
  }
}

/** confirmSetup: Radar Session se adjunta al Payment Method (cobros off-session). */
export function radarPaymentMethodData(radarSessionId?: string) {
  if (!radarSessionId) return {};
  return { radar_options: { session: radarSessionId } };
}
