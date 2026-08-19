import { useState } from 'react';
import { TestimonialFormModal } from './TestimonialFormModal';

interface TestimonialSectionProps {
  devotionalId?: string;
  onSuccess?: () => void;
}

export function TestimonialSection({ devotionalId, onSuccess }: TestimonialSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div style={{
        marginTop: '3rem',
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
          Como essa reflexão tocou você?
        </h3>
        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-light)',
          marginBottom: '1.5rem',
          lineHeight: 1.6
        }}>
          Seu testemunho pode inspirar e abençoar outras pessoas que estão na mesma jornada.
        </p>
        <button 
          className="btn-secondary" 
          onClick={() => setIsModalOpen(true)}
          style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
        >
          Escrever meu testemunho
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
