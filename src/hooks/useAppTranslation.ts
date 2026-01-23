import { useRouter } from "next/router";
import { useTranslation, UseTranslationOptions } from "react-i18next";
import { defaultLocale, Locale } from "@/locales/config";

interface UseAppTranslationOptions<T = string>
  extends UseTranslationOptions<T> {
  defaultLng?: string;
}

export function useAppTranslation(
  namespace: string = "common",
  options: UseAppTranslationOptions = {}
) {
  const router = useRouter();
  const lng = (router.query.countryCode as Locale) || defaultLocale;

  const translation = useTranslation(namespace, { lng, ...options });

  return { ...translation, lng };
}
