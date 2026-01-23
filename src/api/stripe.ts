import { GetPaymentIntentPayload } from "@/interfaces/payment-intent";
import {
  CreateIntentPayload,
  CreatePaymentIntentResponse,
  CreateSubscriptionResponse,
  type PaymentIntentResponse,
} from "@/interfaces/payment-intent";
import { CreateCustomerPayload } from "@/interfaces/customer";
import { CreateSubscriptionPayload } from "@/interfaces/subscription";

export const getPaymentIntent = async ({
  intentId,
  clientSecret,
}: GetPaymentIntentPayload) => {
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${intentId}?client_secret=${clientSecret}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY}`,
      },
    }
  );

  const data = await response.json();

  // La API de Stripe devuelve { error: { message: "..." } }
  if (data.error) {
    const errorMessage = typeof data.error === 'string' ? data.error : data.error.message || 'Error desconocido en getPaymentIntent';
    throw new Error(errorMessage);
  }

  return data as PaymentIntentResponse;
};

export const createPaymentIntent = async (payload: CreateIntentPayload) => {
  const response = await fetch("/api/create-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    const errorMessage = typeof data.error === 'string' ? data.error : data.error.message || 'Error desconocido en createPaymentIntent';
    throw new Error(errorMessage);
  }

  return data as CreatePaymentIntentResponse;
};

export const createCustomer = async (payload: CreateCustomerPayload) => {
  const response = await fetch("/api/create-customer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    const errorMessage = typeof data.error === 'string' ? data.error : data.error.message || 'Error desconocido en createCustomer';
    throw new Error(errorMessage);
  }

  return data.id as string;
};

export const createSubscription = async (
  payload: CreateSubscriptionPayload
) => {
  let response: Response;
  
  try {
    response = await fetch("/api/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (fetchError: any) {
    throw new Error(`Error de red en createSubscription: ${fetchError.message || 'fetch failed'}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonError: any) {
    throw new Error(`Error parseando respuesta de createSubscription (status ${response.status}): ${jsonError.message || 'JSON parse failed'}`);
  }

  // El servidor devuelve { error: "mensaje" } (string), no { error: { message: "mensaje" } }
  if (data.error) {
    const errorMessage = typeof data.error === 'string' ? data.error : data.error.message || 'Error desconocido en createSubscription';
    throw new Error(errorMessage);
  }

  return data as CreateSubscriptionResponse;
};

export const checkSubscriptions = async (customerId: string) => {
  const response = await fetch("/api/check-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId }),
  });

  const data = await response.json();

  if (data.error) throw new Error(data.error);

  return data.hasActiveSubscriptions as boolean;
};

export const checkCustomer = async (email: string) => {
  const response = await fetch("/api/check-customer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (data.error) throw new Error(data.error);

  return data.customerId as string | null;
};
