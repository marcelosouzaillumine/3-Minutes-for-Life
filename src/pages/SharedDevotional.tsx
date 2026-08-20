import { useEffect, useState } from 'react';
import { DevotionalService } from '../services/DevotionalService';
import { AnalyticsService } from '../services/AnalyticsService';
import type { Devotional } from '../types/Devotional';
import { PrincipleView } from '../components/PrincipleView';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export function SharedDevotional() {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [senderName, setSenderName] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const devotionalId = searchParams.get('d');
    const urlLang = searchParams.get('lang');
    const pathname = window.location.pathname;
    const code = pathname.replace('/r/', '').split('?')[0].replace('/', '');

    // Force language from URL if present
    if (urlLang && i18n.language !== urlLang) {
      i18n.changeLanguage(urlLang);
    }

    const fetchDevotionalAndSender = async () => {
      try {
        if (!devotionalId) throw new Error("No devotional ID found");
        
        // Use urlLang if available, otherwise fallback to current i18n language
        const targetLang = urlLang || i18n.language;
        const data = await DevotionalService.getDevotional(devotionalId, targetLang);
        setDevotional(data);
        AnalyticsService.trackEvent('devotional_opened', { devotional_id: devotionalId, channel: 'shared_link' });

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

  const handleCtaClick = () => {
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <span className="label" style={{ opacity: 0.5 }}>{t('common:loading', 'Carregando reflexão...')}</span>
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
      <header className="landing-header" style={{ position: 'relative', background: 'transparent', justifyContent: 'center' }}>
        <img src="/logo.png" alt="3 Minutes for Life" className="landing-logo-img" style={{ marginTop: '1rem', height: '62.5px' }} />
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="perceived-statement" style={{ fontSize: '1.5rem', marginBottom: '2rem', marginTop: '2rem' }}>
          {senderName 
            ? t('shared.senderShared', { name: senderName, defaultValue: `${senderName} compartilhou esta reflexão com você.` })
            : t('shared.someoneShared', 'Alguém compartilhou esta reflexão com você.')}
        </div>
        
        <PrincipleView 
          devotional={devotional} 
          customAction={!user ? {
            variant: 'shared',
            text: t('shared.ctaText', 'Que estes três minutos não terminem aqui.'),
            subtext: t('shared.ctaSubtext', 'Amanhã, uma nova reflexão espera por você.'),
            label: t('shared.ctaButton', 'Quero continuar'),
            note: t('shared.ctaNote', 'Gratuito, sempre.'),
            onClick: handleCtaClick
          } : undefined}
        />
      </div>
    </div>
  );
}
