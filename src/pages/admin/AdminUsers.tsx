import { useEffect, useState } from 'react';
import { AdminUserService } from '../../services/AdminUserService';
import { UserRoleModal, RoleBadge } from '../../components/admin/users/UserRoleModal';
import type { AdminUserItem, PaginatedUsersResult, TenantRole, WhatsappFilter } from '../../types/AdminUser';
import '../../styles/admin-users.css';

const WHATSAPP_CHIPS: { key: WhatsappFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'granted', label: 'Autorizaram' },
  { key: 'none', label: 'Não autorizaram' },
  { key: 'revoked', label: 'Revogaram' },
  { key: 'granted_no_phone', label: 'Autorizaram sem telefone' },
];

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// +5511987654321 -> +55 11 98765-4321 (formato BR; outros países ficam como vieram).
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '—';
  const m = raw.replace(/\s/g, '').match(/^\+?55(\d{2})(9?\d{4})(\d{4})$/);
  return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : raw;
}

function WhatsappTag({ user }: { user: AdminUserItem }) {
  const w = user.whatsapp;
  if (!w) return null;
  if (w.state === 'granted') {
    return user.phone
      ? <span className="au-tag au-tag--ok">Autorizou · {formatDate(w.at)}</span>
      : <span className="au-tag au-tag--warn">Autorizou · sem telefone</span>;
  }
  if (w.state === 'revoked') return <span className="au-tag au-tag--off">Revogou · {formatDate(w.at)}</span>;
  return <span className="au-tag au-tag--none">Não autorizou</span>;
}

