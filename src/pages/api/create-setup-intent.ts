import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { withRateLimitAndMonitoring } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY ?? "");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      email, 
      name, 
      priceId, 
      countryCode, 
      ip_address, 
      gclid,
      geo_country,
      geo_state,
      geo_city,
      geo_postal,
    } = req.body;

    if (!email || !priceId) {
      return res.status(400).json({ error: "Missing email or priceId" });
    }

    // Crear SetupIntent con metadata para el webhook
    // El webhook se encarga de crear customer y subscription
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        email,
        name: name || "",
        priceId,
        countryCode: countryCode || "",
        ip_address: ip_address || "",
        gclid: gclid || "",
        // Datos de geolocalización
        geo_country: geo_country || "",
        geo_state: geo_state || "",
        geo_city: geo_city || "",
        geo_postal: geo_postal || "",
      },
    });

    logger.info("SetupIntent creado exitosamente", {
      setupIntentId: setupIntent.id,
      email,
      priceId,
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    logger.error("Error creating setup intent:", error, {
      email: req.body?.email,
      priceId: req.body?.priceId,
    });
    return res.status(400).json({ error: error.message });
  }
}

// Exporta con rate limiting (5/min) + monitoreo
export default withRateLimitAndMonitoring(handler, 'create-setup-intent');
