import React, { useEffect, useState } from 'react';
import { getBranding, onBrandingReady } from '../lib/branding';

interface BrandProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'light' | 'dark' | 'auto';
}

export function BrandLogo({
  variant = 'auto',
  alt = '3 Minutes for Life Logo',
  style,
  ...props
}: BrandProps) {
  /**
   * ============================================================
   * RESOLVE VARIANT
   * ============================================================
   *
   * light → logo para fundo claro
   * dark  → logo para fundo escuro
   * auto  → segue o tema do sistema
   */

  const [resolvedVariant, setResolvedVariant] =
    useState<'light' | 'dark'>(
      variant === 'dark'
        ? 'dark'
        : 'light'
    );

  useEffect(() => {
    /*
     * Variante explícita
     */
    if (variant === 'light') {
      setResolvedVariant('light');
      return;
    }

    if (variant === 'dark') {
      setResolvedVariant('dark');
      return;
    }

    /*
     * Variante automática
     */
    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    const updateTheme = (
      event?: MediaQueryListEvent
    ) => {
      const matches =
        event?.matches ??
        mediaQuery.matches;

      setResolvedVariant(
        matches ? 'dark' : 'light'
      );
    };

    updateTheme();

    mediaQuery.addEventListener(
      'change',
      updateTheme
    );

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateTheme
      );
    };
  }, [variant]);

  /**
   * ============================================================
   * SOURCE
   * ============================================================
   *
   * Tenants com whitelabel podem configurar um logoUrl próprio
   * (GET /tenants/by-slug/:slug). A API não distingue light/dark
   * para o logo custom — quando existe, usamos o mesmo para as duas
   * variantes; sem ele, caímos nos assets padrão claro/escuro.
   */

  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(
    getBranding()?.logoUrl ?? null
  );

  useEffect(() => {
    let cancelled = false;
    onBrandingReady().then(() => {
      if (!cancelled) setTenantLogoUrl(getBranding()?.logoUrl ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const src =
    tenantLogoUrl ??
    (resolvedVariant === 'dark'
      ? '/branding/logo-on-dark.png'
      : '/branding/logo-on-light.png');

  /**
   * ============================================================
   * RENDER
   * ============================================================
   *
   * IMPORTANTE:
   *
   * Não definimos width/height aqui.
   *
   * O tamanho deve ser determinado pelo componente/página
   * que utiliza a logo.
   *
   * Isso permite:
   *
   * <BrandLogo style={{ width: '160px' }} />
   *
   * ou
   *
   * <BrandLogo className="..." />
   *
   * sem que BrandLogo sobrescreva essas definições.
   */

  const baseStyle: React.CSSProperties = {
    display: 'block',
  };

  if (!props.className) {
    baseStyle.height = 'auto';
    baseStyle.maxWidth = '100%';
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      style={{
        ...baseStyle,
        ...style,
      }}
    />
  );
}