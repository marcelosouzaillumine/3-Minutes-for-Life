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
      <div className="relationship-card relationship-card--prayer">
        <h3 className="relationship-card-title">
          {t('prayerRequest.title', 'Podemos orar por você?')}
        </h3>
        <p className="relationship-card-description">
          {t('prayerRequest.description', 'Compartilhe seu pedido de oração com nossa equipe. Vamos recebê-lo com cuidado e colocá-lo diante de Deus.')}
        </p>
        <button 
          className="btn-secondary relationship-card-btn" 
          onClick={() => setIsModalOpen(true)}
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
