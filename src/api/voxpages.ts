import { logger } from "@/utils/logger";

const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || "https://summaryvox.com";

export interface GenerateTokenPayload {
  email: string;
  customerId: string;
  name?: string;
}

export interface GenerateTokenResponse {
  success: boolean;
  token: string;
  noExpiration: boolean;
  tokenId: string;
}

/**
 * Genera un token de auto-login para summaryvox
 * El sistema crea automáticamente el usuario si no existe
 */
export const generateAutoLoginToken = async (
  email: string,
  customerId: string,
  name?: string
): Promise<string> => {
  try {
    const response = await fetch(
      `${platformUrl}/api/auth/generate-auto-login-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          customerId,
          name: name || email.split("@")[0],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success || !data.token) {
      throw new Error(data.error || "Error al generar token");
    }

    return data.token;
  } catch (error) {
    logger.error("Error generating auto-login token", error, {
      email,
      customerId,
    });
    throw new Error("create_user");
  }
};

export interface GenerateUnsubscribeTokenResponse {
  success: boolean;
  token: string;
  unsubscribeUrl: string;
  tokenId: string;
}

/**
 * Genera un token de desuscripción para summaryvox
 */
export const generateUnsubscribeToken = async (
  email: string,
  customerId?: string
): Promise<string> => {
  try {
    const response = await fetch(
      `${platformUrl}/api/auth/generate-unsubscribe-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          customerId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success || !data.token) {
      throw new Error(data.error || "Error al generar token de desuscripción");
    }

    return data.token;
  } catch (error) {
    logger.error("Error generating unsubscribe token", error, {
      email,
      customerId,
    });
    throw new Error("Error al generar token de desuscripción");
  }
};

/**
 * Obtiene la URL completa de auto-login para redirigir al usuario
 * @param email Email del usuario
 * @param customerId ID único del cliente (ej: Stripe customer ID)
 * @param name Nombre del usuario (opcional)
 * @param locale Idioma de la plataforma (default: 'es')
 */
export const getMagicLink = async (
  email: string,
  customerId?: string,
  name?: string,
  locale: string = "es"
): Promise<string> => {
  try {
    // Si no se proporciona customerId, usar el email como identificador único
    const finalCustomerId = customerId || `email_${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
    
    const token = await generateAutoLoginToken(email, finalCustomerId, name);
    
    // Construir URL de auto-login
    const autoLoginUrl = `${platformUrl}/${locale}/auto-login?token=${encodeURIComponent(token)}`;
    
    return autoLoginUrl;
  } catch (error) {
    logger.error("Error getting magic link", error, {
      email,
      customerId,
      locale,
    });
    throw error;
  }
};
