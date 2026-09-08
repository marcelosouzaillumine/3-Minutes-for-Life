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

  const NAVIGATION_ACTIONS: Record<string, string> = {
    login: '/login',
    signup: '/signup',
    register: '/signup',
  };

  const handleClick = () => {
    if (attrs.action) {
      const navTarget = NAVIGATION_ACTIONS[attrs.action];
      if (navTarget) {
        window.location.href = navTarget;
        return;
      }
      // Other actions — dispatch event for section-level handlers
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
      <div className="cta-block--pending">
        <span className="cta-block-pending-label">
          CTA — tradução pendente
        </span>
        <p className="cta-block-pending-text">
          O conteúdo deste bloco ainda não foi traduzido para este idioma.
        </p>
      </div>
    );
  }

  return (
    <div className="cta-block">
      {attrs.title && (
        <p className="cta-block-title">
          {attrs.title}
        </p>
      )}

      {attrs.description && (
        <p className="cta-block-description">
          {attrs.description}
        </p>
      )}

      {attrs.label && (attrs.url || attrs.action) && (
        <button
          onClick={handleClick}
          className="cta-block-button"
        >
          {attrs.label}
        </button>
      )}
    </div>
  );
}
