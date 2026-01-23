import { useRouter } from "next/router";
import { STRIPE_DATA, PRICE_ID } from "@/constants";

export const useStripeData = () => {
    const router = useRouter();
    
    // Primero verificar si hay un query param ?pr=test
    const priceParam = router.query.pr?.toString().toUpperCase();
    if (priceParam && STRIPE_DATA[priceParam]) {
        return STRIPE_DATA[priceParam];
    }

    const countryCode =
        typeof router.query.countryCode === "string"
            ? router.query.countryCode.toUpperCase()
            : "";

    // Manejar rutas especiales como /pt-meo
    if (router.asPath === "/pt-meo" || router.asPath.includes("/pt-meo")) {
        return STRIPE_DATA["PT_MEO"] || STRIPE_DATA.DEFAULT;
    }

    return STRIPE_DATA[countryCode] || STRIPE_DATA.DEFAULT;
};

export const usePriceId = () => {
    const router = useRouter();
    
    const priceParam = router.query.pr?.toString().toUpperCase();
    if (priceParam && PRICE_ID[priceParam]) {
        return PRICE_ID[priceParam];
    }

    const countryCode = router.query.countryCode?.toString().toUpperCase() || "DEFAULT";

    if (router.asPath === "/pt-meo" || router.asPath.includes("/pt-meo")) {
        return PRICE_ID.PT_MEO;
    }

    return PRICE_ID[countryCode] || PRICE_ID.DEFAULT;
};
