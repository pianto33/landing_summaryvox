/**
 * Genera y gestiona un UUID único por sesión del navegador
 * para trackear todos los logs de un mismo usuario
 */

const SESSION_ID_KEY = 'app_session_id';

/**
 * Genera un UUID v4 simple
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Obtiene o crea el sessionId
 * Se guarda en sessionStorage para que persista solo durante la sesión del navegador
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server'; // En el servidor no hay sesión de navegador
  }

  try {
    // Intentar obtener de sessionStorage
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      // Si no existe, generar uno nuevo
      sessionId = generateUUID();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Si sessionStorage no está disponible (navegación privada extrema)
    console.warn('SessionStorage no disponible, usando sessionId temporal');
    return 'temp-' + generateUUID();
  }
}

/**
 * Obtiene solo los primeros 8 caracteres del sessionId para logs más compactos
 */
export function getShortSessionId(): string {
  return getSessionId().substring(0, 8);
}

/**
 * Fuerza la creación de un nuevo sessionId (útil para testing)
 */
export function resetSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  try {
    const newSessionId = generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, newSessionId);
    return newSessionId;
  } catch {
    return 'temp-' + generateUUID();
  }
}

