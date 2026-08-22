import React, { useEffect, useState } from 'react';

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
   */

  const src =
    resolvedVariant === 'dark'
      ? '/branding/logo-on-dark.png'
      : '/branding/logo-on-light.png';

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

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      style={{
        display: 'block',
        height: 'auto',
        maxWidth: '100%',
        ...style,
      }}
    />
  );
}