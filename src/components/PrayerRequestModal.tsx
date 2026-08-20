import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { PrayerRequestService } from '../services/PrayerRequestService';

interface PrayerRequestModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  devotionalId?: string;
}

/**
 * Modal de Pedido de Oração — Fase 3.
 *
 * Relationship CTA com Authentication Gate:
 * - Se anônimo: exibe o Authentication Gate pastoral com retorno automático pós-login.
 * - Se autenticado: exibe o formulário de oração e persiste em `prayer_requests`.
 */
export function PrayerRequestModal({ isOpen: controlledIsOpen, onClose, devotionalId }: PrayerRequestModalProps) {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // 1. Listener para disparo do evento cta:action
  useEffect(() => {
    const handleCtaAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action?: string }>;
      if (customEvent.detail?.action === 'prayer_request') {
        setInternalIsOpen(true);
      }
    };

    document.addEventListener('cta:action', handleCtaAction);
    return () => {
      document.removeEventListener('cta:action', handleCtaAction);
    };
  }, []);

  // 2. Retorno automático pós-login com preservação de intenção
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('intent') === 'prayer_request' && user) {
      setInternalIsOpen(true);
      params.delete('intent');
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, '', window.location.pathname + newSearch);
    }
  }, [user]);

  if (!isOpen) return null;

  const trimmed = content.trim();
  const isSubmitDisabled = trimmed.length === 0 || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setIsSubmitting(true);
    setError('');

    try {
      await PrayerRequestService.createPrayerRequest({
        devotional_id: devotionalId || null,
        language: i18n.language || 'pt-BR',
        request: trimmed,
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Failed to submit prayer request:', err);
      setError(t('prayerRequest.submitError', 'Ocorreu um erro ao enviar seu pedido de oração. Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setIsSuccess(false);
    setError('');
    if (isControlled && onClose) {
      onClose();
    }
    setInternalIsOpen(false);
  };

  const handleAuthGateRedirect = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('intent', 'prayer_request');
    if (devotionalId) currentUrl.searchParams.set('d', devotionalId);
    const returnPath = currentUrl.pathname + currentUrl.search;
    window.location.href = `/login?redirectTo=${encodeURIComponent(returnPath)}`;
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prayer-modal-title"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg)',
          padding: '2rem',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={handleClose}
          aria-label={t('prayerRequest.cancelBtn', 'Fechar')}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            fontSize: '1.5rem',
            color: 'var(--color-text-light)',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          &times;
        </button>

        {/* ── CENÁRIO A: VISITANTE ANÔNIMO → AUTHENTICATION GATE ── */}
        {!user ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(196, 109, 83, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c46d53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2
              id="prayer-modal-title"
              style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', marginBottom: '0.75rem', fontWeight: 400 }}
            >
              {t('prayerRequest.authGateTitle', 'Entre para compartilhar seu pedido de oração')}
            </h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {t('prayerRequest.authGateDescription', 'Para que nossa equipe possa receber seu pedido e cuidar dele com responsabilidade, você precisa estar conectado à sua conta.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAuthGateRedirect}
              >
                {t('prayerRequest.authGateButton', 'Entrar ou criar conta')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
              >
                {t('prayerRequest.cancelBtn', 'Agora não')}
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          /* ── CENÁRIO B: CONFIRMAÇÃO DE SUCESSO ── */
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(196, 109, 83, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c46d53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>

            <h2
              id="prayer-modal-title"
              style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 400 }}
            >
              {t('prayerRequest.successTitle', 'Recebemos seu pedido.')}
            </h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {t('prayerRequest.successBody', 'Vamos recebê-lo com cuidado e colocá-lo diante de Deus.')}
            </p>
            <button className="btn-primary" onClick={handleClose}>
              {t('prayerRequest.closeBtn', 'Fechar')}
            </button>
          </div>
        ) : (
          /* ── CENÁRIO C: FORMULÁRIO DE PEDIDO DE ORAÇÃO AUTENTICADO ── */
          <>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(196, 109, 83, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c46d53" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </div>

            <h2
              id="prayer-modal-title"
              style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: 400 }}
            >
              {t('prayerRequest.title', 'Podemos orar por você?')}
            </h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem', lineHeight: 1.5, fontSize: '0.95rem' }}>
              {t('prayerRequest.description', 'Se existe algo que você gostaria de colocar diante de Deus, compartilhe com nossa equipe. Vamos receber seu pedido com cuidado e levá-lo em oração.')}
            </p>

            {error && (
              <div style={{
                backgroundColor: 'rgba(234, 67, 53, 0.1)',
                color: '#d93025',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="prayer-textarea"
                  style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-light)', fontWeight: 500 }}
                >
                  {t('prayerRequest.fieldLabel', 'Seu pedido de oração')}
                </label>
                <textarea
                  id="prayer-textarea"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={t('prayerRequest.placeholder', 'Escreva aqui o que você gostaria de compartilhar...')}
                  rows={6}
                  maxLength={2000}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'var(--font-family)',
                    lineHeight: 1.6,
                  }}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  {content.length}/2000
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitDisabled}
                  style={{ opacity: isSubmitDisabled ? 0.5 : 1, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting
                    ? t('prayerRequest.submittingBtn', 'Enviando...')
                    : t('prayerRequest.submitBtn', 'Enviar meu pedido de oração')}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClose}
                >
                  {t('prayerRequest.cancelBtn', 'Agora não')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
