import { useEffect, type ReactNode } from 'react';

/** Folha que sobe de baixo (como as do iOS): título, conteúdo e fechar com Esc ou toque fora. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grip" aria-hidden="true" />
        <div className="sheet__head">
          <h3 className="sheet__title">{title}</h3>
          <button type="button" className="sheet__close" aria-label="×" onClick={onClose}>×</button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}
