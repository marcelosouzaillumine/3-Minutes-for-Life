import React, { useState, useEffect } from 'react';
import { TestimonialService } from '../services/TestimonialService';
import { DevotionalService } from '../services/DevotionalService';
import type { Devotional } from '../types/Devotional';

interface TestimonialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  devotionalId?: string;
  onSuccess?: () => void;
}

export function TestimonialFormModal({ isOpen, onClose, devotionalId, onSuccess }: TestimonialFormModalProps) {
  const [content, setContent] = useState('');
  const [selectedDevotionalId, setSelectedDevotionalId] = useState<string>(devotionalId || '');
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // If no specific devotional context is provided, fetch list to allow selection
    if (isOpen && !devotionalId) {
      DevotionalService.getDevotionals()
        .then(setDevotionals)
        .catch(console.error);
    }
    
    if (isOpen) {
      // Reset state on open
      setContent('');
      setSelectedDevotionalId(devotionalId || '');
      setIsSuccess(false);
    }
  }, [isOpen, devotionalId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 20) {
      alert("Por favor, escreva um pouco mais (mínimo de 20 caracteres).");
      return;
    }

    setIsSubmitting(true);
    try {
      await TestimonialService.createTestimonial({
        content,
        devotional_id: selectedDevotionalId || null
      });
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao enviar sua história. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: '16px', 
        width: '100%', maxWidth: '500px', position: 'relative',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.5rem', 
          color: 'var(--color-text-light)', border: 'none', background: 'none', cursor: 'pointer'
        }}>
          &times;
        </button>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 400 }}>
              Obrigado por compartilhar.
            </h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Recebemos sua história. Ela foi enviada de forma privada para nossa equipe.
            </p>
            <button className="btn-primary" onClick={onClose}>
              Concluir
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: 400 }}>
              Compartilhe sua história
            </h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', lineHeight: 1.5 }}>
              Queremos saber o que esta reflexão despertou em você. Conte, com suas palavras, algo que tenha marcado sua caminhada.
            </p>

            <form onSubmit={handleSubmit}>
              {!devotionalId && devotionals.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-light)' }}>
                    Relacionado a alguma reflexão? (Opcional)
                  </label>
                  <select 
                    value={selectedDevotionalId} 
                    onChange={e => setSelectedDevotionalId(e.target.value)}
                    style={{ 
                      width: '100%', padding: '0.75rem', borderRadius: '8px', 
                      border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-text)', fontSize: '1rem'
                    }}
                  >
                    <option value="">Não está relacionada a uma devocional específica</option>
                    {devotionals.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Escreva aqui..."
                  rows={6}
                  maxLength={3000}
                  style={{ 
                    width: '100%', padding: '1rem', borderRadius: '8px', 
                    border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)', fontSize: '1rem', resize: 'vertical',
                    fontFamily: 'var(--font-family)'
                  }}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  {content.length}/3000
                </div>
              </div>

              <div style={{ 
                backgroundColor: 'rgba(196, 109, 83, 0.05)', padding: '1rem', borderRadius: '8px', 
                marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' 
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 1.4, margin: 0 }}>
                  <strong>Seu relato é privado.</strong><br/>
                  Ele não será exibido para outros usuários.
                </p>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting || content.length < 20}
              >
                {isSubmitting ? 'Enviando...' : 'Compartilhar minha história'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
