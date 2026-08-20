import type { CtaAttrs } from '../lib/contentStructure';

interface CtaBlockProps {
  attrs: CtaAttrs;
}

/**
 * Visual rendering component for a CTA editorial block.
 * Used by HtmlRenderer when it encounters a `<div data-type="cta" ...>` node.
 *
 * If the CTA text fields are empty and no translation is available,
 * the block renders in a "pending translation" state — never hidden.
 */
export function CtaBlock({ attrs }: CtaBlockProps) {
  const isPending = !attrs.title && !attrs.description && !attrs.label;

  const handleClick = () => {
    if (attrs.action) {
      // Internal action dispatch
      const event = new CustomEvent('cta:action', { detail: { action: attrs.action } });
      document.dispatchEvent(event);
      return;
    }
    if (attrs.url) {
      if (attrs.url.startsWith('/') || attrs.url.startsWith('#')) {
        window.location.href = attrs.url;
      } else {
        window.open(attrs.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (isPending) {
    // Pending translation state — never hidden
    return (
      <div
        style={{
          border: '2px dashed #e0cfc9',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          margin: '1.5rem 0',
          background: '#fdf7f5',
          opacity: 0.7,
        }}
      >
        <span style={{
          display: 'inline-block',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: '#c46d53',
          marginBottom: '0.5rem',
        }}>
          CTA — tradução pendente
        </span>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic' }}>
          O conteúdo deste bloco ainda não foi traduzido para este idioma.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1.5px solid #e8d8d3',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        margin: '1.5rem 0',
        background: 'linear-gradient(135deg, #fdf7f5 0%, #fef9f7 100%)',
        boxShadow: '0 2px 12px rgba(196,109,83,0.08)',
      }}
    >
      {attrs.title && (
        <p style={{
          margin: '0 0 0.35rem',
          fontWeight: 700,
          fontSize: '1rem',
          color: 'var(--color-text, #1a1a1a)',
          lineHeight: 1.4,
        }}>
          {attrs.title}
        </p>
      )}

      {attrs.description && (
        <p style={{
          margin: '0 0 1rem',
          fontSize: '0.9rem',
          color: 'var(--color-text-light, #555)',
          lineHeight: 1.6,
        }}>
          {attrs.description}
        </p>
      )}

      {attrs.label && (attrs.url || attrs.action) && (
        <button
          onClick={handleClick}
          style={{
            display: 'inline-block',
            padding: '0.55rem 1.25rem',
            borderRadius: '99px',
            border: 'none',
            background: '#c46d53',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {attrs.label}
        </button>
      )}
    </div>
  );
}
