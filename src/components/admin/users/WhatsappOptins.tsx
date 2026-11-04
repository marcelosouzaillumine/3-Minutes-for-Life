import { useEffect, useState } from 'react';
import { AdminUserService, type WhatsappOptinsResult } from '../../../services/AdminUserService';
import { formatPhone } from '../../../utils/phone';

const PURPOSE_LABELS: Record<string, string> = { devotional: 'Devocional', pastoral: 'Pastoral', campaign: 'Campanhas', system: 'Sistema' };
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const PAGE_SIZE = 20;

/** Quem autorizou receber mensagens pelo WhatsApp, com o telefone cadastrado. */
export function WhatsappOptins() {
  const [result, setResult] = useState<WhatsappOptinsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    AdminUserService.getWhatsappOptins({ search, page, pageSize: PAGE_SIZE })
      .then((r) => { if (alive) setResult(r); })
      .catch(() => { if (alive) setError('Não foi possível carregar a lista agora.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [search, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchInput); }} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text" placeholder="Buscar por nome, e-mail ou telefone..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.9rem' }}
        />
        <button type="submit" style={{ width: 'auto', padding: '10px 18px', border: 'none', borderRadius: '8px', background: 'var(--color-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Buscar</button>
      </form>

      {result && !error && (
        <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
          <b style={{ color: 'var(--color-text)' }}>{result.total}</b> {result.total === 1 ? 'pessoa autorizou' : 'pessoas autorizaram'} receber mensagens pelo WhatsApp
          {result.withoutPhone > 0 && <> · <b style={{ color: 'var(--color-text)' }}>{result.withoutPhone}</b> sem telefone cadastrado (não dá para escrever para elas)</>}
        </p>
      )}

      {loading ? (
        <div className="admin-loading-state" style={{ minHeight: '160px' }}><div className="admin-spinner"></div><p>Carregando...</p></div>
      ) : error ? (
        <div className="admin-error-state"><p>{error}</p></div>
      ) : !result || result.users.length === 0 ? (
        <div className="admin-empty-state" style={{ minHeight: '160px' }}>{search ? 'Ninguém corresponde à busca.' : 'Ninguém autorizou receber mensagens pelo WhatsApp ainda.'}</div>
      ) : (
        <div className="admin-table-responsive" style={{ overflowX: 'auto', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Pessoa', 'Telefone', 'Autorizou para', 'Desde'].map((h) => <th key={h} style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.users.map((u) => (
                <tr key={u.userId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td data-label="Pessoa" style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{u.name || 'Sem nome'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{u.email}</div>
                  </td>
                  <td data-label="Telefone" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {u.phone ? formatPhone(u.phone) : <span style={{ color: '#b42318' }}>sem telefone</span>}
                  </td>
                  <td data-label="Autorizou para" style={{ padding: '12px 16px' }}>{u.purposes.map((p) => PURPOSE_LABELS[p] ?? p).join(', ')}</td>
                  <td data-label="Desde" style={{ padding: '12px 16px', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>{formatDate(u.since)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Página {page} de {totalPages}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', opacity: page <= 1 ? 0.5 : 1 }}>&larr; Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', opacity: page >= totalPages ? 0.5 : 1 }}>Próximo &rarr;</button>
          </div>
        </div>
      )}
    </div>
  );
}
