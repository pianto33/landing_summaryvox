export interface CreateSubscriptionPayload {
  customerId: string;
  priceId: string;
  ip_address?: string;
  geo_country?: string;
  geo_state?: string;
  geo_city?: string;
  geo_postal?: string;
  fbclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
  radar_session_id?: string;
}
