import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { withRateLimitAndMonitoring } from "@/lib/rate-limit";
import { validateWarn, createIntentSchema } from "@/lib/validation";

const STRIPE_PRIVATE_KEY = process.env.STRIPE_PRIVATE_KEY ?? "";
const stripe = new Stripe(STRIPE_PRIVATE_KEY);

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // 🔒 Validar input (modo warn: alerta pero no bloquea)
    const { data: validatedData } = await validateWarn(
      createIntentSchema, 
      req.body, 
      'create-intent',
      { ip: req.headers['x-forwarded-for']?.toString(), url: req.url }
    );
    
    try {
      const { amount, currency, email } = validatedData;
      const intent = await stripe.paymentIntents.create({
        amount: amount, // Ya validado como entero positivo
        currency: currency, // Ya normalizado a lowercase
        receipt_email: email,
        setup_future_usage: "off_session",
      });
      res.json({ client_secret: intent.client_secret });
    } catch (error: any) {
      // Solo loguear errores del sistema (no errores de tarjeta del usuario)
      if (error.type !== 'StripeCardError' && error.statusCode !== 400) {
        logger.error("Error POST '/create-intent'", error, {
          email: req.body.email,
          amount: req.body.amount,
          currency: req.body.currency,
        });
      }
      
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// Exporta con rate limiting (10/min) + monitoreo
export default withRateLimitAndMonitoring(handler, 'create-intent');
