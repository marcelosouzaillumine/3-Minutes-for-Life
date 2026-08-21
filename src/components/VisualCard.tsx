import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface VisualCardProps {
  title: string;
  quote: string;
}

/**
 * Wraps the quote with proper typographic curly quotes, but only if
 * the content doesn't already start/end with a quote character.
 */
function wrapWithQuotes(text: string): string {
  const trimmed = text.trim();
  const startsWithQuote = trimmed.startsWith('"') || trimmed.startsWith('"') || trimmed.startsWith('"');
  const endsWithQuote   = trimmed.endsWith('"')   || trimmed.endsWith('"')   || trimmed.endsWith('"');
  if (startsWithQuote && endsWithQuote) return trimmed;
  return `\u201C${trimmed}\u201D`; // " … "
}

export const VisualCard = forwardRef<HTMLDivElement, VisualCardProps>(
  ({ title, quote }, ref) => {
    const { t } = useTranslation('common');

    const quoteFinal = wrapWithQuotes(quote);

    return (
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -9999 }}>
        <div
          ref={ref}
          style={{
            width: '1080px',
            height: '1350px',
            backgroundColor: '#FAFAFA',
            color: '#1a1a1a',
            padding: '140px 120px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            boxSizing: 'border-box'
          }}
        >

          {/* ── HEADER — typographic brand mark ── */}
          <div
            style={{
              fontSize: '18px',
              textTransform: 'uppercase',
              letterSpacing: '0.20em',
              color: '#999999',
              fontWeight: 500,
              marginBottom: '48px'
            }}
          >
            {t('visualCard.header', { defaultValue: '3 MINUTES FOR LIFE' })}
          </div>

          {/* ── TITLE — primary visual element ── */}
          <h1
            style={{
              fontFamily: '"Georgia", serif',
              // título adaptativo
              ...(() => {
                const len = title.length;
                if (len < 35) return { fontSize: '82px', lineHeight: '1.1', marginBottom: '36px', maxWidth: '95%' };
                if (len < 55) return { fontSize: '76px', lineHeight: '1.12', marginBottom: '36px', maxWidth: '96%' };
                if (len < 80) return { fontSize: '70px', lineHeight: '1.14', marginBottom: '36px', maxWidth: '98%' };
                if (len < 110) return { fontSize: '58px', lineHeight: '1.26', marginBottom: '36px', maxWidth: '100%' };
                return { fontSize: '52px', lineHeight: '1.30', marginBottom: '36px', maxWidth: '100%' };
              })(),
              color: '#000000',
              letterSpacing: '-0.02em',
              flexShrink: 0,
              margin: '0 0 36px 0'
            }}
          >
            {title}
          </h1>

          {/* ── DIVIDER — thin editorial rule ── */}
          <div
            style={{
              width: '80px',
              height: '1px',
              backgroundColor: '#CCCCCC',
              marginBottom: '40px',
              flexShrink: 0
            }}
          />

          {/* ── QUOTE — editorial citation ── */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
            <p
              style={{
  fontFamily: '"Georgia", serif',
  fontSize: '40px',
  fontWeight: 400,
  fontStyle: 'italic',
  lineHeight: 1.45,
  color: '#2a2a2a',
  maxWidth: '860px',
  margin: 0,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
}}
            >
              {quoteFinal}
            </p>
          </div>

          {/* ── FOOTER — minimal brand identification ── */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '60px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                fontSize: '22px',
                fontWeight: 500,
                color: '#1a1a1a',
                letterSpacing: '0.01em',
              }}
            >
              {t('visualCard.footer', { defaultValue: 'Pare. Reflita. Pratique.' })}
            </span>
            <span
              style={{
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                fontSize: '18px',
                fontWeight: 400,
                color: '#999999',
                letterSpacing: '0.01em',
              }}
            >
              3minutesforlife.com
            </span>
          </div>

        </div>
      </div>
    );
  }
);
