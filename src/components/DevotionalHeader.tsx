import { BrandLogo } from './BrandLogo';

interface DevotionalHeaderProps {
  showLogo?: boolean;
  onBack?: () => void;
  backText?: string;
}

export function DevotionalHeader({ showLogo = true, onBack, backText }: DevotionalHeaderProps) {
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
        <BrandLogo
          variant="light"
          alt="3 Minutes for Life"
          className="devotional-logo"
        />
      )}
    </header>
  );
}
