import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminRelationshipService } from '../../../services/AdminRelationshipService';
import { RelationshipNav } from '../../../components/admin/relationship/RelationshipNav';
import { TestimonialDetailModal } from '../../../components/admin/relationship/TestimonialDetailModal';
import type { AdminTestimonialItem, PaginatedResult } from '../../../types/Relationship';

export function RelationshipTestimonials() {
  const { t } = useTranslation(['common']);
  const [result, setResult] = useState<PaginatedResult<AdminTestimonialItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Filters State
  const [status, setStatus] = useState<string>('all');
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Selected item for detail modal
  const [selectedTestimonial, setSelectedTestimonial] = useState<AdminTestimonialItem | null>(null);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await AdminRelationshipService.getTestimonials({
        status,
        period,
        search: searchTerm,
        page,
        pageSize: 15,
      });
      setResult(data);
    } catch (err) {
      console.error("Failed to load testimonials:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [status, period, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTestimonials();
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'pending':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 600 }}>{t('admin.relationship.status.pending', 'Pendente')}</span>;
      case 'reviewed':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', fontWeight: 600 }}>{t('admin.relationship.status.reviewed', 'Revisado')}</span>;
      case 'archived':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#f3f4f6', color: '#4b5563', fontSize: '0.75rem', fontWeight: 600 }}>{t('admin.relationship.status.archived', 'Arquivado')}</span>;
      default:
        return <span>{s}</span>;
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>{t('admin.relationship.testimonialsTitle', 'Gestão de Testemunhos')}</h1>
          <p>{t('admin.relationship.testimonialsSubtitle', 'Acompanhe relatos e testemunhos compartilhados pela comunidade.')}</p>
        </div>
      </div>

      <RelationshipNav activeTab="testimonials" />

      {/* Filter Bar */}
      <div style={{
        backgroundColor: 'var(--color-bg)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        {/* Top Controls Grid: Dropdowns + Search */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'flex-end',
        }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('admin.relationship.columns.status', 'Status')}
            </label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">{t('admin.relationship.filters.allStatuses', 'Todos os Status')}</option>
              <option value="pending">{t('admin.relationship.status.pending', 'Pendentes')}</option>
              <option value="reviewed">{t('admin.relationship.status.reviewed', 'Revisados')}</option>
              <option value="archived">{t('admin.relationship.status.archived', 'Arquivados')}</option>
            </select>
          </div>

          {/* Period Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('admin.relationship.filters.periodLabel', 'Período')}
            </label>
            <select
              value={period}
              onChange={e => { setPeriod(e.target.value as any); setPage(1); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">{t('admin.relationship.filters.allPeriod', 'Todo o Período')}</option>
              <option value="today">{t('admin.relationship.filters.today', 'Hoje')}</option>
              <option value="7d">{t('admin.relationship.filters.last7d', 'Últimos 7 dias')}</option>
              <option value="30d">{t('admin.relationship.filters.last30d', 'Últimos 30 dias')}</option>
            </select>
          </div>

          {/* Search Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('common:search', 'Busca')}
            </label>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder={t('admin.relationship.searchPlaceholder', 'Buscar no relato...')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-light)',
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.9rem', textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {t('common:search', 'Buscar')}
              </button>
            </form>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {(status !== 'all' || period !== 'all' || searchTerm.trim()) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
            <button
              onClick={() => {
                setStatus('all');
                setPeriod('all');
                setSearchTerm('');
                setPage(1);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
              }}
            >
              &times; {t('admin.relationship.filters.clear', 'Limpar filtros')}
            </button>
          </div>
        )}
      </div>

      {/* Content Table */}
      {isLoading ? (
        <div className="admin-loading-state" style={{ minHeight: '200px' }}>
          <div className="admin-spinner"></div>
          <p>{t('admin.relationship.loadingTestimonials', 'Carregando testemunhos...')}</p>
        </div>
      ) : hasError ? (
        <div className="admin-error-state">
          <p>{t('admin.relationship.errorLoading', 'Erro ao carregar testemunhos.')}</p>
          <button onClick={fetchTestimonials} style={{ marginTop: '8px', padding: '6px 12px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
            {t('admin.relationship.tryAgain', 'Tentar Novamente')}
          </button>
        </div>
      ) : !result || result.data.length === 0 ? (
        <div className="admin-empty-state" style={{ minHeight: '200px' }}>
          {status !== 'all' || searchTerm ? t('admin.relationship.noResultsFiltered', 'Nenhum registro corresponde aos filtros selecionados.') : t('admin.relationship.noTestimonials', 'Ainda não recebemos testemunhos.')}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.02))' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>{t('admin.relationship.columns.date', 'Data')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>{t('admin.relationship.columns.user', 'Usuário')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>{t('admin.relationship.columns.devotional', 'Devocional')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>{t('admin.relationship.columns.preview', 'Relato')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>{t('admin.relationship.columns.status', 'Status')}</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)', textAlign: 'right' }}>{t('admin.relationship.columns.action', 'Ação')}</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                    {formatDate(item.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                    {item.user_full_name || t('admin.relationship.anonymousUser', 'Usuário da Comunidade')}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-light)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.devotional_title || t('admin.relationship.generalDevotional', 'Geral')}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.content}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {getStatusBadge(item.status)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => setSelectedTestimonial(item)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      {t('admin.relationship.actions.viewReport', 'Ver relato')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {result && result.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
            {t('admin.relationship.paginationTotal', { total: result.total, page: result.page, totalPages: result.totalPages, defaultValue: `Mostrando página ${result.page} de ${result.totalPages} (${result.total} registros)` })}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              &larr; {t('common:previous', 'Anterior')}
            </button>
            <button
              disabled={page >= result.totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                cursor: page >= result.totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= result.totalPages ? 0.5 : 1,
              }}
            >
              {t('common:next', 'Próximo')} &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <TestimonialDetailModal
        testimonial={selectedTestimonial}
        onClose={() => setSelectedTestimonial(null)}
        onStatusUpdated={fetchTestimonials}
      />
    </div>
  );
}
