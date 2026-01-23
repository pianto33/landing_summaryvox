import { useState, useEffect } from "react";
import { NextRouter, useRouter } from "next/router";
import {
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";
import {
  createCustomer,
  createSubscription,
  checkSubscriptions,
  checkCustomer,
} from "@/api/stripe";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { sendEvent } from "@/utils/gtm";
import { GTM_EVENTS, PRICE_ID } from "@/constants";
import { fetchIPData } from "@/services/trackingService";
import { logger } from "@/utils/logger";
import { clientLogger } from "@/utils/clientLogger";
import { extractTrackingParams, saveTrackingParams, addTrackingParams, getTrackingParams } from "@/utils/trackingParams";
import Button from "@/components/Button";
import CardPaymentForm from "@/components/CardPaymentForm";
import styles from "@/styles/StripeExpressCheckout.module.css";

interface Props {
  label: string;
  animateButton?: boolean;
  amount: number;
  currency: string;
}

const ArrowSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={styles.arrow}
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

// Helper para detectar bots (Vercel, Lighthouse, crawlers, etc.)
const isBot = () => {
  if (typeof navigator === 'undefined') return true;
  const userAgent = navigator.userAgent;
  return /bot|crawler|spider|lighthouse|vercel|prerender|headless/i.test(userAgent);
};

const getPriceId = (router: NextRouter) => {
  // Primero verificar si hay un query param ?pr=test
  const priceParam = router.query.pr?.toString().toUpperCase();
  if (priceParam && PRICE_ID[priceParam]) {
    return PRICE_ID[priceParam];
  }

  const countryCode =
    router.query.countryCode?.toString().toUpperCase() || "DEFAULT";

  // Manejar rutas especiales como /pt-meo
  if (router.asPath === "/pt-meo" || router.asPath.includes("/pt-meo")) {
    return PRICE_ID.PT_MEO;
  }

  return PRICE_ID[countryCode] || PRICE_ID.DEFAULT;
};

function StripeExpressCheckout({ label, animateButton, amount, currency }: Props) {
  const { t } = useAppTranslation();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [isStripeReady, setisStripeReady] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<{
    country: string | null;
    state: string | null;
    city: string | null;
    postal: string | null;
  } | null>(null);
  const [loadingState, setLoadingState] = useState<{
    ready: boolean;
    error: string | null;
    availableMethods: any;
    readyTime: number | null;
    renderTime: number;
  }>({
    ready: false,
    error: null,
    availableMethods: null,
    readyTime: null,
    renderTime: Date.now(),
  });
  const priceId = getPriceId(router);
  
  // Detectar ambiente: link disponible solo en QA/desarrollo, never en producci?n
  const isProduction = process.env.NODE_ENV === 'production' && 
                       !process.env.NEXT_PUBLIC_BASE_URL?.includes('localhost') &&
                       !process.env.NEXT_PUBLIC_BASE_URL?.includes('qa') &&
                       !process.env.NEXT_PUBLIC_BASE_URL?.includes('staging');
  
  // Detectar si estamos en QA para mostrar formulario de tarjeta
  const isQA = process.env.NEXT_PUBLIC_BASE_URL?.includes('qa') || 
               process.env.NEXT_PUBLIC_BASE_URL?.includes('staging') ||
               process.env.NEXT_PUBLIC_BASE_URL?.includes('localhost');

  // Obtener la IP y datos de geolocalizaci?n para Stripe Radar
  useEffect(() => {
    const getIPAddress = async () => {
      try {
        const ipData = await fetchIPData();
        if (ipData.ip) {
          setIpAddress(ipData.ip);
          // Guardar datos de geolocalizaci?n para enviar a Stripe Radar
          setGeoData({
            country: ipData.country,
            state: ipData.state,
            city: ipData.city,
            postal: ipData.postal,
          });
          if (!isBot()) {
            logger.info("Datos de geolocalizaci?n obtenidos para Stripe Radar", {
              country: ipData.country,
              city: ipData.city,
              hasPostal: !!ipData.postal,
            });
          }
        }
      } catch (error) {
        if (!isBot()) {
          logger.warn("Error obteniendo IP en cliente", { error });
        }
      }
    };

    // Guardar par?metros de tracking (gclid, utm_*, etc.)
    const trackingParams = extractTrackingParams(router.query);
    if (Object.keys(trackingParams).length > 0) {
      saveTrackingParams(trackingParams);
      if (!isBot()) {
        logger.info("Par?metros de tracking capturados", trackingParams);
      }
    }

    getIPAddress();
  }, [router.query]);

  // Timeout detector: logear si Stripe no carga en 10 segundos
  useEffect(() => {
    if (isBot() || isQA) return; // Solo en producci?n y usuarios reales
    
    const timeoutId = setTimeout(() => {
      if (!loadingState.ready && !loadingState.error) {
        clientLogger.warn('Stripe Express Checkout no carg? despu?s de 10 segundos', {
          context: 'StripeExpressCheckout - timeout detector',
          loadingState: {
            ready: loadingState.ready,
            error: loadingState.error,
            timeSinceRenderMs: Date.now() - loadingState.renderTime,
          },
          stripe: !!stripe,
          elements: !!elements,
          priceId,
          countryCode: router.query.countryCode,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : null,
        });
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeoutId);
  }, [loadingState.ready, loadingState.error, isQA, stripe, elements, priceId, router.query.countryCode]);

  const onConfirm = async (e: StripeExpressCheckoutElementConfirmEvent) => {
    try {
      const email = e.billingDetails?.email || null;
      const name = e.billingDetails?.name || 
        (e.billingDetails?.email ? e.billingDetails.email.split("@")[0] : null);

      if (!email || !name) {
        const errorMsg = t("error.email");
        setErrorMessage(errorMsg);
        e.paymentFailed({ reason: "fail" });
        return;
      }

      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("paymentAmount", amount.toString());
      localStorage.setItem("paymentCurrency", currency);

      if (!stripe || !elements) {
        const errorMsg = t("error.stripe");
        setErrorMessage(errorMsg);
        e.paymentFailed({ reason: "fail" });
        return;
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        const errorMsg = t("error.submit", { error: submitError.message || "Desconocido" });
        setErrorMessage(errorMsg);
        e.paymentFailed({ reason: "fail" });
        return;
      }

      let customerId: string | null = null;
      try {
        customerId = await checkCustomer(email);

        if (!customerId) {
          // Crear customer con datos geolocalizados para Stripe Radar
          const customerPayload: any = { name, email };
          
          if (geoData) {
            customerPayload.country = geoData.country;
            customerPayload.state = geoData.state;
            customerPayload.city = geoData.city;
            customerPayload.postal = geoData.postal;
          }
          
          customerId = await createCustomer(customerPayload);
        }

        // Guardar customerId en localStorage para uso en thanks/error pages
        if (customerId) {
          localStorage.setItem("customerId", customerId);
        }

        const hasActiveSubscriptions = await checkSubscriptions(customerId);
        if (hasActiveSubscriptions) {
          if (!isBot()) {
            logger.info("Intento de suscripci?n duplicada detectado", {
              email,
              customerId,
              context: "StripeExpressCheckout - Usuario con suscripci?n activa",
            });
          }
          const errorMsg = t("error.existing_subscription");
          setErrorMessage(errorMsg);
          e.paymentFailed({ reason: "fail" });
          router.push(
            `/${router.query.countryCode}/error?error=existing_subscription`
          );
          return;
        }
      } catch (error) {
        if (!isBot()) {
          logger.error("Error checking/creating customer", error, {
            email,
          });
        }
        const errorMsg = t("error.create_customer");
        setErrorMessage(errorMsg);
        e.paymentFailed({ reason: "fail" });
        return;
      }

      // Obtener parámetros de tracking (gclid, etc.)
      const trackingParams = getTrackingParams();

      // NOTA: Stripe Radar funciona automáticamente con SetupIntent
      // No es necesario crear un RadarSession manualmente

      // Preparar datos de subscription con metadata de geolocalización y tracking
      const subscriptionPayload: any = {
        customerId,
        priceId,
        ip_address: ipAddress || undefined,
        gclid: trackingParams.gclid || undefined, // Google Ads Click ID
      };

      // Agregar datos de geolocalización para metadata
      if (geoData) {
        if (geoData.country) subscriptionPayload.geo_country = geoData.country;
        if (geoData.state) subscriptionPayload.geo_state = geoData.state;
        if (geoData.city) subscriptionPayload.geo_city = geoData.city;
        if (geoData.postal) subscriptionPayload.geo_postal = geoData.postal;
      }

      // Log antes de crear subscription (operación que puede fallar)
      if (!isBot()) {
        clientLogger.info('Creando subscription en Stripe', {
          context: 'StripeExpressCheckout - pre createSubscription',
          customerId,
          priceId,
        });
      }

      const { clientSecret: subscriptionSecret } = await createSubscription(subscriptionPayload);
      const baseReturnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${router.query.countryCode}/pending?payment_intent=${subscriptionSecret}`;
      const returnUrl = addTrackingParams(baseReturnUrl, trackingParams);

      // Construir billing_details con datos geolocalizados para Stripe Radar
      const billingDetails: any = {
        email: email,
        name: name,
      };

      // Agregar direcci?n geolocalizada solo si tenemos pa?s (requisito de Stripe)
      if (geoData?.country) {
        billingDetails.address = {
          country: geoData.country,
        };
        
        // Agregar campos opcionales si est?n disponibles
        if (geoData.state) {
          billingDetails.address.state = geoData.state;
        }
        if (geoData.city) {
          billingDetails.address.city = geoData.city;
        }
        if (geoData.postal) {
          billingDetails.address.postal_code = geoData.postal;
        }
        
        if (!isBot()) {
          logger.info("Enviando direcci?n geolocalizada a Stripe Radar", {
            country: geoData.country,
            city: geoData.city,
            hasPostal: !!geoData.postal,
          });
        }
      }

      const confirmParams: any = {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: billingDetails,
        },
      };

      // Log antes de confirmSetup (última operación crítica)
      if (!isBot()) {
        clientLogger.info('Confirmando setup de pago con Stripe', {
          context: 'StripeExpressCheckout - pre confirmSetup',
          hasClientSecret: !!subscriptionSecret,
          email: e.billingDetails?.email || 'desconocido',
        });
      }

      const { error } = await stripe.confirmSetup({
        elements,
        clientSecret: subscriptionSecret || "",
        redirect: "always",
        confirmParams,
      });

      if (error) {
        // Log específico para errores de confirmSetup
        // card_error = problema del usuario (tarjeta rechazada, robada, etc.) -> warn
        // otros tipos = error del sistema -> error
        if (!isBot()) {
          const logData = {
            context: 'StripeExpressCheckout - confirmSetup failed',
            stripeErrorCode: error.code,
            stripeErrorType: error.type,
            stripeDeclineCode: (error as any).decline_code,
            email: e.billingDetails?.email || 'desconocido',
          };
          
          if (error.type === 'card_error') {
            logger.warn('Tarjeta rechazada en stripe.confirmSetup', error, logData);
          } else {
            logger.error('Error en stripe.confirmSetup', error, logData);
          }
        }
        setErrorMessage(
          t("error.confirm_setup", { error: error.message || "Desconocido" })
        );
        e.paymentFailed({ reason: "fail" });
      }
    } catch (error: any) {
      if (!isBot()) {
        logger.error("ERROR StripeExpressCheckout onConfirm", error, {
          context: 'StripeExpressCheckout - catch general onConfirm',
          errorMessage: error?.message || 'Sin mensaje',
          errorName: error?.name || 'Sin nombre',
          errorCode: error?.code || 'Sin código',
          email: e.billingDetails?.email || 'desconocido',
          priceId,
          countryCode: router.query.countryCode,
          hasStripe: !!stripe,
          hasElements: !!elements,
        });
      }
      const errorMsg = t("error.general", { error: error.message || "Error desconocido" });
      setErrorMessage(errorMsg);
      e.paymentFailed({ reason: "fail" });
    }
  };

  const onClick = ({ resolve }: StripeExpressCheckoutElementClickEvent) => {
    console.log('[StripeExpressCheckout] Google Pay/Apple Pay clickeado - abriendo modal');
    sendEvent(GTM_EVENTS.STRIPE_CLICK);
    
    // Solo logear si no es un bot
    if (!isBot()) {
      // Log exitoso: el usuario S? tiene m?todo de pago y clicke?
      clientLogger.click('Google Pay / Apple Pay abriendo', {
        context: 'StripeExpressCheckout - onClick disparado',
        priceId,
        isProduction,
        isQA,
        countryCode: router.query.countryCode,
        path: router.asPath,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });
    }
    
    resolve({
      emailRequired: true,
      phoneNumberRequired: false,
      billingAddressRequired: false,
      applePay: {
        recurringPaymentRequest: {
          paymentDescription: "Subscription",
          managementURL: "https://voxpages.com/subscription",
          regularBilling: {
            amount: 0,
            label: "Free trial",
            recurringPaymentIntervalUnit: "month",
            recurringPaymentIntervalCount: 1,
          },
        },
      },
    });
  };

  const onReady = ({ availablePaymentMethods }: any) => {
    const readyTime = Date.now();
    setisStripeReady(true);
    setLoadingState(prev => ({
      ...prev,
      ready: true,
      availableMethods: availablePaymentMethods,
      readyTime,
    }));
    
    // Solo logear si no es un bot
    if (!isBot()) {
      // Log cuando el bot?n est? listo
      clientLogger.info('Express Checkout cargado correctamente', {
        context: 'StripeExpressCheckout - onReady',
        availablePaymentMethods,
        loadTimeMs: readyTime - loadingState.renderTime,
        priceId,
        isProduction,
        isQA,
        countryCode: router.query.countryCode,
        path: router.asPath,
        stripe: !!stripe,
        elements: !!elements,
      });
    }
  };

  const onCancel = () => {
    if (!isBot()) {
      sendEvent(GTM_EVENTS.STRIPE_CANCEL);
      clientLogger.info('Usuario cancel? el pago', {
        context: 'StripeExpressCheckout - onCancel',
      });
    }
  };

  const onLoadError = (event: any) => {
    const errorType = event?.error?.type;
    const errorMessage = event?.error?.message || 'Unknown error';
    
    // Guardar el error en el estado
    setLoadingState(prev => ({
      ...prev,
      error: `${errorType}: ${errorMessage}`,
    }));
    
    // Si es un bot, solo logear en debug, no como error crítico
    if (isBot()) {
      console.debug('[StripeExpressCheckout] Bot detectado - ignorando error de carga Stripe', {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        errorType,
      });
      return; // No enviar a logs de producción
    }
    
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    
    // Solo logear errores de usuarios reales
    clientLogger.error('Error al cargar Express Checkout Element', {
      context: 'StripeExpressCheckout - onLoadError',
      error: errorMessage,
      errorType: errorType,
      timeSinceRenderMs: Date.now() - loadingState.renderTime,
      priceId,
      isProduction,
      isQA,
      countryCode: router.query.countryCode,
      userAgent,
    });

    // Si es error de conexión API de un usuario real, investigar
    if (errorType === 'api_connection_error') {
      logger.warn('Error de conexión con Stripe API de usuario real', {
        errorMessage,
        isProduction,
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent,
      });
    }
  };

  const handleButtonClick = () => {
    // Este onClick solo se ejecuta si el ExpressCheckoutElement NO captura el evento
    // (es decir, cuando NO hay Google Pay/Apple Pay disponible)
    console.log('[StripeExpressCheckout] Click en bot?n (fallback - sin Google Pay)');
    
    if (!isBot()) {
      sendEvent(GTM_EVENTS.STRIPE_CLICK_FAIL);
      
      const now = Date.now();
      clientLogger.warn('Click en bot?n - Sin m?todo de pago disponible', {
        context: 'StripeExpressCheckout - handleButtonClick',
        
        // Estado de Stripe
        isStripeReady,
        stripe: !!stripe,
        elements: !!elements,
        
        // Diagn?stico detallado del ciclo de vida
        loadingState: {
          everReady: loadingState.ready,
          hadError: !!loadingState.error,
          errorDetails: loadingState.error,
          availableMethods: loadingState.availableMethods,
          loadTimeMs: loadingState.readyTime ? (loadingState.readyTime - loadingState.renderTime) : null,
          timeSinceRenderMs: now - loadingState.renderTime,
        },
        
        // Contexto del usuario
        priceId,
        isProduction,
        isQA,
        countryCode: router.query.countryCode,
        path: router.asPath,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        
        // Info adicional ?til
        windowSize: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight,
        } : null,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : null,
        connectionType: typeof navigator !== 'undefined' && 'connection' in navigator 
          ? (navigator as any).connection?.effectiveType 
          : null,
      });
    }
  };

  // Log solo una vez cuando el componente se monta (no en cada render)
  useEffect(() => {
    if (!isBot()) {
      clientLogger.info('StripeExpressCheckout renderizado', {
        context: 'StripeExpressCheckout - mount',
        isProduction,
        isQA,
        priceId,
        stripe: !!stripe,
        elements: !!elements,
        countryCode: router.query.countryCode,
        path: router.asPath,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        nodeEnv: process.env.NODE_ENV,
        paymentMethodsConfig: {
          applePay: isProduction ? "always" : "never",
          googlePay: isProduction ? "always" : "never",
          link: isProduction ? "never" : "auto",
        },
      });
    }
  }, []); // Solo una vez al montar

  // En QA/staging/localhost, mostrar el formulario de tarjeta de cr?dito
  if (isQA) {
    if (!isBot()) {
      clientLogger.info('Mostrando CardPaymentForm en ambiente QA', {
        context: 'StripeExpressCheckout - QA mode',
        priceId,
        countryCode: router.query.countryCode,
      });
    }
    
    return (
      <CardPaymentForm
        label={label}
        priceId={priceId}
        animateButton={animateButton}
        amount={amount}
        currency={currency}
      />
    );
  }

  return (
    <>
      <Button
        animate={animateButton}
        endIcon={<ArrowSvg />}
        onClick={handleButtonClick}
      >
        {label}
        <div
          className={`${styles.checkoutContainer} ${
            isStripeReady ? styles.loaded : ""
          }`}
        >
          <div id="checkout-page" className={styles.checkoutPage}>
            <ExpressCheckoutElement
              onClick={onClick}
              onConfirm={onConfirm}
              onReady={onReady}
              onCancel={onCancel}
              onLoadError={onLoadError}
              options={{
                paymentMethods: {
                  applePay: isProduction ? "always" : "never",
                  googlePay: isProduction ? "always" : "never",
                  link: isProduction ? "never" : "auto",
                  amazonPay: "never",
                  paypal: "never",
                },
                buttonType: {
                  applePay: "subscribe",
                  googlePay: "subscribe",
                },
                buttonTheme: {
                  applePay: "black",
                  googlePay: "black",
                },
                layout: {
                  maxColumns: 1,
                  overflow: "never",
                },
                buttonHeight: 55,
              }}
            />
          </div>
        </div>
      </Button>
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
    </>
  );
}

export default StripeExpressCheckout;
