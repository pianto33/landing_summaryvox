export type Status =
  | "canceled"
  | "processing"
  | "requires_action"
  | "requires_capture"
  | "requires_confirmation"
  | "requires_payment_method"
  | "succeeded";

export interface GetPaymentIntentPayload {
  intentId: string;
  clientSecret: string;
}

export interface CreateIntentPayload {
  amount: number;
  currency: string;
  automatic_payment_methods: any;
  email?: string;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
}

export interface CreateSubscriptionResponse {
  clientSecret: string | null;
}

export interface PaymentIntentResponse {
  id: string;
  object: string;
  amount: number;
  amount_capturable: number;
  amount_details: AmountDetails;
  amount_received: number;
  application: any;
  application_fee_amount: any;
  automatic_payment_methods: AutomaticPaymentMethods;
  canceled_at: any;
  cancellation_reason: any;
  capture_method: string;
  client_secret: string;
  confirmation_method: string;
  created: number;
  currency: string;
  customer: any;
  description: any;
  invoice: any;
  last_payment_error: any;
  latest_charge: any;
  livemode: boolean;
  metadata: any;
  next_action: any;
  on_behalf_of: any;
  payment_method: any;
  payment_method_options: PaymentMethodOptions;
  payment_method_types: string[];
  processing: any;
  receipt_email: string;
  review: any;
  setup_future_usage: any;
  shipping: any;
  source: any;
  statement_descriptor: any;
  statement_descriptor_suffix: any;
  status: Status;
  transfer_data: any;
  transfer_group: any;
}

export interface AmountDetails {
  tip: any;
}

export interface AutomaticPaymentMethods {
  enabled: boolean;
}

export interface PaymentMethodOptions {
  card: Card;
  link: Link;
}

export interface Card {
  installments: any;
  mandate_options: any;
  network: any;
  request_three_d_secure: string;
}

export interface Link {
  persistent_token: any;
}
