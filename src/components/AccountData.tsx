import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineFetch } from '../lib/illumine';
import { useAuth } from '../context/AuthContext';
import './AccountData.css';

/** Seus dados: baixar uma cópia e excluir a conta (LGPD). A exclusão é imediata e confirmada por senha. */
export function AccountData() {
  const { t } = useTranslation('profile');
  const { signOut } = useAuth();
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const download = async () => {
    setBusy('export'); setError(''); setMessage('');
    try {
      const res = await illumineFetch('/users/me/export');
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meus-dados-3minutes.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage(t('accountData.exported', 'Pronto! O arquivo com os seus dados foi baixado.'));
    } catch {
      setError(t('accountData.exportError', 'Não foi possível baixar agora. Tente de novo em instantes.'));
    } finally { setBusy(null); }
  };

  const remove = async () => {
    setBusy('delete'); setError('');
    try {
      const res = await illumineFetch('/users/me', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true, ...(password ? { password } : {}) }),
      });
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        setError(body.error === 'INVALID_PASSWORD'
          ? t('accountData.wrongPassword', 'Senha incorreta.')
          : t('accountData.notDeletable', 'Esta conta tem acesso de equipe. Escreva para o nosso contato para excluí-la.'));
        return;
      }
      if (!res.ok && res.status !== 202) throw new Error(String(res.status));
      await signOut();
    } catch {
      setError(t('accountData.deleteError', 'Não foi possível excluir agora. Tente de novo em instantes.'));
    } finally { setBusy(null); }
  };

  return (
    <section className="pf-group acd">
      <h3 className="pf-title">{t('accountData.title', 'Seus dados')}</h3>
      <p className="acd__hint">{t('accountData.hint', 'Você pode baixar uma cópia do que guardamos sobre você ou excluir a conta.')}</p>
      <button type="button" className="acd__btn" onClick={download} disabled={busy !== null}>
        {busy === 'export' ? t('accountData.preparing', 'Preparando…') : t('accountData.download', 'Baixar meus dados')}
      </button>
      {!confirming ? (
        <button type="button" className="acd__link" onClick={() => setConfirming(true)}>{t('accountData.delete', 'Excluir minha conta')}</button>
      ) : (
        <div className="acd__confirm" role="alertdialog" aria-labelledby="acd-t">
          <p id="acd-t" className="acd__warn">
            {t('accountData.warning', 'Isto apaga a sua conta e tudo o que está nela: grupos que você criou, perfis de crianças, pedidos de oração e histórico de leitura. Não dá para desfazer. Se você criou um grupo com outros membros, ele passa para outra pessoa do grupo.')}
          </p>
          <label className="acd__label" htmlFor="acd-pw">{t('accountData.password', 'Digite sua senha para confirmar (se você entra com e-mail e senha)')}</label>
          <input id="acd-pw" className="acd__input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="acd__actions">
            <button type="button" className="acd__btn" onClick={() => { setConfirming(false); setPassword(''); setError(''); }} disabled={busy !== null}>{t('accountData.cancel', 'Cancelar')}</button>
            <button type="button" className="acd__danger" onClick={remove} disabled={busy !== null}>
              {busy === 'delete' ? t('accountData.deleting', 'Excluindo…') : t('accountData.confirm', 'Excluir para sempre')}
            </button>
          </div>
        </div>
      )}
      {message && <p className="acd__ok" role="status">{message}</p>}
      {error && <p className="acd__err" role="alert">{error}</p>}
    </section>
  );
}
