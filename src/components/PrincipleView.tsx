import type { Principle } from '../data/principles';
import { isFavorite, saveFavorite, removeFavorite } from '../utils/storage';
import { useState, useEffect } from 'react';

interface PrincipleViewProps {
  principle: Principle;
  onBack?: () => void;
  customAction?: { label: string; onClick: () => void };
}

export function PrincipleView({ principle, onBack, customAction }: PrincipleViewProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isFavorite(principle.id));
  }, [principle.id]);

  const toggleSave = () => {
    if (saved) {
      removeFavorite(principle.id);
      setSaved(false);
    } else {
      saveFavorite(principle.id);
      setSaved(true);
    }
  };

  return (
    <div className="principle-view">
      {onBack && (
        <button onClick={onBack} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      )}
      
      <span className="label">{principle.category}</span>
      
      <h1 className="principle-title">{principle.title}</h1>
      <p className="principle-statement">{principle.principle}</p>
      
      {principle.audio && (
        <div style={{ marginBottom: '2rem' }}>
          <audio controls src={principle.audio.url} style={{ width: '100%', height: '40px' }} />
        </div>
      )}

      <div className="principle-reflection">
        {principle.reflection
          .split(/\n\s*\n/)
          .map(paragraph => paragraph.trim())
          .filter(Boolean)
          .map((paragraph, index) => (
            <p key={index} style={{ marginBottom: '1.5rem', lineHeight: '1.7' }}>{paragraph}</p>
          ))}
      </div>

      <div className="application-section">
        <span className="label">Para praticar hoje</span>
        <div className="application-text">
          {principle.application
            .split(/\n\s*\n/)
            .map(paragraph => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index} style={{ marginBottom: '1rem' }}>{paragraph}</p>
            ))}
        </div>

        {principle.prayer && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <span className="label">Nossa oração</span>
            <p style={{ fontStyle: 'italic', lineHeight: '1.7', color: 'var(--color-text-light)' }}>
              "{principle.prayer}"
            </p>
          </div>
        )}

        {principle.reference && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <span className="label">Referência bíblica</span>
            <p style={{ fontWeight: 500 }}>
              {principle.reference.citation}
              {principle.reference.translation && ` — ${principle.reference.translation}`}
            </p>
            {principle.reference.text && (
              <p style={{ marginTop: '0.5rem', lineHeight: '1.6', color: 'var(--color-text-light)', fontSize: '0.95rem' }}>
                "{principle.reference.text}"
              </p>
            )}
          </div>
        )}
        
        <div style={{ marginTop: '2rem' }}>
          {customAction ? (
            <button className="btn-primary" onClick={customAction.onClick}>
              {customAction.label}
            </button>
          ) : (
            <button className="btn-primary" onClick={toggleSave}>
              {saved ? 'Remover dos salvos' : 'Salvar princípio'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
