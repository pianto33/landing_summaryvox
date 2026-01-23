import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { withRateLimitAndMonitoring } from "@/lib/rate-limit";
import { validateWarn, checkCustomerSchema } from "@/lib/validation";

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
    checkCustomerSchema, 
    req.body, 
    'check-customer',
    { ip: req.headers['x-forwarded-for']?.toString(), url: req.url }
  );

  try {
    const { email } = validatedData;

    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    return res.json({
      customerId: customers.data[0]?.id || null,
    });
  } catch (error: any) {
    logger.error("Error checking customer", error, {
      email: req.body.email,
    });
    
    return res.status(400).json({ error: error.message });
  }
}

// Exporta con rate limiting (20/min) + monitoreo
export default withRateLimitAndMonitoring(handler, 'check-customer');
