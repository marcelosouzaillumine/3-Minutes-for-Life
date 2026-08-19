import type { Devotional } from '../types/Devotional';
import { JourneyService } from '../services/JourneyService';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShareButton } from './ShareButton';
import { HtmlRenderer } from './HtmlRenderer';

interface PrincipleViewProps {
  devotional: Devotional;
  onBack?: () => void;
  customAction?: { label: string; onClick: () => void };
}

export function PrincipleView({ devotional, onBack, customAction }: PrincipleViewProps) {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Start progress using canonical UUID directly
    JourneyService.start(devotional.id).catch(console.error);
    
    // Check if saved
    JourneyService.listFavorites()
      .then(ids => setSaved(ids.includes(devotional.id)))
      .catch(console.error);
  }, [devotional.id]);

  const toggleSave = async () => {
    try {
      if (saved) {
        await JourneyService.toggleFavorite(devotional.id);
        setSaved(false);
      } else {
        await JourneyService.toggleFavorite(devotional.id);
        setSaved(true);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar favorito.');
    }
  };

  const markComplete = async () => {
    try {
      await JourneyService.complete(devotional.id);
      alert('Concluído!');
    } catch (err) {
      console.error(err);
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
      
      <span className="label">{devotional.categories?.name || 'Devocional'}</span>
      
      <h1 className="principle-title">{devotional.title}</h1>
      {devotional.subtitle && (
        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-light)', marginTop: '-0.5rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          {devotional.subtitle}
        </h2>
      )}
      {devotional.principle_statement ? (
        <>
          <p className="principle-statement">{devotional.principle_statement}</p>
          <HtmlRenderer html={devotional.reflection} className="principle-reflection" />
        </>
      ) : (
        <>
          <p className="principle-statement">{devotional.reflection.split(/(?:\r?\n|\\n)\s*(?:\r?\n|\\n)/)[0]}</p>
          <div className="principle-reflection">
            {devotional.reflection
              .split(/(?:\r?\n|\\n)\s*(?:\r?\n|\\n)/)
              .slice(1)
              .map(paragraph => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index} style={{ marginBottom: '1.5rem', lineHeight: '1.7' }}>{paragraph}</p>
              ))}
          </div>
        </>
      )}
      
      {devotional.audio_url && (
        <div style={{ marginBottom: '2rem' }}>
          <audio controls src={devotional.audio_url} style={{ width: '100%', height: '40px' }} />
        </div>
      )}

      <div className="application-section">
        <span className="label">Para praticar hoje</span>
        <div className="application-text">
          {devotional.practical_application ? (
            devotional.principle_statement ? (
              <HtmlRenderer html={devotional.practical_application} />
            ) : (
              devotional.practical_application
                .split(/(?:\r?\n|\\n)\s*(?:\r?\n|\\n)/)
                .map(paragraph => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index} style={{ marginBottom: '1rem' }}>{paragraph}</p>
                ))
            )
          ) : (
            <p style={{ marginBottom: '1rem', fontStyle: 'italic', opacity: 0.7 }}>{t('home.applicationPending')}</p>
          )}
        </div>

        {devotional.prayer && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <span className="label">Oração</span>
            <div className="application-text" style={{ fontStyle: 'italic' }}>
              {devotional.principle_statement ? (
                <HtmlRenderer html={devotional.prayer} />
              ) : (
                devotional.prayer
                  .split(/(?:\r?\n|\\n)\s*(?:\r?\n|\\n)/)
                  .map(paragraph => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index} style={{ marginBottom: '1rem' }}>{paragraph}</p>
                  ))
              )}
            </div>
          </div>
        )}

        {devotional.scripture_reference && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <span className="label">Referência bíblica</span>
            <p style={{ fontWeight: 500 }}>
              {devotional.scripture_reference}
            </p>
            {devotional.scripture_text && (
              <p style={{ marginTop: '0.5rem', lineHeight: '1.6', color: 'var(--color-text-light)', fontSize: '0.95rem' }}>
                "{devotional.scripture_text}"
              </p>
            )}
          </div>
        )}
        
        <div className="action-bar">
          {customAction ? (
            <button className="action-btn" onClick={customAction.onClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span className="action-label">{customAction.label}</span>
            </button>
          ) : (
            <>
              <button className={`action-btn ${saved ? 'active' : ''}`} onClick={toggleSave}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="action-label">{saved ? 'Salvo' : 'Salvar'}</span>
              </button>

              <button className="action-btn" onClick={markComplete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="action-label">Concluir</span>
              </button>
            </>
          )}

          <ShareButton devotional={devotional} asIcon={true} />
        </div>
      </div>
    </div>
  );
}
