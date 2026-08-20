import { sanitizeHtml } from '../lib/sanitizer';
import { extractStructure } from '../lib/contentStructure';
import { CtaBlock } from './CtaBlock';

interface HtmlRendererProps {
  html?: string | null;
  className?: string;
}

/**
 * Normalizes editorial content before parsing/rendering.
 *
 * Supports:
 * - Full HTML strings (e.g. `<p>...</p><div data-type="cta" ...></div><p>...</p>`)
 * - Legacy plain-text strings with `\n\n` paragraph delimiters (wrapped automatically in `<p>`)
 * - Mixed content with CTA blocks
 */
export function normalizeEditorialContent(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Check if content already contains block-level HTML tags
  const hasHtmlBlocks = /<(p|div|h[1-6]|ul|ol|li|blockquote|section|article)\b/i.test(trimmed);
  if (hasHtmlBlocks) {
    return trimmed;
  }

  // Plain-text normalization: convert double/single line breaks to <p> tags
  const paragraphs = trimmed
    .split(/(?:\r?\n\s*){2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return '';
  return paragraphs.map(p => `<p>${p.replace(/\r?\n/g, '<br/>')}</p>`).join('\n');
}

/**
 * Unified structural editorial renderer.
 *
 * Normalizes content -> extracts structural AST blocks -> renders:
 * - Standard HTML paragraphs/headings through sanitized DOM
 * - CTA editorial blocks through React <CtaBlock />
 */
export function HtmlRenderer({ html, className = '' }: HtmlRendererProps) {
  const normalized = normalizeEditorialContent(html);
  if (!normalized) return null;

  const blocks = extractStructure(normalized);
  const hasCta = blocks.some((b) => b.type === 'cta');

  // Fast path: pure HTML with no CTA blocks
  if (!hasCta) {
    return (
      <div
        className={`html-renderer-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(normalized) }}
      />
    );
  }

  // Structural path: interleave sanitized HTML blocks and React CtaBlock instances
  return (
    <div className={`html-renderer-content ${className}`}>
      {blocks.map((block, i) => {
        if (block.type === 'cta') {
          return <CtaBlock key={`cta-${block.index}`} attrs={block.attrs} />;
        }
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
