import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface VisualCardProps {
  title: string;
  quote: string;
}

/**
 * Computes an adaptive font size and line-height for the title
 * based on character length, so short and long titles both look
 * balanced at 1080 × 1350 px.
 */
function getTitleStyle(length: number): { fontSize: string; lineHeight: number } {
  if (length < 35)  return { fontSize: '88px', lineHeight: 1.10 };
  if (length < 55)  return { fontSize: '76px', lineHeight: 1.12 };
  if (length < 80)  return { fontSize: '64px', lineHeight: 1.20 };
  if (length < 110) return { fontSize: '54px', lineHeight: 1.25 };
  return                    { fontSize: '46px', lineHeight: 1.30 };
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

    const titleStyle = getTitleStyle(title.length);
    const quoteFinal = wrapWithQuotes(quote);

    return (
      /* Off-screen wrapper — invisible, never interactive */
      <div
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      >
        {/* ── Card root — 1080 × 1350 px ── */}
        <div
          ref={ref}
          style={{
            width: '1080px',
            height: '1350px',
            backgroundColor: '#F8F7F4',  /* warm off-white, less clinical than pure #FAFAFA */
            color: '#0a0a0a',
            padding: '120px 110px 100px 110px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Georgia", "Times New Roman", serif',
            boxSizing: 'border-box',
          }}
        >

          {/* ── HEADER — typographic brand mark ── */}
          <div style={{ marginBottom: '90px', flexShrink: 0 }}>
            <span
              style={{
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                fontSize: '22px',
                textTransform: 'uppercase',
                letterSpacing: '0.20em',
                fontWeight: 500,
                color: '#999999',
              }}
            >
              {t('visualCard.header', { defaultValue: '3 Minutos para a Vida' })}
            </span>
          </div>

          {/* ── TITLE — primary visual element ── */}
          <h1
            style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              fontSize: titleStyle.fontSize,
              lineHeight: titleStyle.lineHeight,
              fontWeight: 400,
              color: '#0a0a0a',
              letterSpacing: '-0.02em',
              margin: '0 0 56px 0',
              maxWidth: '900px',
              flexShrink: 0,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
          >
            {title}
          </h1>

          {/* ── DIVIDER — thin editorial rule ── */}
          <div
            style={{
              width: '88px',
              height: '1px',
              backgroundColor: '#BBBBBB',
              marginBottom: '56px',
              flexShrink: 0,
            }}
          />

          {/* ── QUOTE — editorial citation ── */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
            <p
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontSize: '46px',
                fontWeight: 400,
                fontStyle: 'italic',
                lineHeight: 1.50,
                color: '#2a2a2a',
                maxWidth: '820px',
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
