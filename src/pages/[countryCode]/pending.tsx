import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { sendEvent } from "@/utils/gtm";
import { GTM_EVENTS } from "@/constants";
import { extractTrackingParams, saveTrackingParams, buildTrackingQueryString } from "@/utils/trackingParams";
import Loader from "@/components/Loader";
import Header from "@/components/Header";
import styles from "@/styles/Pending.module.css";
import logger from "@/utils/logger";

function PendingPage() {
  const { t } = useAppTranslation();
  const router = useRouter();
  const { countryCode } = router.query;

  useEffect(() => {
    const processPayment = async () => {
      try {
        if (!router.isReady) return;
        const { setup_intent_client_secret: clientSecret } = router.query;

        // Guardar parámetros de tracking si vienen en la URL
        const trackingParams = extractTrackingParams(router.query);
        if (Object.keys(trackingParams).length > 0) {
          saveTrackingParams(trackingParams);
        }

        // Construir query string con parámetros de tracking
        const trackingQueryString = buildTrackingQueryString(trackingParams);

        if (!clientSecret) {
          sendEvent(GTM_EVENTS.PAYMENT_FAILED);
          return router.push(`/${countryCode}/error${trackingQueryString}`);
        } else {
          // Pago exitoso - preservar parámetros de tracking en el redirect
          sendEvent(GTM_EVENTS.PAYMENT_SUCCEDED);
          router.push(`/${countryCode}/thanks${trackingQueryString}`);
        }
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
