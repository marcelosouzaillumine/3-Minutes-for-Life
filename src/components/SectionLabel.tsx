import type { ReactNode } from 'react';

// Ícones de traço simples (24x24), na cor do rótulo. Um por tipo de seção, iguais no devocional adulto, na leitura infantil e no ritual.
const PATHS = {
  story: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z',
  think: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  practice: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  prayer: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  audio: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1z',
  tip: 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3zM10 20h4',
  support: 'M4 10h16v4H4zM12 10v10M12 10c-2 0-4-1-4-3s2-2.5 4 0c2-2.5 4-2 4 0s-2 3-4 3zM5 14v5h14v-5',
  write: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17zM14 7l3 3',
  guide: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
} as const;

export type SectionIcon = keyof typeof PATHS;

/** Rótulo de seção: ícone redondo + título em caixa-alta, na cor de destaque da marca. */
export function SectionLabel({ icon, children, as: Tag = 'span' }: { icon: SectionIcon; children: ReactNode; as?: 'span' | 'h3' | 'h4' }) {
  return (
    <Tag className="sec-label">
      <span className="sec-label__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={PATHS[icon]} />
        </svg>
      </span>
      {children}
    </Tag>
  );
}
