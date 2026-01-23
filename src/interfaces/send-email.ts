import { Locale } from "@/locales/config";

export interface SendEmailPayload {
  email: string;
  name: string;
  token: string;
  amount: number;
  currency: string;
  lng: Locale;
  customerId?: string;
}
