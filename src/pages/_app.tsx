import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Script from "next/script";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Analytics } from "@vercel/analytics/react";
import UserProvider from "@/contexts/user/user-provider";
import Layout from "@/components/Layout";
import { useMemo } from "react";
import { useStripeData } from "@/hooks/useStripeData";
import "@/locales/i18n";

// Mover esto fuera del componente para que solo se cree una vez
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ""
);

export default function App({ Component, pageProps }: AppProps) {
  const { currency } = useStripeData();
  const options = useMemo<StripeElementsOptions>(
    () => ({
      mode: "subscription",
      amount: 0,
      currency,
      appearance: { disableAnimations: true },
      setup_future_usage: "off_session",
      // paymentMethodTypes: ["card"], // ← QUITADO: bloqueaba Google Pay y Apple Pay
    }),
    [currency]
  );

  return (
    <>
      {/* Google Tag Manager y Analytics - afterInteractive para que carguen rápido (necesario para conversiones) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17863886225"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17863886225');
        `}
      </Script>

      <Script id="google-tag-manager" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_CODE}');`}
      </Script>
      <Elements stripe={stripePromise} options={options}>
        <UserProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </UserProvider>
      </Elements>
      <Analytics />
    </>
  );
}
