import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminRelationshipService } from '../../../services/AdminRelationshipService';
import { RelationshipNav } from '../../../components/admin/relationship/RelationshipNav';
import { TestimonialDetailModal } from '../../../components/admin/relationship/TestimonialDetailModal';
import { PrayerRequestDetailModal } from '../../../components/admin/relationship/PrayerRequestDetailModal';
import type {
  RelationshipOverviewMetrics,
  RecentRelationshipItem,
  AdminTestimonialItem,
  AdminPrayerRequestItem,
} from '../../../types/Relationship';

export function RelationshipOverview() {
  const { t } = useTranslation(['common']);
  const [metrics, setMetrics] = useState<RelationshipOverviewMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Selected item for detail modals
  const [selectedTestimonial, setSelectedTestimonial] = useState<AdminTestimonialItem | null>(null);
  const [selectedPrayerRequest, setSelectedPrayerRequest] = useState<AdminPrayerRequestItem | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await AdminRelationshipService.getOverview();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load relationship overview:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleOpenItem = (item: RecentRelationshipItem) => {
    if (item.type === 'testimonial') {
      setSelectedTestimonial({
        id: item.id,
        user_id: item.user_id,
        user_full_name: item.user_full_name,
        devotional_id: item.devotional_id,
        devotional_title: item.devotional_title,
        content: item.full_content,
        status: item.status as any,
        created_at: item.created_at,
        updated_at: item.created_at,
      });
    } else {
      setSelectedPrayerRequest({
        id: item.id,
        user_id: item.user_id,
        user_full_name: item.user_full_name,
        devotional_id: item.devotional_id,
        devotional_title: item.devotional_title,
        language: item.language || 'pt-BR',
        request: item.full_content,
        status: item.status as any,
        created_at: item.created_at,
        updated_at: item.created_at,
      });
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

  if (isLoading) {
    return (
      <div>
        <RelationshipNav activeTab="overview" />
        <div className="admin-loading-state">
          <div className="admin-spinner"></div>
          <p>{t('admin.relationship.loadingOverview', 'Carregando Central de Relacionamento...')}</p>
        </div>
      </div>
    );
  }

  if (hasError || !metrics) {
    return (
      <div>
        <RelationshipNav activeTab="overview" />
        <div className="admin-error-state">
          <h3>Oops!</h3>
          <p>{t('admin.relationship.errorLoading', 'Não foi possível carregar a Central de Relacionamento.')}</p>
          <button
            onClick={fetchOverview}
            style={{ marginTop: '16px', padding: '8px 16px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
          >
            {t('admin.relationship.tryAgain', 'Tentar Novamente')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>{t('admin.relationship.title', 'Central de Relacionamento')}</h1>
          <p>{t('admin.relationship.subtitle', 'Um espaço para acompanhar, com cuidado e responsabilidade, aquilo que as pessoas compartilham conosco.')}</p>
        </div>
      </div>

      <RelationshipNav activeTab="overview" />

      {/* 4 Overview Metrics Cards */}
      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {/* Card 1: Testemunhos Pendentes */}
        <div className="admin-card">
          <div className="admin-card-title" style={{ color: '#92400e' }}>
            {t('admin.relationship.cards.pendingTestimonials', 'Testemunhos Pendentes')}
          </div>
          <div className="admin-card-value" style={{ color: metrics.testimonials.pending > 0 ? '#b45309' : 'var(--color-text)' }}>
            {metrics.testimonials.pending}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
            {t('admin.relationship.cards.awaitingReview', 'Aguardando revisão pastoral')}
          </div>
        </div>

        {/* Card 2: Testemunhos Recebidos */}
        <div className="admin-card">
          <div className="admin-card-title">
            {t('admin.relationship.cards.totalTestimonials', 'Testemunhos Recebidos')}
          </div>
          <div className="admin-card-value">
            {metrics.testimonials.total}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
            {metrics.testimonials.reviewed} {t('admin.relationship.status.reviewed', 'revisados')} · {metrics.testimonials.archived} {t('admin.relationship.status.archived', 'arquivados')}
          </div>
        </div>

        {/* Card 3: Pedidos de Oração Pendentes */}
        <div className="admin-card">
          <div className="admin-card-title" style={{ color: '#1e40af' }}>
            {t('admin.relationship.cards.pendingPrayers', 'Pedidos de Oração Pendentes')}
          </div>
          <div className="admin-card-value" style={{ color: metrics.prayer_requests.pending > 0 ? '#1d4ed8' : 'var(--color-text)' }}>
            {metrics.prayer_requests.pending}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
            {t('admin.relationship.cards.awaitingPrayer', 'Aguardando cuidado pastoral')}
          </div>
        </div>

        {/* Card 4: Pedidos de Oração Recebidos */}
        <div className="admin-card">
          <div className="admin-card-title">
            {t('admin.relationship.cards.totalPrayers', 'Pedidos de Oração Recebidos')}
          </div>
          <div className="admin-card-value">
            {metrics.prayer_requests.total}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
            {metrics.prayer_requests.prayed} {t('admin.relationship.status.prayed', 'em oração')} · {metrics.prayer_requests.archived} {t('admin.relationship.status.archived', 'arquivados')}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="admin-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>{t('admin.relationship.recentActivityTitle', 'Atividade Recente')}</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
            {metrics.recent_activity.length} {t('admin.relationship.latestEntries', 'últimos registros')}
          </span>
        </div>

        {metrics.recent_activity.length === 0 ? (
          <div className="admin-empty-state" style={{ minHeight: '150px' }}>
            {t('admin.relationship.noActivity', 'Ainda não recebemos relatos ou pedidos.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.recent_activity.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleOpenItem(item)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      background: item.type === 'testimonial' ? 'rgba(196, 109, 83, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      color: item.type === 'testimonial' ? 'var(--color-accent)' : '#2563eb',
                    }}>
                      {item.type === 'testimonial' ? t('admin.relationship.badge.testimonial', 'Testemunho') : t('admin.relationship.badge.prayer', 'Pedido de Oração')}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-text)' }}>
                      {item.user_full_name || t('admin.relationship.anonymousUser', 'Usuário da Comunidade')}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.4, opacity: 0.85 }}>
                  &ldquo;{item.content_preview}{item.full_content.length > 120 ? '...' : ''}&rdquo;
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  <span>
                    {item.devotional_title ? item.devotional_title : t('admin.relationship.generalDevotional', 'Geral')}
                    {item.language && <> · <span style={{ textTransform: 'uppercase' }}>{item.language}</span></>}
                  </span>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    background: item.status === 'pending' ? '#fef3c7' : item.status === 'prayed' || item.status === 'reviewed' ? '#d1fae5' : '#f3f4f6',
                    color: item.status === 'pending' ? '#92400e' : item.status === 'prayed' || item.status === 'reviewed' ? '#065f46' : '#4b5563',
                  }}>
                    {item.status === 'pending' ? t('admin.relationship.status.pending', 'Pendente')
                      : item.status === 'reviewed' ? t('admin.relationship.status.reviewed', 'Revisado')
                      : item.status === 'prayed' ? t('admin.relationship.status.prayed', 'Em oração')
                      : t('admin.relationship.status.archived', 'Arquivado')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modals */}
      <TestimonialDetailModal
        testimonial={selectedTestimonial}
        onClose={() => setSelectedTestimonial(null)}
        onStatusUpdated={fetchOverview}
      />

      <PrayerRequestDetailModal
        prayerRequest={selectedPrayerRequest}
        onClose={() => setSelectedPrayerRequest(null)}
        onStatusUpdated={fetchOverview}
      />
    </div>
  );
}
