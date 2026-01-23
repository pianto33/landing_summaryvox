import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { withMonitoring } from "@/monitoring/middleware/apiMonitoring";
import { validateWarn, checkSubscriptionsSchema } from "@/lib/validation";

const STRIPE_PRIVATE_KEY = process.env.STRIPE_PRIVATE_KEY ?? "";
const stripe = new Stripe(STRIPE_PRIVATE_KEY);

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔒 Validar input (modo warn: alerta pero no bloquea)
  const { data: validatedData } = await validateWarn(
    checkSubscriptionsSchema, 
    req.body, 
    'check-subscriptions',
    { ip: req.headers['x-forwarded-for']?.toString(), url: req.url }
  );

  try {
    const { customerId } = validatedData;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
    });

    const hasActiveOrTrialSubscriptions = subscriptions.data.some(
      (subscription) =>
        subscription.status === "active" || subscription.status === "trialing"
    );

    return res.json({
      hasActiveSubscriptions: hasActiveOrTrialSubscriptions,
    });
  } catch (error: any) {
    logger.error("Error checking subscriptions", error, {
      customerId: req.body.customerId,
    });
    
    return res.status(400).json({ error: error.message });
  }
}

export default withMonitoring(handler);
