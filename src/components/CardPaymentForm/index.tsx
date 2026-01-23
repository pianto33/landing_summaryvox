import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  createCustomer,
  createSubscription,
  checkSubscriptions,
  checkCustomer,
} from "@/api/stripe";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { logger } from "@/utils/logger";
import { fetchIPData } from "@/services/trackingService";
import { extractTrackingParams, saveTrackingParams, addTrackingParams, getTrackingParams } from "@/utils/trackingParams";
import Button from "@/components/Button";
import styles from "@/styles/CardPaymentForm.module.css";

interface Props {
  label: string;
  priceId: string;
  animateButton?: boolean;
  amount: number;
  currency: string;
}

const ArrowSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="42"
    height="21"
    fill="none"
    viewBox="0 0 22 21"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeMiterlimit="10"
      strokeWidth="3"
      d="M2 2l7.53 7.413a1.491 1.491 0 010 2.174L2 19"
    ></path>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeMiterlimit="10"
      strokeWidth="3"
      d="M13 2l6.588 7.413c.55.593.55 1.581 0 2.174L13 19"
    ></path>
  </svg>
);

function CardPaymentForm({ label, priceId, animateButton, amount, currency }: Props) {
  const { t } = useAppTranslation();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const getIPAddress = async () => {
      try {
        const ipData = await fetchIPData();
        if (ipData.ip) {
          setIpAddress(ipData.ip);
        }
      } catch (error) {
        logger.warn("Error obteniendo IP en cliente", {
          context: "CardPaymentForm - IP Fetch",
          error,
        });
      }
    };

    // Guardar parámetros de tracking (gclid, utm_*, etc.)
    const trackingParams = extractTrackingParams(router.query);
    if (Object.keys(trackingParams).length > 0) {
      saveTrackingParams(trackingParams);
      logger.info("Parámetros de tracking capturados", trackingParams);
    }

    getIPAddress();
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage(t("error.stripe"));
      return;
    }

    if (!email) {
      setErrorMessage(t("error.email"));
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(
          t("error.submit", { error: submitError.message || "Desconocido" })
        );
        setIsProcessing(false);
        return;
      }

      const name = email.split("@")[0];
      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("paymentAmount", amount.toString());
      localStorage.setItem("paymentCurrency", currency);

      let customerId: string | null = null;
      try {
        customerId = await checkCustomer(email);

        if (!customerId) {
          customerId = await createCustomer({ name, email });
        }

        // Guardar customerId en localStorage para uso en thanks/error pages
        if (customerId) {
          localStorage.setItem("customerId", customerId);
        }

        const hasActiveSubscriptions = await checkSubscriptions(customerId);
        if (hasActiveSubscriptions) {
          logger.info("Intento de suscripción duplicada detectado", {
            email,
            customerId,
            context: "CardPaymentForm - Usuario con suscripción activa",
          });
          setErrorMessage(t("error.existing_subscription"));
          router.push(
            `/${router.query.countryCode}/error?error=existing_subscription`
          );
          setIsProcessing(false);
          return;
        }
      } catch (error) {
        logger.error("Error checking/creating customer", error, {
          context: "CardPaymentForm - Customer Creation",
          email,
          priceId,
        });
        setErrorMessage(t("error.create_customer"));
        setIsProcessing(false);
        return;
      }

      // Obtener parámetros de tracking (gclid, etc.)
      const trackingParams = getTrackingParams();

      // 🎯 CREAR RADAR SESSION para mejorar la detección de fraude de Stripe
      // Según https://docs.stripe.com/radar/radar-session
      let radarSessionId: string | undefined;
      try {
        const { radarSession, error: radarError } = await stripe.createRadarSession();
        if (radarError) {
          logger.warn("Error creando Radar Session", { error: radarError });
        } else if (radarSession) {
          radarSessionId = radarSession.id;
          logger.info("Radar Session creado exitosamente", {
            sessionId: radarSessionId,
          });
        }
      } catch (radarErr) {
        // No bloquear el checkout si falla Radar Session
        logger.warn("Excepción al crear Radar Session", { error: radarErr });
      }

      const { clientSecret: subscriptionSecret } = await createSubscription({
        customerId,
        priceId,
        ip_address: ipAddress || undefined,
        gclid: trackingParams.gclid || undefined, // Google Ads Click ID
        radar_session_id: radarSessionId, // Radar Session para detección de fraude
      });

      // Construir return_url con parámetros de tracking preservados
      const baseReturnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${router.query.countryCode}/pending?payment_intent=${subscriptionSecret}`;
      const returnUrl = addTrackingParams(baseReturnUrl, trackingParams);

      const { error } = await stripe.confirmSetup({
        elements,
        clientSecret: subscriptionSecret || "",
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        setErrorMessage(
          t("error.confirm_setup", { error: error.message || "Desconocido" })
        );
        setIsProcessing(false);
      }
    } catch (error: any) {
      // card_error = problema del usuario (tarjeta rechazada, robada, etc.) -> warn
      // otros tipos = error del sistema -> error
      const logData = {
        context: "CardPaymentForm",
        email,
        priceId,
        errorMessage: error.message,
        stripeErrorType: error.type,
        stripeErrorCode: error.code,
        stripeDeclineCode: error.decline_code,
      };
      
      if (error.type === 'card_error') {
        logger.warn("Tarjeta rechazada en CardPaymentForm", error, logData);
      } else {
        logger.error("ERROR Card Form Submit", error, logData);
      }
      
      setErrorMessage(
        t("error.general", { error: error.message || "Error desconocido" })
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.emailField}>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email_placeholder") || "tu@email.com"}
            required
            className={styles.input}
          />
        </div>
        
        <div className={styles.paymentElement}>
          {/* 
            Solo tarjeta de crédito/débito (sin wallets ni otros métodos)
            Para restringir a SOLO Visa/Mastercard, configurar en Stripe Dashboard:
            Settings → Payment methods → Card brands
          */}
          <PaymentElement
            options={{
              layout: "tabs",
              fields: {
                billingDetails: {
                  address: "auto",
                },
              },
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={isProcessing || !stripe}
          animate={animateButton}
          endIcon={!isProcessing ? <ArrowSvg /> : null}
        >
          {isProcessing ? t("processing") || "Procesando..." : label}
        </Button>

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}
      </form>
    </div>
  );
}

export default CardPaymentForm;

