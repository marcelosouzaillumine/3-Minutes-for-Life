import { DevotionalService } from '../services/DevotionalService';
import { JourneyService } from '../services/JourneyService';
import { getTodayInSaoPaulo } from '../utils/date';
import { useState, useEffect } from 'react';
import type { Devotional } from '../types/Devotional';
import { ShareButton } from '../components/ShareButton';
import { TestimonialSection } from '../components/TestimonialSection';
import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from '../components/HtmlRenderer';
import { useAuth } from '../context/AuthContext';
import { ReflectionService } from '../services/ReflectionService';

interface HomeProps {
  onExplore: () => void;
}

export function Home({ onExplore }: HomeProps) {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saved, setSaved] = useState(false);
  const [reflectionContent, setReflectionContent] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);
  const [savedReflectionSuccess, setSavedReflectionSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    // 1. Fetch Canonical Content
    // To deterministically fetch today's devotional, we pass the current date in Sao Paulo timezone.
    const todayStr = getTodayInSaoPaulo();
    
    // Pass i18n.language to resolve the Content Language
    DevotionalService.getDailyDevotional(todayStr, i18n.language)
      .then(canonicalData => {
        setDevotional(canonicalData);
        setLoading(false);
        
        // 2. Fetch Journey State
        JourneyService.start(canonicalData.id).catch(console.error);

        JourneyService.listFavorites()
          .then(ids => setSaved(ids.includes(canonicalData.id)))
          .catch(console.error);
          
        if (user) {
          ReflectionService.getReflection(canonicalData.id).then(content => {
            if (content) setReflectionContent(content);
          });
        }
      })
      .catch(err => {
        console.error("Failed to load daily devotional:", err);
        setError(err);
        setLoading(false);
      });
  }, [i18n.language]);

  const toggleSave = async () => {
    if (!devotional) return;
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
      alert(t('home.saveError'));
    }
  };

  const markComplete = async () => {
    if (!devotional) return;
    try {
      await JourneyService.complete(devotional.id);
      alert(t('completed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReflection = async () => {
    if (!devotional || !reflectionContent.trim()) return;
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

  if (loading) {
    return (
      <div className="page-home">
        <span className="label" style={{ opacity: 0.5 }}>{t('loading')}</span>
        <div className="skeleton-title" style={{ height: '2rem', width: '80%', backgroundColor: 'var(--color-bg-secondary)', marginTop: '1rem', borderRadius: '4px' }} />
        <div className="skeleton-subtitle" style={{ height: '1.2rem', width: '90%', backgroundColor: 'var(--color-bg-secondary)', marginTop: '1rem', borderRadius: '4px' }} />
        <div className="skeleton-body" style={{ height: '100px', width: '100%', backgroundColor: 'var(--color-bg-secondary)', marginTop: '2rem', borderRadius: '4px' }} />
      </div>
    );
  }

  if (error || !devotional) {
    return (
      <div className="page-home">
        <p>{t('error')}</p>
      </div>
    );
  }

  return (
    <div className="page-home">
      <span className="label">{t('home.todayPrinciple')}</span>
      
      <h1 className="principle-title">{devotional.title}</h1>
      {devotional.subtitle && (
        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-light)', marginTop: '-0.5rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          {devotional.subtitle}
        </h2>
      )}
      
      {devotional.audio_url && (
        <div style={{ marginBottom: '2rem' }}>
          <audio controls src={devotional.audio_url} style={{ width: '100%', height: '40px' }} />
        </div>
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
              .slice(1) // Skip the first block which we assume is the statement
              .map(paragraph => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index} style={{ marginBottom: '1.5rem', lineHeight: '1.7' }}>{paragraph}</p>
              ))}
          </div>
        </>
      )}

      <div className="application-section">
        <span className="label">{t('home.practiceToday')}</span>
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

        {devotional.scripture_reference && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <span className="label">{t('home.scriptureReference')}</span>
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
        
        {/* O que ficou comigo - Secao de Reflexao Pessoal */}
        <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>O que ficou comigo</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Alguma parte dessa reflexão ficou com você? Registre aqui. Este espaço é só seu.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea
              value={reflectionContent}
              onChange={(e) => setReflectionContent(e.target.value)}
              placeholder="Escreva o que essa reflexão despertou em você..."
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
              Só você pode ver o que escreve aqui.
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
                {savingReflection ? 'Guardando...' : 'Guardar'}
              </button>
              {savedReflectionSuccess && (
                <span style={{ fontSize: '0.9rem', color: '#4CAF50', fontWeight: 500 }}>
                  Guardado na sua jornada.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="action-bar">
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

          <ShareButton devotional={devotional} asIcon={true} />
        </div>

        <TestimonialSection devotionalId={devotional.id} />
        
        <div style={{ marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={onExplore}>
            {t('home.exploreMore')}
          </button>
        </div>
      </div>
    </div>
  );
}
