export interface CreateSubscriptionPayload {
  customerId: string;
  priceId: string;
  ip_address?: string;
  // Datos de geolocalización para metadata
  geo_country?: string;
  geo_state?: string;
  geo_city?: string;
  geo_postal?: string;
  // Google Ads Click ID para tracking
  gclid?: string;
  // Stripe Radar Session ID para mejorar la detección de fraude
  radar_session_id?: string;
}
