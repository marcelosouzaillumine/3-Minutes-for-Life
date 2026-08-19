import { useEffect, useState } from 'react';
import { DevotionalService } from '../services/DevotionalService';
import { AnalyticsService } from '../services/AnalyticsService';
import type { Devotional } from '../types/Devotional';
import { PrincipleView } from '../components/PrincipleView';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export function SharedDevotional() {
  const { i18n } = useTranslation();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [senderName, setSenderName] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const devotionalId = searchParams.get('d');
    const pathname = window.location.pathname;
    const code = pathname.replace('/r/', '').split('?')[0].replace('/', '');

    const fetchDevotionalAndSender = async () => {
      try {
        if (!devotionalId) throw new Error("No devotional ID found");
        
        const data = await DevotionalService.getDevotional(devotionalId);
        setDevotional(data);
        AnalyticsService.trackEvent('shared_devotional_viewed', { devotional_id: devotionalId });

        if (code) {
          const { data: referrerName, error: referrerError } = await supabase
            .rpc('get_referrer_name', { p_referral_code: code });
          
          if (!referrerError && referrerName) {
            const firstName = referrerName.split(' ')[0];
            setSenderName(firstName);
          }
        }
      } catch (err: any) {
        console.error("Failed to load shared devotional:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevotionalAndSender();
  }, [i18n.language]);

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
        <img src="/logo.png" alt="3 Minutes for Life" className="landing-logo-img" style={{ marginTop: '1rem' }} />
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="perceived-statement" style={{ fontSize: '1.5rem', marginBottom: '2rem', marginTop: '2rem' }}>
          {senderName ? `${senderName} compartilhou esta reflexão com você.` : 'Alguém compartilhou esta reflexão com você.'}
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
