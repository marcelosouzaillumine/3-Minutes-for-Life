import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminRelationshipService } from '../../../services/AdminRelationshipService';
import type { AdminPrayerRequestItem, PrayerRequestAdminStatus } from '../../../types/Relationship';

interface PrayerRequestDetailModalProps {
  prayerRequest: AdminPrayerRequestItem | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function PrayerRequestDetailModal({ prayerRequest, onClose, onStatusUpdated }: PrayerRequestDetailModalProps) {
  const { t } = useTranslation(['common']);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  if (!prayerRequest) return null;

  const handleUpdateStatus = async (newStatus: PrayerRequestAdminStatus) => {
    setIsUpdating(true);
    setError('');
    try {
      await AdminRelationshipService.updatePrayerRequestStatus(prayerRequest.id, newStatus);
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setError(t('admin.relationship.errorUpdatingStatus', 'Erro ao atualizar status.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: PrayerRequestAdminStatus) => {
    switch (status) {
      case 'pending':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontSize: '0.8rem', fontWeight: 600 }}>{t('admin.relationship.status.pending', 'Pendente')}</span>;
      case 'prayed':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#dbeafe', color: '#1e40af', fontSize: '0.8rem', fontWeight: 600 }}>{t('admin.relationship.status.prayed', 'Em oração')}</span>;
      case 'archived':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#f3f4f6', color: '#4b5563', fontSize: '0.8rem', fontWeight: 600 }}>{t('admin.relationship.status.archived', 'Arquivado')}</span>;
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: '16px',
          width: '100%', maxWidth: '600px', position: 'relative',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          aria-label={t('common:close', 'Fechar')}
          style={{
            position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.5rem',
            color: 'var(--color-text-light)', border: 'none', background: 'none', cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          &times;
        </button>

        {/* Privacy Pastoral Warning Banner */}
        <div style={{
          backgroundColor: 'rgba(196, 109, 83, 0.08)',
          borderLeft: '4px solid var(--color-accent)',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
            <strong>{t('admin.relationship.prayerPrivacyHeader', 'Pedido privado enviado para cuidado e oração.')}</strong><br />
            <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>
              {t('admin.relationship.prayerPrivacyDescription', 'Use estas informações exclusivamente para cuidado e acompanhamento pastoral. Não publique, compartilhe ou utilize este conteúdo sem autorização específica.')}
            </span>
          </p>
        </div>

        {/* Metadata Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
              {prayerRequest.user_full_name || t('admin.relationship.anonymousUser', 'Usuário da Comunidade')}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
              {formatDate(prayerRequest.created_at)} · <span style={{ textTransform: 'uppercase', fontWeight: 500 }}>{prayerRequest.language}</span>
              {prayerRequest.devotional_title && (
                <> · <span style={{ fontWeight: 500 }}>{prayerRequest.devotional_title}</span></>
              )}
            </div>
          </div>
          <div>{getStatusBadge(prayerRequest.status)}</div>
        </div>

        {/* Full Text Content (Strictly Read-Only) */}
        <div style={{
          backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.02))',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          fontSize: '1rem',
          lineHeight: 1.6,
          color: 'var(--color-text)',
          whiteSpace: 'pre-wrap',
          maxHeight: '300px',
          overflowY: 'auto',
          userSelect: 'text',
        }}>
          {prayerRequest.request}
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Status Transition Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          {prayerRequest.status === 'pending' && (
            <>
              <button
                type="button"
                className="btn-primary"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('prayed')}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                {isUpdating ? t('admin.relationship.updating', 'Atualizando...') : t('admin.relationship.actions.markPrayed', 'Colocar em oração')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('archived')}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                {t('admin.relationship.actions.archive', 'Arquivar')}
              </button>
            </>
          )}

          {prayerRequest.status === 'prayed' && (
            <>
              <button
                type="button"
                className="btn-secondary"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('pending')}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                {isUpdating ? t('admin.relationship.updating', 'Atualizando...') : t('admin.relationship.actions.backToPending', 'Voltar para pendente')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('archived')}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                {t('admin.relationship.actions.archive', 'Arquivar')}
              </button>
            </>
          )}

          {prayerRequest.status === 'archived' && (
            <>
              <button
                type="button"
                className="btn-secondary"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('pending')}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                {isUpdating ? t('admin.relationship.updating', 'Atualizando...') : t('admin.relationship.actions.restoreToPending', 'Restaurar para pendente')}
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('prayed')}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                {t('admin.relationship.actions.markPrayed', 'Colocar em oração')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
