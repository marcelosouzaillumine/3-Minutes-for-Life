import React, { useEffect, useState } from 'react';

interface BrandProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'light' | 'dark' | 'auto';
}

export function BrandLogo({
  variant = 'auto',
  alt = '3 Minutes for Life Logo',
  ...props
}: BrandProps) {
  /**
   * Para variantes explícitas, a escolha é determinada imediatamente.
   * Isso evita que a logo errada apareça durante a inicialização.
   *
   * - light → logo para fundo claro
   * - dark  → logo para fundo escuro
   * - auto  → segue a preferência de tema do sistema
   */
  const [resolvedVariant, setResolvedVariant] = useState<'light' | 'dark'>(
    variant === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    // Variante explícita: não depende do tema do dispositivo.
    if (variant === 'light') {
      setResolvedVariant('light');
      return;
    }

    if (variant === 'dark') {
      setResolvedVariant('dark');
      return;
    }

    // Variante "auto": segue a preferência do sistema.
    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    const updateTheme = (
      event: MediaQueryListEvent | MediaQueryList
    ) => {
      setResolvedVariant(event.matches ? 'dark' : 'light');
    };

    // Define o estado inicial de acordo com o sistema.
    updateTheme(mediaQuery);

    // Continua acompanhando mudanças no tema do sistema.
    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [variant]);

  const src =
    resolvedVariant === 'dark'
      ? '/branding/logo-on-dark.png'
      : '/branding/logo-on-light.png';

  return (
    <img
      src={src}
      alt={alt}
      {...props}
    />
  );
} 