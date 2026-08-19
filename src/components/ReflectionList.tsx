import { useEffect, useState } from 'react';
import { ReflectionService } from '../services/ReflectionService';
import type { PersonalReflectionWithDevotional } from '../services/ReflectionService';

export function ReflectionList() {
  const [reflections, setReflections] = useState<PersonalReflectionWithDevotional[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReflections = async () => {
    try {
      setLoading(true);
      const data = await ReflectionService.getUserReflections();
      setReflections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReflections();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-light)' }}>Carregando suas anotações...</div>;
  }

  if (reflections.length === 0) {
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
          Nenhuma anotação pessoal ainda.
        </h4>
        <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          As reflexões que você guarda para si mesmo nos devocionais aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reflections.map(r => (
          <div key={r.id} style={{
            padding: '1.5rem',
            backgroundColor: 'var(--color-bg)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-text)'
              }}>
                {r.devotionals?.title || 'Devocional'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                {new Date(r.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <p style={{ 
              fontSize: '1rem', 
              color: 'var(--color-text)', 
              lineHeight: 1.6, 
              whiteSpace: 'pre-wrap'
            }}>
              {r.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
