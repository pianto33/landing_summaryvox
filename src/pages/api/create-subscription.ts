import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { logger } from "@/utils/logger";
import { withRateLimitAndMonitoring } from "@/lib/rate-limit";
import { validateWarn, createSubscriptionSchema } from "@/lib/validation";

const STRIPE_PRIVATE_KEY = process.env.STRIPE_PRIVATE_KEY ?? "";
const stripe = new Stripe(STRIPE_PRIVATE_KEY);

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        // 🔒 Validar input (modo warn: alerta pero no bloquea)
        const { data: validatedData } = await validateWarn(
            createSubscriptionSchema, 
            req.body, 
            'create-subscription',
            { ip: req.headers['x-forwarded-for']?.toString(), url: req.url }
        );
        
        try {
            const { 
                customerId, 
                priceId, 
                ip_address, 
                geo_country, 
                geo_state, 
                geo_city, 
                geo_postal,
                gclid,
            } = validatedData;
            
            // Construir metadata con toda la información disponible
            const metadata: Record<string, string> = {};
            
            if (ip_address) metadata.ip_address = ip_address;
            if (geo_country) metadata.geo_country = geo_country;
            if (geo_state) metadata.geo_state = geo_state;
            if (geo_city) metadata.geo_city = geo_city;
            if (geo_postal) metadata.geo_postal = geo_postal;
            if (gclid) metadata.gclid = gclid;
            
            const subscriptionData: any = {
                customer: customerId,
                items: [
                    {
                        price: priceId,
                    },
                ],
                trial_period_days: 1,
                collection_method: "charge_automatically",
                payment_behavior: "default_incomplete",
                payment_settings: {
                    save_default_payment_method: "on_subscription",
                },
                expand: [
                    "latest_invoice.payment_intent",
                    "pending_setup_intent",
                ],
            };

            // Agregar metadata solo si hay datos
            if (Object.keys(metadata).length > 0) {
                subscriptionData.metadata = metadata;
                
                logger.info("Suscripción creada con metadata", {
                    customerId,
                    hasIP: !!ip_address,
                    hasCountry: !!geo_country,
                    hasCity: !!geo_city,
                    hasGclid: !!gclid,
                });
            }

            const subscription = await stripe.subscriptions.create(
                subscriptionData
            );

            res.status(200).send({
                clientSecret:
                    subscription.pending_setup_intent &&
                    typeof subscription.pending_setup_intent !== "string"
                        ? subscription.pending_setup_intent.client_secret
                        : null,
            });
        } catch (error: any) {
            // card_error = problema del usuario (tarjeta rechazada, robada, etc.) -> warn
            // otros tipos = error del sistema -> error
            const logData = {
                customerId: req.body.customerId,
                priceId: req.body.priceId,
                stripeErrorType: error.type,
                stripeErrorCode: error.code,
                stripeDeclineCode: error.decline_code,
                stripeStatusCode: error.statusCode,
            };

            if (error.type === 'StripeCardError' || error.type === 'card_error') {
                logger.warn("Tarjeta rechazada en '/create-subscription'", error, logData);
            } else {
                logger.error("Error POST '/create-subscription'", error, logData);
            }

            res.status(400).json({ error: error.message || 'Error desconocido al crear subscription' });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}

// Exporta con rate limiting (5/min) + monitoreo
export default withRateLimitAndMonitoring(handler, 'create-subscription');
