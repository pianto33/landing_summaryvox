import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { fetchIPData } from "@/services/trackingService";
import { logger } from "@/utils/logger";
import { withRateLimitAndMonitoring } from "@/lib/rate-limit";
import { validateWarn, createCustomerSchema } from "@/lib/validation";

const STRIPE_PRIVATE_KEY = process.env.STRIPE_PRIVATE_KEY ?? "";
const stripe = new Stripe(STRIPE_PRIVATE_KEY);

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // 🔒 Validar input (modo warn: alerta pero no bloquea)
    const { data: validatedData } = await validateWarn(
      createCustomerSchema, 
      req.body, 
      'create-customer',
      { ip: req.headers['x-forwarded-for']?.toString(), url: req.url }
    );
    
    try {
      const { name, email, country, state, city, postal } = validatedData;

      const ipData = await fetchIPData();
      const forwarded = req.headers["x-forwarded-for"];
      const fallbackIp =
        typeof forwarded === "string"
          ? forwarded.split(/, /)[0]
          : req.socket.remoteAddress;

      const finalIp = ipData.ip || fallbackIp || "unknown";

      // Construir metadata con toda la información de geolocalización
      const metadata: Record<string, string> = {
        ip_address: finalIp,
      };

      if (country) metadata.geo_country = country;
      if (state) metadata.geo_state = state;
      if (city) metadata.geo_city = city;
      if (postal) metadata.geo_postal = postal;

      const customerData: Stripe.CustomerCreateParams = {
        name: name,
        email: email,
        metadata: metadata,
      };

      // Agregar dirección geolocalizada para Stripe Radar (solo si tenemos país)
      if (country) {
        customerData.address = {
          country: country,
        };
        
        // Agregar campos opcionales
        if (state) customerData.address.state = state;
        if (city) customerData.address.city = city;
        if (postal) customerData.address.postal_code = postal;
        
        logger.info("Customer creado con dirección geolocalizada y metadata", {
          email,
          country,
          city,
          hasPostal: !!postal,
        });
      }

      const customer = await stripe.customers.create(customerData);

      res.status(200).send(customer);
    } catch (error: any) {
      logger.error("Error POST '/create-customer'", error, {
        email: req.body.email,
        name: req.body.name,
      });
      
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// Exporta con rate limiting (10/min) + monitoreo
export default withRateLimitAndMonitoring(handler, 'create-customer');
