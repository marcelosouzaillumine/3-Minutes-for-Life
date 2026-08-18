import { useEffect, useState } from 'react';
import { TestimonialService } from '../services/TestimonialService';
import type { Testimonial } from '../types/Testimonial';

export function TestimonialList() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

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
      case 'pending': return 'Em análise';
      case 'reviewed': return 'Lida pela equipe';
      case 'archived': return 'Arquivada';
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
    return <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>Carregando sua história...</div>;
  }

  if (testimonials.length === 0) {
    return (
      <div style={{
        marginTop: '2rem',
        padding: '3rem 2rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '16px',
        textAlign: 'center',
        border: '1px dashed var(--color-border)'
      }}>
        <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-text)' }}>
          Sua história ainda não foi compartilhada.
        </h4>
        <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Se alguma reflexão tocar você de maneira especial, este é um espaço para registrar o que ela despertou.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {testimonials.map(t => (
          <div key={t.id} style={{
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
                color: getStatusColor(t.status),
                backgroundColor: `${getStatusColor(t.status)}15`,
                padding: '4px 10px',
                borderRadius: '20px',
                display: 'inline-block'
              }}>
                {getStatusLabel(t.status)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                {new Date(t.created_at).toLocaleDateString('pt-BR')}
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
              "{t.content}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
