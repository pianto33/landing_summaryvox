import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { sendEvent } from "@/utils/gtm";
import { GTM_EVENTS } from "@/constants";
import { extractTrackingParams, saveTrackingParams, buildTrackingQueryString } from "@/utils/trackingParams";
import Loader from "@/components/Loader";
import Header from "@/components/Header";
import styles from "@/styles/Pending.module.css";
import logger from "@/utils/logger";

// Cargar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

// Configuración de polling
const MAX_POLLING_ATTEMPTS = 15; // Máximo 15 intentos
const POLLING_INTERVAL_MS = 2000; // 2 segundos entre intentos

function PendingPage() {
  const { t } = useAppTranslation();
  const router = useRouter();
  const { countryCode } = router.query;
  const isProcessingRef = useRef(false); // Evitar ejecuciones duplicadas

  useEffect(() => {
    const processPayment = async () => {
      // Evitar ejecuciones duplicadas
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        if (!router.isReady) {
          isProcessingRef.current = false;
          return;
        }
        const { setup_intent_client_secret: clientSecret } = router.query;

        // Guardar parámetros de tracking si vienen en la URL
        const trackingParams = extractTrackingParams(router.query);
        if (Object.keys(trackingParams).length > 0) {
          saveTrackingParams(trackingParams);
        }

        // Construir query string con parámetros de tracking
        const trackingQueryString = buildTrackingQueryString(trackingParams);

        if (!clientSecret || typeof clientSecret !== 'string') {
          logger.warn("No se encontró setup_intent_client_secret en pending", {
            page: 'pending',
            countryCode,
            hasClientSecret: !!clientSecret,
          });
          sendEvent(GTM_EVENTS.PAYMENT_FAILED);
          return router.push(`/${countryCode}/error${trackingQueryString}`);
        }

        // Verificar el estado del SetupIntent con Stripe
        const stripe = await stripePromise;
        if (!stripe) {
          logger.error("Stripe no se pudo cargar en pending", {
            page: 'pending',
            countryCode,
          });
          sendEvent(GTM_EVENTS.PAYMENT_FAILED);
          return router.push(`/${countryCode}/error${trackingQueryString}`);
        }

        // Función para verificar el estado del SetupIntent con polling
        const checkSetupIntentStatus = async (
          stripe: Stripe,
          clientSecret: string,
          attempt: number = 1
        ): Promise<void> => {
          const { setupIntent, error } = await stripe.retrieveSetupIntent(clientSecret);

          if (error) {
            logger.error("Error al recuperar SetupIntent en pending", error, {
              page: 'pending',
              countryCode,
              errorCode: error.code,
              errorType: error.type,
              attempt,
            });
            sendEvent(GTM_EVENTS.PAYMENT_FAILED);
            router.push(`/${countryCode}/error${trackingQueryString}`);
            return;
          }

          // Verificar el estado del SetupIntent
          if (setupIntent?.status === 'succeeded') {
            logger.info("SetupIntent exitoso en pending", {
              page: 'pending',
              countryCode,
              setupIntentId: setupIntent.id,
              status: setupIntent.status,
              attempts: attempt,
            });
            sendEvent(GTM_EVENTS.PAYMENT_SUCCEDED);
            router.push(`/${countryCode}/thanks${trackingQueryString}`);
          } else if (setupIntent?.status === 'processing') {
            // Aún procesando, verificar si podemos seguir intentando
            if (attempt >= MAX_POLLING_ATTEMPTS) {
              logger.warn("SetupIntent timeout - máximo de intentos alcanzado", {
                page: 'pending',
                countryCode,
                setupIntentId: setupIntent.id,
                status: setupIntent.status,
                attempts: attempt,
              });
              sendEvent(GTM_EVENTS.PAYMENT_FAILED);
              router.push(`/${countryCode}/error?error=setup_timeout${trackingQueryString ? '&' + trackingQueryString.slice(1) : ''}`);
              return;
            }

            logger.info("SetupIntent en procesamiento, reintentando...", {
              page: 'pending',
              countryCode,
              setupIntentId: setupIntent.id,
              status: setupIntent.status,
              attempt,
              nextAttemptIn: POLLING_INTERVAL_MS,
            });

            // Esperar y reintentar
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
            return checkSetupIntentStatus(stripe, clientSecret, attempt + 1);
          } else {
            // Cualquier otro estado es un error
            logger.warn("SetupIntent no exitoso en pending", {
              page: 'pending',
              countryCode,
              setupIntentId: setupIntent?.id,
              status: setupIntent?.status,
              lastSetupError: setupIntent?.last_setup_error?.message,
              attempts: attempt,
            });
            sendEvent(GTM_EVENTS.PAYMENT_FAILED);
            router.push(`/${countryCode}/error?error=setup_${setupIntent?.status || 'unknown'}${trackingQueryString ? '&' + trackingQueryString.slice(1) : ''}`);
          }
        };

        // Iniciar verificación con polling
        await checkSetupIntentStatus(stripe, clientSecret);

      } catch (error: any) {
        logger.error("ERROR checkStatus in '/pending'", error, {
          page: 'pending',
          countryCode,
        });
        const trackingParams = extractTrackingParams(router.query);
        const trackingQueryString = buildTrackingQueryString(trackingParams);
        router.push(`/${countryCode}/error${trackingQueryString}`);
      }
    };
    processPayment();
  }, [router.isReady, router.query, countryCode, router]);

  return (
    <>
      <div className={styles.container}>
        <Header />
        <div className={styles.contentWrapper}>
          <div className={styles.loaderWrapper}>
            <Loader size={150} color="gold" />
          </div>
          <h1 className={styles.title}>{t("creating_subscription")}</h1>
        </div>
        <div></div>
      </div>
    </>
  );
}

export default PendingPage;
