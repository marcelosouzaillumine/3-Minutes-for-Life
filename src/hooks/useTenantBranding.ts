import { useEffect, useState } from 'react';
import { getBranding, onBrandingReady } from '../lib/branding';

/** Espera o branding do tenant carregar e força um re-render quando chega. */
export function useTenantBranding() {
  const [, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    onBrandingReady().then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  return getBranding();
}
