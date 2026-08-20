import { sanitizeHtml } from '../lib/sanitizer';
import { extractStructure } from '../lib/contentStructure';
import { CtaBlock } from './CtaBlock';

interface HtmlRendererProps {
  html: string;
  className?: string;
}

/**
 * Structural HTML renderer.
 *
 * Instead of rendering everything via `dangerouslySetInnerHTML`,
 * this component parses the HTML into structural blocks first:
 *
 *  - Standard HTML blocks  → sanitized `dangerouslySetInnerHTML`
 *  - CTA editorial blocks  → <CtaBlock /> React component
 *
 * This guarantees that CTA blocks are always rendered correctly,
 * never stripped by the sanitizer, and their behaviour (click/action)
 * is driven by React rather than raw HTML.
 */
export function HtmlRenderer({ html, className = '' }: HtmlRendererProps) {
  if (!html) return null;

  const blocks = extractStructure(html);

  // Fast path: no CTAs — keep the original single-dangerouslySetInnerHTML behaviour
  const hasCta = blocks.some((b) => b.type === 'cta');
  if (!hasCta) {
    return (
      <div
        className={`html-renderer-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    );
  }

  // Structural path: interleave sanitized HTML and CtaBlock components
  return (
    <div className={`html-renderer-content ${className}`}>
      {blocks.map((block, i) => {
        if (block.type === 'cta') {
          return <CtaBlock key={`cta-${block.index}`} attrs={block.attrs} />;
        }
        // Standard HTML — sanitize before rendering
        const sanitized = sanitizeHtml(block.content);
        if (!sanitized) return null;
        return (
          <div
            key={`html-${i}`}
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        );
      })}
    </div>
  );
}
