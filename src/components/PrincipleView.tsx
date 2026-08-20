import type { Devotional } from '../types/Devotional';
import { JourneyService } from '../services/JourneyService';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShareButton } from './ShareButton';
import { HtmlRenderer } from './HtmlRenderer';
import { useAuth } from '../context/AuthContext';
import { ReflectionService } from '../services/ReflectionService';
import { TestimonialSection } from './TestimonialSection';
interface PrincipleViewProps {
  devotional: Devotional;
  onBack?: () => void;
  customAction?: { 
    label: string; 
    onClick: () => void;
    variant?: 'shared';
    text?: string;
    subtext?: string;
    note?: string;
  };
}

export function PrincipleView({ devotional, onBack, customAction }: PrincipleViewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [reflectionContent, setReflectionContent] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);
  const [savedReflectionSuccess, setSavedReflectionSuccess] = useState(false);

  useEffect(() => {
    // Start progress using canonical UUID directly
    JourneyService.start(devotional.id).catch(console.error);
    
    // Check if saved
    JourneyService.listFavorites()
      .then(ids => setSaved(ids.includes(devotional.id)))
      .catch(console.error);
      
    // Load existing reflection if user is authenticated
    if (user) {
      ReflectionService.getReflection(devotional.id).then(content => {
        if (content) setReflectionContent(content);
      });
    }
  }, [devotional.id, user]);

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
      alert(t('completed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReflection = async () => {
    if (!reflectionContent.trim()) return;
    setSavingReflection(true);
    try {
      await ReflectionService.saveReflection(devotional.id, reflectionContent);
      setSavedReflectionSuccess(true);
      setTimeout(() => setSavedReflectionSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save reflection:', err);
      alert('Erro ao salvar sua reflexão.');
    } finally {
      setSavingReflection(false);
    }
  };

  const handleLoginForReflection = () => {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login?redirectTo=${currentUrl}`;
  };

  return (
    <div className="principle-view">
      {onBack && (
        <button onClick={onBack} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('home.back')}
        </button>
      )}
      
      <span className="label">
        {devotional.categories?.name 
          ? t(`categories.${devotional.categories.name}`, devotional.categories.name)
          : t('categories.Devocional', 'Devocional')}
      </span>
      
      <h1 className="principle-title">{devotional.title}</h1>

      {devotional.principle_statement && (
        <p className="principle-statement">{devotional.principle_statement}</p>
      )}
      
      <HtmlRenderer html={devotional.reflection} className="principle-reflection" />
      
      {devotional.audio_url && (
        <div style={{ marginBottom: '2rem' }}>
          <audio controls src={devotional.audio_url} style={{ width: '100%', height: '40px' }} />
        </div>
      )}

      <div className="application-section">
        <span className="label">{t('home.practiceToday')}</span>
        <div className="application-text">
          {devotional.practical_application ? (
            <HtmlRenderer html={devotional.practical_application} />
          ) : (
            <p style={{ marginBottom: '1rem', fontStyle: 'italic', opacity: 0.7 }}>{t('home.applicationPending')}</p>
          )}
        </div>

        {devotional.prayer && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <span className="label">{t('home.prayer')}</span>
            <div className="application-text" style={{ fontStyle: 'italic' }}>
              <HtmlRenderer html={devotional.prayer} />
            </div>
          </div>
        )}

        {devotional.scripture_reference && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <span className="label">{t('home.scriptureReference')}</span>
            <p style={{ fontWeight: 500 }}>
              {devotional.scripture_reference}
            </p>
            {devotional.scripture_text && (
              <p style={{ marginTop: '0.5rem', lineHeight: '1.6', color: 'var(--color-text-light)', fontSize: '0.95rem' }}>
                &ldquo;{devotional.scripture_text}&rdquo;
              </p>
            )}
          </div>
        )}
        
        {/* Minha reflexao - Secao de Reflexao Pessoal */}
        <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>{t('home.myReflection')}</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {t('home.myReflectionPrompt')}
          </p>

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                value={reflectionContent}
                onChange={(e) => setReflectionContent(e.target.value)}
                placeholder={t('home.myReflectionPrompt')}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '-0.5rem', fontStyle: 'italic' }}>
                {t('home.myReflectionPrivate')}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSaveReflection}
                  disabled={savingReflection || !reflectionContent.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '24px',
                    border: 'none',
                    background: 'var(--color-text)',
                    color: 'var(--color-bg)',
                    fontWeight: 600,
                    cursor: (savingReflection || !reflectionContent.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (savingReflection || !reflectionContent.trim()) ? 0.5 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {savingReflection ? t('home.savingReflection') : t('home.saveReflection')}
                </button>
                {savedReflectionSuccess && (
                  <span style={{ fontSize: '0.9rem', color: '#4CAF50', fontWeight: 500 }}>
                    {t('home.reflectionSaved')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid var(--color-border)',
              background: 'rgba(0,0,0,0.02)',
              textAlign: 'center'
            }}>
              <button 
                onClick={handleLoginForReflection}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '24px',
                  border: '1px solid var(--color-text)',
                  background: 'transparent',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                {t('home.loginToSave')}
              </button>
            </div>
          )}
        </div>

        {customAction?.variant === 'shared' && (
          <div style={{ marginTop: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', background: 'var(--color-bg)', padding: '2rem 1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-text)', lineHeight: 1.5, fontWeight: 500 }}>
              {customAction.text}
            </p>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-light)', marginTop: '-1rem' }}>
              {customAction.subtext}
            </p>
            <button 
              onClick={customAction.onClick}
              style={{
                padding: '1rem 2rem',
                borderRadius: '30px',
                border: 'none',
                background: 'var(--color-text)',
                color: 'var(--color-bg)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              {customAction.label}
            </button>
            {customAction.note && (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginTop: '-0.5rem' }}>
                {customAction.note}
              </p>
            )}
          </div>
        )}

        <div className="action-bar">
          {customAction && customAction.variant !== 'shared' ? (
            <button className="action-btn" onClick={customAction.onClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span className="action-label">{customAction.label}</span>
            </button>
          ) : !customAction ? (
            <>
              <button className={`action-btn ${saved ? 'active' : ''}`} onClick={toggleSave}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="action-label">{saved ? t('saved') : t('save')}</span>
              </button>

              <button className="action-btn" onClick={markComplete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="action-label">{t('complete')}</span>
              </button>
            </>
          ) : null}

          <ShareButton devotional={devotional} asIcon={true} />
        </div>

        <TestimonialSection devotionalId={devotional.id} />
      </div>
    </div>
  );
}
