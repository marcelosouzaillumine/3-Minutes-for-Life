import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (html: string) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'span', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'br'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: true,
  });
};
