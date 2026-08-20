import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TestimonialService } from '../services/TestimonialService';
import type { Testimonial } from '../types/Testimonial';
import { TestimonialFormModal } from './TestimonialFormModal';

export function TestimonialList() {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const data = await TestimonialService.getUserTestimonials();
      setTestimonials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('profile:statusPending', 'Em análise');
      case 'reviewed': return t('profile:statusReviewed', 'Lida pela equipe');
      case 'archived': return t('profile:statusArchived', 'Arquivada');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'; // amber
      case 'reviewed': return '#10b981'; // emerald
      case 'archived': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>
        {t('profile:loadingTestimonials', 'Carregando sua história...')}
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <>
        <div style={{
          marginTop: '1rem',
          padding: '3rem 2rem',
          backgroundColor: 'var(--color-bg)',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px dashed var(--color-border)'
        }}>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-text)' }}>
            {t('profile:emptyTestimonialsTitle', 'Nenhum testemunho registrado')}
          </h4>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {t('profile:emptyTestimonialsBody', 'Compartilhe como as reflexões têm tocado a sua vida e inspirado sua jornada.')}
          </p>
          <button 
            className="btn-secondary" 
            onClick={() => setIsModalOpen(true)}
            style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
          >
            {t('profile:shareStoryBtn', 'Compartilhar minha história')}
          </button>
        </div>

        <TestimonialFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchTestimonials}
        />
      </>
    );
  }

  return (
    <>
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              border: 'none',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('profile:newTestimonialBtn', 'Novo Testemunho')}
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {testimonials.map(item => (
            <div key={item.id} style={{
              padding: '1.5rem',
              backgroundColor: 'var(--color-bg)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: getStatusColor(item.status),
                  backgroundColor: `${getStatusColor(item.status)}15`,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  display: 'inline-block'
                }}>
                  {getStatusLabel(item.status)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  {new Date(item.created_at).toLocaleDateString(i18n.language || 'pt-BR')}
                </div>
              </div>
              
              <p style={{ 
                fontSize: '1rem', 
                color: 'var(--color-text)', 
                lineHeight: 1.6, 
                display: '-webkit-box', 
                WebkitLineClamp: 3, 
                WebkitBoxOrient: 'vertical', 
                overflow: 'hidden' 
              }}>
                &ldquo;{item.content}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <TestimonialFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTestimonials}
      />
    </>
  );
}
