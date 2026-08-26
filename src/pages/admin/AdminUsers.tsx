import { useEffect, useState } from 'react';
import { AdminUserService } from '../../services/AdminUserService';
import { UserRoleModal, RoleBadge } from '../../components/admin/users/UserRoleModal';
import type { AdminUserItem, PaginatedUsersResult } from '../../types/AdminUser';

export function AdminUsers() {
  const [result, setResult] = useState<PaginatedUsersResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  const canManageRoles = myRoles.includes('super_admin');

  useEffect(() => {
    AdminUserService.getMyRoles().then(setMyRoles);
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await AdminUserService.getUsers({ search, page, pageSize: 20 });
      setResult(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setErrorMessage(err.message || 'Erro ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const handleRoleChanged = async () => {
    await fetchUsers();
    if (selectedUser) {
      const updated = await AdminUserService.getUsers({ search, page, pageSize: 20 });
      setResult(updated);
      const fresh = updated.data.find(u => u.id === selectedUser.id);
      if (fresh) setSelectedUser(fresh);
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Usuários</h1>
          <p>Diretório de contas cadastradas e gestão de papéis administrativos.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        backgroundColor: 'var(--color-bg)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
          <button
            type="submit"
            style={{
              width: 'auto',
              flexShrink: 0,
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--color-accent)',
              color: '#fff',
              cursor: 'pointer',
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

      {isLoading ? (
        <div className="admin-loading-state" style={{ minHeight: '200px' }}>
          <div className="admin-spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      ) : errorMessage ? (
        <div className="admin-error-state">
          <p>{errorMessage}</p>
          <button onClick={fetchUsers} style={{ marginTop: '8px', padding: '6px 12px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
            Tentar novamente
          </button>
        </div>
      ) : !result || result.data.length === 0 ? (
        <div className="admin-empty-state" style={{ minHeight: '200px' }}>
          {search ? 'Nenhum usuário corresponde à busca.' : 'Nenhum usuário cadastrado ainda.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary, rgba(0,0,0,0.02))' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Usuário</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Papéis</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Cadastro</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)' }}>Último acesso</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-light)', textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map(user => (
                <tr
                  key={user.id}
                  style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{user.full_name || 'Sem nome'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {user.roles.length > 0
                        ? user.roles.map(role => <RoleBadge key={role} role={role} />)
                        : <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                    {formatDate(user.last_sign_in_at)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => setSelectedUser(user)}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)',
                        background: 'transparent', color: 'var(--color-text)', fontSize: '0.85rem',
                        cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      Ver detalhes
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
            Página {result.page} de {result.totalPages} ({result.total} usuários)
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

      <UserRoleModal
        user={selectedUser}
        canManageRoles={canManageRoles}
        onClose={() => setSelectedUser(null)}
        onChanged={handleRoleChanged}
      />
    </div>
  );
}
