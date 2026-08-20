import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (html: string) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'span', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'br', 'div'],
    ALLOWED_ATTR: ['class', 'data-type', 'data-title', 'data-description', 'data-label', 'data-url', 'data-action'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: true, // Preserve textual and permitted children content
    FORCE_BODY: false,
  });
};
