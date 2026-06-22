import { useCallback } from 'react';

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, data?: any) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://rainguard-oracle.onrender.com';
    fetch(`${API_BASE_URL}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, ...data })
    }).catch(e => console.warn('Analytics logging failed', e));
  }, []);

  return { trackEvent };
}
