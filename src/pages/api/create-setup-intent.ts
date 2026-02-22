import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { withRateLimitAndMonitoring } from "@/lib/rate-limit";
import { validateWarn, createSetupIntentSchema } from "@/lib/validation";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY ?? "");

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data: validatedData } = await validateWarn(
      createSetupIntentSchema,
      req.body,
      'create-setup-intent',
      { ip: req.headers['x-forwarded-for']?.toString(), url: req.url }
    );

    const { 
      email, 
      name, 
      priceId, 
      countryCode, 
      ip_address, 
      fbclid,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      utm_id,
      geo_country,
      geo_state,
      geo_city,
      geo_postal,
    } = validatedData;

    if (!email || !priceId) {
      return res.status(400).json({ error: "Missing email or priceId" });
    }

    const metadata: Record<string, string> = {
      email,
      name: name || "",
      priceId,
      countryCode: countryCode || "",
      ip_address: ip_address || "",
      geo_country: geo_country || "",
      geo_state: geo_state || "",
      geo_city: geo_city || "",
      geo_postal: geo_postal || "",
    };

    if (fbclid) metadata.fbclid = fbclid;
    if (utm_source) metadata.utm_source = utm_source;
    if (utm_medium) metadata.utm_medium = utm_medium;
    if (utm_campaign) metadata.utm_campaign = utm_campaign;
    if (utm_term) metadata.utm_term = utm_term;
    if (utm_content) metadata.utm_content = utm_content;
    if (utm_id) metadata.utm_id = utm_id;

    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["card"],
      usage: "off_session",
      metadata,
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
