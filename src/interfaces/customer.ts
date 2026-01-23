export interface CreateCustomerPayload {
  name?: string;
  email?: string;
  // Datos de geolocalización para Stripe Radar
  country?: string;
  state?: string;
  city?: string;
  postal?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerResponse {
  customer: string;
}
