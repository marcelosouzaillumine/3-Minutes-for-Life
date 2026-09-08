import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { TestimonialFormModal } from './TestimonialFormModal';

interface TestimonialSectionProps {
  devotionalId?: string;
  onSuccess?: () => void;
}

export function TestimonialSection({ devotionalId, onSuccess }: TestimonialSectionProps) {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleCtaAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action?: string }>;
      if (customEvent.detail?.action === 'testimony') {
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
    if (params.get('intent') === 'testimony' && user) {
      setIsModalOpen(true);
      params.delete('intent');
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, '', window.location.pathname + newSearch);
    }
  }, [user]);

  return (
    <>
      <div className="relationship-card">
        <h3 className="relationship-card-title">
          {t('testimonials.title', 'O que Deus despertou em seu coração por meio desta reflexão?')}
        </h3>
        <p className="relationship-card-description">
          {t('testimonials.subtitle', 'Seu relato pode ajudar nossa equipe a compreender o que Deus está fazendo na vida de quem caminha com o 3 Minutes for Life.')}
        </p>
        <button 
          className="btn-secondary relationship-card-btn" 
          onClick={() => setIsModalOpen(true)}
        >
          {t('testimonials.writeBtn', 'Compartilhar meu testemunho')}
        </button>
      </div>

      <TestimonialFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        devotionalId={devotionalId}
        onSuccess={onSuccess}
      />
    </>
  );
}
