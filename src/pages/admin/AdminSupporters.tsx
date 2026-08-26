import { useEffect, useState } from 'react';
import { AdminSupporterService } from '../../services/AdminSupporterService';
import type { AdminSupporterItem, PaginatedSupportersResult, SupporterStatus } from '../../types/AdminSupporter';

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'Única',
  recurring: 'Recorrente',
};

const CONTRIBUTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  completed: 'Concluída',
  active: 'Ativa',
  canceled: 'Cancelada',
  failed: 'Falhou',
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: SupporterStatus }) {
  const isActive = status === 'active';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: isActive ? '#d1fae5' : '#f3f4f6',
        color: isActive ? '#065f46' : '#6b7280',
      }}
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  );
}

export function AdminSupporters() {
  const [result, setResult] = useState<PaginatedSupportersResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SupporterStatus | ''>('');
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchSupporters = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await AdminSupporterService.getSupporters({ search, status, page, pageSize: 20 });
      setResult(data);
    } catch (err: any) {
      console.error('Failed to load supporters:', err);
      setErrorMessage(err.message || 'Erro ao carregar apoiadores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupporters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleToggleStatus = async (supporter: AdminSupporterItem) => {
    const nextStatus: SupporterStatus = supporter.status === 'active' ? 'inactive' : 'active';
    const label = nextStatus === 'active' ? 'ativar' : 'desativar';
    if (!window.confirm(`Confirma ${label} este apoiador manualmente?`)) return;

    setBusyId(supporter.supporter_id);
    try {
      await AdminSupporterService.setSupporterStatus(supporter.supporter_id, nextStatus);
      await fetchSupporters();
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const totalActive = result?.data.filter(s => s.status === 'active').length ?? 0;

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Apoiadores</h1>
          <p>Acompanhamento de contribuições processadas via Asaas — vinculado a pagamentos, assinaturas e status de apoio.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'var(--color-bg)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <svg
              width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={status}
            onChange={e => { setStatus(e.target.value as SupporterStatus | ''); setPage(1); }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <button
            type="submit"
            style={{
              width: 'auto', flexShrink: 0, padding: '10px 18px', fontSize: '0.9rem', fontWeight: 600,
              whiteSpace: 'nowrap', border: 'none', borderRadius: '8px',
              background: 'var(--color-accent)', color: '#fff', cursor: 'pointer',
            }}
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              style={{ flexShrink: 0, padding: '10px 14px', fontSize: '0.9rem', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {result && result.data.length > 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '-12px', marginBottom: '16px' }}>
          {totalActive} de {result.data.length} nesta página estão ativos.
        </p>
      )}

      {isLoading ? (
        <div className="admin-loading-state" style={{ minHeight: '200px' }}>
          <div className="admin-spinner"></div>
          <p>Carregando apoiadores...</p>
        </div>
      ) : errorMessage ? (
        <div className="admin-error-state">
          <p>{errorMessage}</p>
          <button onClick={fetchSupporters} style={{ marginTop: '8px', padding: '6px 12px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
            Tentar novamente
          </button>
        </div>
      ) : !result || result.data.length === 0 ? (
        <div className="admin-empty-state" style={{ minHeight: '200px' }}>
          {search || status ? 'Nenhum apoiador corresponde aos filtros.' : 'Nenhum apoiador registrado ainda.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.02))' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Apoiador</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Total contribuído</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Última contribuição</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Apoiador desde</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)', textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map(supporter => (
                <tr
                  key={supporter.supporter_id}
                  style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{supporter.full_name || 'Sem nome'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{supporter.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={supporter.status} />
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{formatBRL(supporter.total_contributed_cents)}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                      {supporter.contribution_count} {supporter.contribution_count === 1 ? 'contribuição' : 'contribuições'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {supporter.last_contribution_at ? (
                      <>
                        <div style={{ color: 'var(--color-text)' }}>
                          {supporter.last_contribution_amount_cents != null ? formatBRL(supporter.last_contribution_amount_cents) : '—'}
                          {' · '}
                          {FREQUENCY_LABELS[supporter.last_contribution_frequency || ''] || supporter.last_contribution_frequency || '—'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                          {CONTRIBUTION_STATUS_LABELS[supporter.last_contribution_status || ''] || supporter.last_contribution_status}
                          {' · '}
                          {formatDate(supporter.last_contribution_at)}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--color-text-light)' }}>Nenhuma ainda</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                    {formatDate(supporter.supporter_since)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => handleToggleStatus(supporter)}
                      disabled={busyId === supporter.supporter_id}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)',
                        background: 'transparent', color: 'var(--color-text)', fontSize: '0.85rem',
                        cursor: busyId === supporter.supporter_id ? 'not-allowed' : 'pointer', fontWeight: 500,
                        opacity: busyId === supporter.supporter_id ? 0.6 : 1,
                      }}
                    >
                      {busyId === supporter.supporter_id
                        ? 'Salvando…'
                        : supporter.status === 'active' ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
            Página {result.page} de {result.totalPages} ({result.total} apoiadores)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
            >
              &larr; Anterior
            </button>
            <button
              disabled={page >= result.totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', cursor: page >= result.totalPages ? 'not-allowed' : 'pointer', opacity: page >= result.totalPages ? 0.5 : 1 }}
            >
              Próximo &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
