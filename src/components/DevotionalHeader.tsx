import { BrandLogo } from './BrandLogo';

interface DevotionalHeaderProps {
  showLogo?: boolean;
  /** Capa só com tipografia (Hoje): a marca no topo, a categoria e o título grande na mesma faixa escura. */
  cover?: { eyebrow: string; title: string };
  onBack?: () => void;
  backText?: string;
}

export function DevotionalHeader({ showLogo = true, cover, onBack, backText }: DevotionalHeaderProps) {
  return (
    <header className={`devotional-header${cover ? ' devotional-header--cover' : ''}`}>
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
          variant="dark"
          alt="3 Minutes for Life"
          className="devotional-logo"
        />
      )}
      {cover && (
        <div className="devotional-cover">
          <span className="devotional-cover__eyebrow">{cover.eyebrow}</span>
          <h1 className="devotional-cover__title">{cover.title}</h1>
        </div>
      )}
    </header>
  );
}
