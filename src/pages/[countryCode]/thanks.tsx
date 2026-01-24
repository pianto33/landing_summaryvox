import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { useStripeData } from "@/hooks/useStripeData";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { generateAutoLoginToken } from "@/api/voxpages";
import { sendEvent } from "@/utils/gtm";
import { GTM_EVENTS } from "@/constants";
import { extractTrackingParams, saveTrackingParams } from "@/utils/trackingParams";
import Button from "@/components/Button";
import Header from "@/components/Header";
import { logger } from "@/utils/logger";
import Script from "next/script";
import styles from "@/styles/Thanks.module.css";

function ThanksPage() {
    const router = useRouter();
    const { t, lng } = useAppTranslation();
    const stripeData = useStripeData();
    const [magicLink, setMagicLink] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [useFallback, setUseFallback] = useState(false);
    const [gclid, setGclid] = useState<string | null>(null);
    
    // Ref para prevenir múltiples ejecuciones del procesamiento de pago
    const paymentProcessedRef = useRef(false);
    // Flag persistente en sessionStorage para prevenir duplicados incluso si el componente se desmonta
    const [processingComplete, setProcessingComplete] = useState(false);
    
    // Obtener amount y currency de localStorage (guardados durante el pago) o usar fallback
    const amount = typeof window !== 'undefined' 
        ? (parseInt(localStorage.getItem("paymentAmount") || "") || stripeData.amount)
        : stripeData.amount;
    const currency = typeof window !== 'undefined'
        ? (localStorage.getItem("paymentCurrency") || stripeData.currency)
        : stripeData.currency;

    // Log inicial para debugging
    useEffect(() => {
        const email = localStorage.getItem("userEmail") || "";
        const name = localStorage.getItem("userName") || "";
        const customerId = localStorage.getItem("customerId") || "";
        
        logger.info("Thanks page: carga inicial", {
            hasEmail: !!email,
            hasName: !!name,
            hasCustomerId: !!customerId,
            lng,
            amount,
            currency,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo una vez al montar
    
    // Log de conversión de Google Ads (se ejecuta cuando tenemos amount/currency)
    useEffect(() => {
        if (amount && currency) {
            logger.info("Google Ads conversion script rendered", {
                amount: (amount / 100).toFixed(2),
                currency,
                hasGclid: !!gclid,
                conversionId: 'AW-17863886225/vCjPCPmzrOYbEJGLlcZC',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amount, currency]); // Se ejecuta cuando tenemos los datos de pago

    // Capturar y guardar parámetros de tracking (gclid, utm_*, etc.)
    useEffect(() => {
        if (router.isReady) {
            const trackingParams = extractTrackingParams(router.query);
            if (Object.keys(trackingParams).length > 0) {
                saveTrackingParams(trackingParams);
            }
            // Guardar gclid específicamente para el pixel de Google Ads
            if (trackingParams.gclid) {
                setGclid(trackingParams.gclid);
            }
        }
    }, [router.isReady, router.query]);

    // Timeout de 6 segundos para ofrecer link sin token
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!magicLink && isLoading) {
                const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || "https://voxpages.com";
                const fallbackLink = `${platformUrl}/${lng}`;
                setMagicLink(fallbackLink);
                setIsLoading(false);
                setUseFallback(true);
                logger.warn("Magic link generation timeout, using fallback link", {
                    page: 'thanks',
                    timeout: 6000
                });
            }
        }, 6000);

        return () => clearTimeout(timeout);
    }, [magicLink, isLoading, lng]);

    useEffect(() => {
        const email = localStorage.getItem("userEmail") || "";
        const name = localStorage.getItem("userName") || "";
        const customerId = localStorage.getItem("customerId") || "";
        
        // Validar que tengamos los datos necesarios ANTES de verificar si ya se procesó
        if (!email) {
            logger.info("Thanks page: esperando email del usuario");
            return;
        }
        if (!lng) {
            logger.info("Thanks page: esperando idioma");
            return;
        }
        
        // Verificar si ya se procesó previamente (incluso si el componente se desmontó)
        const sessionKey = `payment_processed_${customerId || email}`;
        const alreadyProcessed = sessionStorage.getItem(sessionKey);
        
        if (alreadyProcessed || paymentProcessedRef.current || processingComplete) {
            logger.info("Thanks page: pago ya procesado, evitando duplicados", {
                email,
                sessionKey,
                alreadyProcessed: !!alreadyProcessed,
                refCurrent: paymentProcessedRef.current,
                stateComplete: processingComplete,
            });
            return;
        }
        
        logger.info("Thanks page: iniciando procesamiento de pago exitoso", {
            email,
            customerId,
            lng,
        });
        
        // Marcar como procesado en ref inmediatamente para prevenir doble ejecución dentro del mismo render
        // PERO no guardar en sessionStorage hasta que todo esté OK
        paymentProcessedRef.current = true;
        
        (async () => {
            try {
                setIsLoading(true);
                // Generar el token de auto-login
                const finalCustomerId = customerId || `email_${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
                const token = await generateAutoLoginToken(email, finalCustomerId, name);
                
                // Construir URL de auto-login para el botón
                const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || "https://voxpages.com";
                const link = `${platformUrl}/${lng}/auto-login?token=${encodeURIComponent(token)}`;
                setMagicLink(link);
                setIsLoading(false);
                
                logger.info("Thanks page: magic link generado exitosamente", {
                    email,
                });
                
                // Notificar pago exitoso - SOLO UNA VEZ
                if (amount && currency) {
                    logger.paymentSuccess(email, amount, currency, customerId);
                }
                
                // ✅ AHORA sí marcar como completado en sessionStorage (después de éxito)
                sessionStorage.setItem(sessionKey, 'true');
                setProcessingComplete(true);
            } catch (error) {
                logger.error("Error en procesamiento de thanks page", error, {
                    email,
                    customerId,
                    page: 'thanks',
                    errorType: (error as any)?.message || 'Unknown',
                });
                setIsLoading(false);
                // En caso de error, establecer link de fallback en lugar de redirigir a error
                const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || "https://voxpages.com";
                const fallbackLink = `${platformUrl}/${lng}`;
                setMagicLink(fallbackLink);
                setUseFallback(true);
                // NO marcar como procesado si falló - permitir reintento
                paymentProcessedRef.current = false;
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lng, amount, currency]); // processingComplete no debe estar en deps para evitar loops

    return (
        <>
            <Script id="google-ads-conversion" strategy="afterInteractive">
                {`
        (function() {
          function sendConversion() {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'conversion', {
                'send_to': 'AW-17863886225/vCjPCPmzrOYbEJGLlcZC'
                ${amount ? `, 'value': ${(amount / 100).toFixed(2)}` : ""}
                ${currency ? `, 'currency': '${currency}'` : ""}
                ${gclid ? `, 'gclid': '${gclid}'` : ""}
              });
              console.log('Google Ads conversion sent successfully');
            } else {
              console.warn('gtag not available, retrying in 100ms');
              setTimeout(sendConversion, 100);
            }
          }
          sendConversion();
        })();
      `}
            </Script>
            <div className={styles.container}>
                <Header />
                <div className={styles.contentWrapper}>
                    <IoCheckmarkCircleOutline className={styles.successIcon} />
                    
                    <h1 className={styles.title}>{t("thanks")}</h1>

                    <div className={styles.buttonWrapper}>
                        <Button
                            onClick={() => {
                                if (magicLink) {
                                    sendEvent(GTM_EVENTS.GO_TO_PLATFORM);
                                    window.location.href = magicLink;
                                }
                            }}
                            variant="primary"
                            disabled={isLoading || !magicLink}
                        >
                            {isLoading 
                                ? t("loading") || "Cargando..." 
                                : useFallback 
                                    ? t("go_to_platform_manual") || t("go_to_platform")
                                    : t("go_to_platform")
                            }
                        </Button>
                    </div>

                    <h2 className={styles.subtitle}>{t("need_help_client")}</h2>
                </div>
                <div></div>
            </div>
        </>
    );
}

export default ThanksPage;
