import { useEffect, useState } from 'react';
import { DevotionalService } from '../services/DevotionalService';
import { AnalyticsService } from '../services/AnalyticsService';
import type { Devotional } from '../types/Devotional';
import { PrincipleView } from '../components/PrincipleView';

export function SharedDevotional() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const devotionalId = searchParams.get('d');

    if (devotionalId) {
      DevotionalService.getDevotional(devotionalId)
        .then(data => {
          setDevotional(data);
          setLoading(false);
          AnalyticsService.trackEvent('shared_devotional_viewed', { devotional_id: devotionalId });
        })
        .catch(err => {
          console.error("Failed to load shared devotional:", err);
          setError(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
      setError(new Error("No devotional ID found"));
    }
  }, []);

  const handleSignupClick = () => {
    window.location.href = '/signup';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <span className="label" style={{ opacity: 0.5 }}>Carregando reflexão...</span>
      </div>
    );
  }

  if (error || !devotional) {
    // Fallback to landing if the devotional couldn't be loaded
    window.location.href = '/';
    return null;
  }

  return (
    <div className="shared-devotional-page">
      <header className="landing-header" style={{ position: 'relative', background: 'transparent' }}>
        <div className="landing-logo">3 Minutes for Life</div>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="perceived-statement" style={{ fontSize: '1.5rem', marginBottom: '2rem', marginTop: '2rem' }}>
          Alguém compartilhou esta reflexão com você.
        </div>
        
        <PrincipleView 
          devotional={devotional} 
          customAction={{
            label: "Gostou? Receba uma nova todos os dias",
            onClick: handleSignupClick
          }}
        />
      </div>
    </div>
  );
}
