import { sanitizeHtml } from '../lib/sanitizer';

interface HtmlRendererProps {
  html: string;
  className?: string;
}

export function HtmlRenderer({ html, className = '' }: HtmlRendererProps) {
  const sanitized = sanitizeHtml(html);

  return (
    <div 
      className={`html-renderer-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }} 
    />
  );
}
