import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminUserService } from '../../../services/AdminUserService';
import type { AdminUserItem, AppRole } from '../../../types/AdminUser';

interface UserRoleModalProps {
  user: AdminUserItem | null;
  canManageRoles: boolean;
  onClose: () => void;
  onChanged: () => void;
}

const ALL_ROLES: AppRole[] = ['super_admin', 'admin', 'editor', 'moderator', 'analyst'];

const ROLE_STYLES: Record<AppRole, { bg: string; color: string; label: string }> = {
  super_admin: { bg: '#fee2e2', color: '#991b1b', label: 'Super Admin' },
  admin: { bg: '#dbeafe', color: '#1e40af', label: 'Admin' },
  editor: { bg: '#ede9fe', color: '#5b21b6', label: 'Editor' },
  moderator: { bg: '#d1fae5', color: '#065f46', label: 'Moderador' },
  analyst: { bg: '#f3f4f6', color: '#4b5563', label: 'Analista' },
};

export function RoleBadge({ role }: { role: AppRole }) {
  const style = ROLE_STYLES[role] || { bg: '#f3f4f6', color: '#4b5563', label: role };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        background: style.bg,
        color: style.color,
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}

export function UserRoleModal({ user, canManageRoles, onClose, onChanged }: UserRoleModalProps) {
  const { t } = useTranslation(['common']);
  const [busyRole, setBusyRole] = useState<AppRole | null>(null);
  const [addingRole, setAddingRole] = useState<AppRole | ''>('');
  const [error, setError] = useState('');

  if (!user) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleRevoke = async (role: AppRole) => {
    setBusyRole(role);
    setError('');
    try {
      await AdminUserService.revokeRole(user.id, role);
      onChanged();
    } catch (err: any) {
      setError('Erro ao remover papel: ' + err.message);
    } finally {
      setBusyRole(null);
    }
  };

  const handleAssign = async () => {
    if (!addingRole) return;
    setBusyRole(addingRole);
    setError('');
    try {
      await AdminUserService.assignRole(user.id, addingRole);
      setAddingRole('');
      onChanged();
    } catch (err: any) {
      setError('Erro ao adicionar papel: ' + err.message);
    } finally {
      setBusyRole(null);
    }
  };

  const availableRoles = ALL_ROLES.filter(r => !user.roles.includes(r));

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
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: '16px',
          width: '100%', maxWidth: '480px', position: 'relative',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--color-accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
          }}>
            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.full_name || 'Sem nome'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: 'var(--color-text-light)', marginBottom: '2px' }}>Cadastro</div>
            <div style={{ color: 'var(--color-text)' }}>{formatDate(user.created_at)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-light)', marginBottom: '2px' }}>Último acesso</div>
            <div style={{ color: 'var(--color-text)' }}>{formatDate(user.last_sign_in_at)}</div>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 10px', color: 'var(--color-text)' }}>Papéis</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: canManageRoles ? '16px' : 0 }}>
            {user.roles.length === 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Nenhum papel atribuído.</span>
            )}
            {user.roles.map(role => (
              <span key={role} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <RoleBadge role={role} />
                {canManageRoles && (
                  <button
                    type="button"
                    disabled={busyRole === role}
                    onClick={() => handleRevoke(role)}
                    aria-label={`Remover papel ${role}`}
                    style={{
                      border: 'none', background: 'none', color: 'var(--color-text-light)',
                      cursor: busyRole === role ? 'not-allowed' : 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: 0,
                    }}
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>

          {canManageRoles && availableRoles.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={addingRole}
                onChange={e => setAddingRole(e.target.value as AppRole)}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: '8px',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', fontSize: '0.85rem',
                }}
              >
                <option value="">Adicionar papel…</option>
                {availableRoles.map(r => (
                  <option key={r} value={r}>{ROLE_STYLES[r].label}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!addingRole || busyRole !== null}
                onClick={handleAssign}
                style={{
                  width: 'auto',
                  flexShrink: 0,
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  cursor: !addingRole || busyRole !== null ? 'not-allowed' : 'pointer',
                  opacity: !addingRole || busyRole !== null ? 0.6 : 1,
                }}
              >
                {busyRole === addingRole ? 'Salvando…' : 'Adicionar'}
              </button>
            </div>
          )}

          {!canManageRoles && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '8px' }}>
              Somente super_admin pode alterar papéis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