export function AdminUsers() {
  const [result, setResult] = useState<PaginatedUsersResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [whatsapp, setWhatsapp] = useState<WhatsappFilter>('all');
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [exporting, setExporting] = useState(false);

  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const canManageRoles = myRoles.includes('super_admin');

  useEffect(() => {
    AdminUserService.getMyRoles().then(setMyRoles);
    AdminUserService.getRoles().then(setRoles).catch(() => setRoles([]));
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setResult(await AdminUserService.getUsers({ search, page, pageSize: 20, whatsapp, roleId: roleId || undefined }));
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
  }, [search, page, whatsapp, roleId]);

  const canSeeWhatsapp = !!result?.canSeeWhatsapp;
  const filtersActive = !!search || whatsapp !== 'all' || !!roleId;

  const changeFilter = <T,>(set: (v: T) => void, v: T) => { setPage(1); set(v); };
  const clearAll = () => { setSearchInput(''); setSearch(''); setWhatsapp('all'); setRoleId(''); setPage(1); };

  const handleExport = async () => {
    setExporting(true);
    try {
      await AdminUserService.exportCsv({ search, whatsapp, roleId: roleId || undefined });
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao exportar.');
    } finally {
      setExporting(false);
    }
  };

  const handleRoleChanged = async () => {
    await fetchUsers();
    if (selectedUser) {
      const updated = await AdminUserService.getUsers({ search, page, pageSize: 20, whatsapp, roleId: roleId || undefined });
      setResult(updated);
      const fresh = updated.data.find(u => u.id === selectedUser.id);
      if (fresh) setSelectedUser(fresh);
    }
  };

  return (
    <div className="au">
      <div className="admin-header">
        <div>
          <h1>Usuários</h1>
          <p>Contas cadastradas, papéis administrativos e quem autorizou receber mensagens pelo WhatsApp.</p>
        </div>
      </div>

      <div className="au-filters">
        <form className="au-search" onSubmit={e => { e.preventDefault(); changeFilter(setSearch, searchInput); }} role="search">
          <input
            type="search"
            aria-label="Buscar usuários"
            placeholder={canSeeWhatsapp ? 'Buscar por nome, e-mail ou telefone…' : 'Buscar por nome ou e-mail…'}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="au-btn au-btn--primary">Buscar</button>
        </form>

        {canSeeWhatsapp && (
          <div className="au-group" role="group" aria-label="Filtrar por WhatsApp">
            <span className="au-group__label">WhatsApp</span>
            <div className="au-chips">
              {WHATSAPP_CHIPS.map(c => (
                <button
                  key={c.key} type="button" className="au-chip" aria-pressed={whatsapp === c.key}
                  onClick={() => changeFilter(setWhatsapp, c.key)}
                >
                  {c.label}
                  {result?.counts && <span className="au-chip__n">{result.counts[c.key]}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {roles.length > 0 && (
          <div className="au-group" role="group" aria-label="Filtrar por papel">
            <span className="au-group__label">Papel</span>
            <div className="au-chips">
              <button type="button" className="au-chip" aria-pressed={!roleId} onClick={() => changeFilter(setRoleId, '')}>Todos</button>
              {roles.map(r => (
                <button key={r.id} type="button" className="au-chip" aria-pressed={roleId === r.id} onClick={() => changeFilter(setRoleId, r.id)}>{r.name}</button>
              ))}
            </div>
          </div>
        )}

        <div className="au-bar">
          <span className="au-bar__count" aria-live="polite">
            {result ? `${result.total} ${result.total === 1 ? 'usuário' : 'usuários'}` : ''}
          </span>
          {filtersActive && <button type="button" className="au-btn" onClick={clearAll}>Limpar filtros</button>}
          {canSeeWhatsapp && (
            <button type="button" className="au-btn" onClick={handleExport} disabled={exporting || !result?.total}>
              {exporting ? 'Gerando…' : 'Exportar CSV'}
            </button>
          )}
        </div>
      </div>

      {isLoading && !result ? (
        <div className="admin-loading-state" style={{ minHeight: '200px' }}>
          <div className="admin-spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      ) : errorMessage ? (
        <div className="admin-error-state">
          <p>{errorMessage}</p>
          <button className="au-btn au-btn--primary" onClick={fetchUsers}>Tentar novamente</button>
        </div>
      ) : !result || result.data.length === 0 ? (
        <div className="admin-empty-state" style={{ minHeight: '200px' }}>
          {filtersActive ? 'Nenhum usuário com esses filtros.' : 'Nenhum usuário cadastrado ainda.'}
        </div>
      ) : (
        <div className={`admin-table-responsive au-table-wrap${isLoading ? ' au-table-wrap--loading' : ''}`}>
          <table className="au-table">
            <thead>
              <tr>
                <th>Usuário</th>
                {canSeeWhatsapp && <th>Telefone</th>}
                {canSeeWhatsapp && <th>WhatsApp</th>}
                <th>Papel</th>
                <th>Cadastro</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {result.data.map(user => (
                <tr key={user.id}>
                  <td data-label="Usuário" className="au-cell-user">
                    <div className="au-name" title={user.full_name ?? undefined}>{user.full_name || 'Sem nome'}</div>
                    <div className="au-email" title={user.email ?? undefined}>{user.email || '—'}</div>
                  </td>
                  {canSeeWhatsapp && <td data-label="Telefone" className="au-nowrap">{formatPhone(user.phone)}</td>}
                  {canSeeWhatsapp && <td data-label="WhatsApp" className="au-nowrap"><WhatsappTag user={user} /></td>}
                  <td data-label="Papel" className="au-nowrap">
                    {user.role ? <RoleBadge role={user.role.name} /> : <span className="au-muted">—</span>}
                  </td>
                  <td data-label="Cadastro" className="au-nowrap au-muted">{formatDate(user.created_at)}</td>
                  <td data-label="Ação" className="au-nowrap au-cell-action">
                    <button className="au-btn" onClick={() => setSelectedUser(user)}>Ver detalhes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalPages > 1 && (
        <div className="au-pager">
          <span>Página {result.page} de {result.totalPages}</span>
          <div>
            <button className="au-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <button className="au-btn" disabled={page >= result.totalPages} onClick={() => setPage(p => p + 1)}>Próximo →</button>
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
