import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { PrayerRequestModal } from './PrayerRequestModal';

interface PrayerRequestSectionProps {
  devotionalId?: string;
  onSuccess?: () => void;
}

export function PrayerRequestSection({ devotionalId }: PrayerRequestSectionProps) {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleCtaAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action?: string }>;
      if (customEvent.detail?.action === 'prayer_request') {
        setIsModalOpen(true);
      }
    };

    document.addEventListener('cta:action', handleCtaAction);
    return () => {
      document.removeEventListener('cta:action', handleCtaAction);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('intent') === 'prayer_request' && user) {
      setIsModalOpen(true);
      params.delete('intent');
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, '', window.location.pathname + newSearch);
    }
  }, [user]);

  return (
    <>
      <div style={{
        marginTop: '1.5rem',
        padding: '2rem',
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.5rem',
          fontWeight: 400,
          marginBottom: '0.5rem',
          color: 'var(--color-text)'
        }}>
          {t('prayerRequest.title', 'Podemos orar por você?')}
        </h3>
        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-light)',
          marginBottom: '1.5rem',
          lineHeight: 1.6
        }}>
          {t('prayerRequest.description', 'Compartilhe seu pedido de oração com nossa equipe. Vamos recebê-lo com cuidado e colocá-lo diante de Deus.')}
        </p>
        <button 
          className="btn-secondary" 
          onClick={() => setIsModalOpen(true)}
          style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
        >
          {t('prayerRequest.submitBtn', 'Enviar meu pedido de oração')}
        </button>
      </div>

      <PrayerRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        devotionalId={devotionalId}
      />
    </>
  );
}
