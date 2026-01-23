declare global {
  interface Window {
    dataLayer: any[];
  }
}

interface EventParams {
  [key: string]: any;
}

export const sendEvent = (eventName: string, eventParams?: EventParams) => {
  if (typeof window === 'undefined') return;
  
  // Inicializar dataLayer si no existe (por si GTM no cargó todavía)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventParams,
  });
};
