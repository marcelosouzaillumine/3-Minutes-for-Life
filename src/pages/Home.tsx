import { DevotionalService } from '../services/DevotionalService';
import { JourneyService } from '../services/JourneyService';
import { getTodayInSaoPaulo } from '../utils/date';
import { useState, useEffect } from 'react';
import type { Devotional } from '../types/Devotional';
import { ShareButton } from '../components/ShareButton';
import { TestimonialSection } from '../components/TestimonialSection';

interface HomeProps {
  onExplore: () => void;
}

export function Home({ onExplore }: HomeProps) {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 1. Fetch Canonical Content
    // To deterministically fetch today's devotional, we pass the current date in Sao Paulo timezone.
    const todayStr = getTodayInSaoPaulo();
    
    DevotionalService.getDailyDevotional(todayStr)
      .then(canonicalData => {
        setDevotional(canonicalData);
        setLoading(false);
        
        // 2. Fetch Journey State
        JourneyService.start(canonicalData.id).catch(console.error);

        JourneyService.listFavorites()
          .then(ids => setSaved(ids.includes(canonicalData.id)))
          .catch(console.error);
      })
      .catch(err => {
        console.error("Failed to load daily devotional:", err);
        setError(err);
        setLoading(false);
      });
  }, []);

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
      alert('Erro ao atualizar favorito.');
    }
  };

  const markComplete = async () => {
    if (!devotional) return;
    try {
      await JourneyService.complete(devotional.id);
      alert('Concluído!');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-home">
        <span className="label" style={{ opacity: 0.5 }}>Carregando reflexão...</span>
        <div className="skeleton-title" style={{ height: '2rem', width: '80%', backgroundColor: 'var(--color-bg-secondary)', marginTop: '1rem', borderRadius: '4px' }} />
        <div className="skeleton-subtitle" style={{ height: '1.2rem', width: '90%', backgroundColor: 'var(--color-bg-secondary)', marginTop: '1rem', borderRadius: '4px' }} />
        <div className="skeleton-body" style={{ height: '100px', width: '100%', backgroundColor: 'var(--color-bg-secondary)', marginTop: '2rem', borderRadius: '4px' }} />
      </div>
    );
  }

  if (error || !devotional) {
    return (
      <div className="page-home">
        <p>Não foi possível carregar o princípio de hoje. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="page-home">
      <span className="label">Princípio de Hoje</span>
      
      <h1 className="principle-title">{devotional.title}</h1>
      <p className="principle-statement">{devotional.reflection.split(/(?:\r?\n|\\n)\s*(?:\r?\n|\\n)/)[0]}</p>
      
      {devotional.audio_url && (
        <div style={{ marginBottom: '2rem' }}>
          <audio controls src={devotional.audio_url} style={{ width: '100%', height: '40px' }} />
        </div>
      )}

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

      <div className="application-section">
        <span className="label">Para praticar hoje</span>
        <div className="application-text">
          {devotional.practical_application ? (
            devotional.practical_application
              .split(/(?:\r?\n|\\n)\s*(?:\r?\n|\\n)/)
              .map(paragraph => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index} style={{ marginBottom: '1rem' }}>{paragraph}</p>
              ))
          ) : (
            <p style={{ marginBottom: '1rem', fontStyle: 'italic', opacity: 0.7 }}>Aplicação em elaboração.</p>
          )}
        </div>

        {/* Prayer logic removed as it's not in the canonical schema yet, unless we add it to the DB */}

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

          <ShareButton devotional={devotional} asIcon={true} />
        </div>

        <TestimonialSection devotionalId={devotional.id} />
        
        <div style={{ marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={onExplore}>
            Explorar mais princípios
          </button>
        </div>
      </div>
    </div>
  );
}
