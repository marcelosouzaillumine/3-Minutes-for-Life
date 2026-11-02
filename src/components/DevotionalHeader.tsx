import { useEffect, useState } from 'react';
import { getBranding, onBrandingReady } from '../lib/branding';

interface DevotionalHeaderProps {
  showLogo?: boolean;
  onBack?: () => void;
  backText?: string;
}

const DEFAULT_ICON = '/branding/icon-on-dark.png';

/** Barra fina com só o símbolo da marca, no centro; o Voltar fica na ponta esquerda. */
export function DevotionalHeader({ showLogo = true, onBack, backText }: DevotionalHeaderProps) {
  const [icon, setIcon] = useState<string>(getBranding()?.iconUrl ?? DEFAULT_ICON);
  useEffect(() => {
    let cancelled = false;
    onBrandingReady().then(() => { if (!cancelled) setIcon(getBranding()?.iconUrl ?? DEFAULT_ICON); });
    return () => { cancelled = true; };
  }, []);
  return (
    <header className="devotional-header">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="devotional-back"
          aria-label={backText || 'Voltar'}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>{backText || 'Voltar'}</span>
        </button>
      )}
      {showLogo && (
        <img src={icon} alt="3 Minutes for Life" className="devotional-logo" onError={() => setIcon(DEFAULT_ICON)} />
      )}
    </header>
  );
}
