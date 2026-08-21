import React, { useEffect, useState } from 'react';

interface BrandProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'light' | 'dark' | 'auto';
}

export function BrandIcon({ variant = 'auto', alt = '3 Minutes for Life Icon', ...props }: BrandProps) {
  const [resolvedVariant, setResolvedVariant] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (variant !== 'auto') {
      setResolvedVariant(variant);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setResolvedVariant(e.matches ? 'dark' : 'light');
    };

    updateTheme(mediaQuery);
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [variant]);

  const src = resolvedVariant === 'dark' ? '/branding/icon-on-dark.png' : '/branding/icon-on-light.png';

  return <img src={src} alt={alt} {...props} />;
}
