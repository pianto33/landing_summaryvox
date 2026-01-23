export const GENERAL = {
    WHATSAPP_URL: "https://api.whatsapp.com/send?phone=54912341234",
};

export const GTM_EVENTS = {
    STRIPE_CLICK: "stripe_click",
    STRIPE_CLICK_FAIL: "stripe_click_fail",
    STRIPE_CANCEL: "stripe_cancel",
    GO_TO_PLATFORM: "go_to_platform",
    PAYMENT_SUCCEDED: "payment_succeded",
    PAYMENT_FAILED: "payment_failed",
};

interface StripeData {
    amount: number;
    currency: string;
}

interface StripeDataMap extends Partial<Record<string, StripeData>> {
    DEFAULT: StripeData;
}

export const PRICE_ID: Record<string, string> = {
    AR: "price_1SZeAgFyTQZ6pCTOaBzgTesl",
    ES: "price_1SZe97FyTQZ6pCTOQBUf0Lj3",
    PL: "price_1SpLkdFyTQZ6pCTOPPB7IfRB",
    TEST: "price_1SVOcnFyTQZ6pCTOn86cHdp1",
    QA: "price_1SOWhTFzcCyAwI5PaxxJ6KP1",
    DEFAULT: "price_1SZdUaFyTQZ6pCTOsKu8mX7V",
};

export const STRIPE_DATA: StripeDataMap = {
    TEST: {
        amount: 100, // 1.00 USD
        currency: "usd",
    },
    QA: {
        amount: 999, // 9.99 USD
        currency: "usd",
    },
    ES: {
        amount: 1999, // 19.99 EUR
        currency: "eur",
    },
    PL: {
        amount: 5900, // 59.00 PLN ~ 14.00 EUR
        currency: "pln",
    },
    AR: {
        amount: 100, // 1 ARS
        currency: "ars",
    },
    DEFAULT: {
        amount: 2000, // 20.00 EUR
        currency: "eur",
    },
};
