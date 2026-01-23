export type Locale = (typeof locales)[number];

export const locales = ["es", "pt", "it", "pl", "hu", "cz"] as const;
export const defaultLocale: Locale = "es";
