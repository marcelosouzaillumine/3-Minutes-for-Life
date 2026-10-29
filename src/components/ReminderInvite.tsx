import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineFetch, illumineAuth } from '../lib/illumine';

const DISMISSED_KEY = 'reminder:invite:dismissed';

const read = () => { try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; } };
const remember = () => { try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* sem armazenamento */ } };

/** Convite discreto, no fim da leitura, para receber o devocional por e-mail às 7h. Um "sim" explícito. */
export function ReminderInvite() {
  const { t } = useTranslation('common');
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (read() || !illumineAuth.isAuthenticated()) return;
    let alive = true;
    illumineFetch('/consent')
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        const row = body?.consents?.email?.devotional;
        // Só convida quem nunca respondeu: sem registro explícito de sim ou não.
        if (alive && body && row?.updatedAt == null) setShow(true);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!show) return null;
  if (done) return <p className="reminder-invite__ok">{t('reminder.done', 'Pronto. A partir de amanhã você recebe o devocional às 7h.')}</p>;

  const answer = async (granted: boolean) => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await illumineFetch('/consent', {
        method: 'PUT',
        body: JSON.stringify({ consents: [{ channel: 'email', purpose: 'devotional', granted }] }),
      });
      if (!res.ok) throw new Error(String(res.status));
      remember();
      if (granted) setDone(true); else setShow(false);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  return (
    <div className="reminder-invite">
      <p className="reminder-invite__text">{t('reminder.ask', 'Quer receber o devocional por e-mail, todo dia às 7h?')}</p>
      <div className="reminder-invite__actions">
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => answer(true)}>{t('reminder.yes', 'Quero receber')}</button>
        <button type="button" className="reminder-invite__no" disabled={busy} onClick={() => answer(false)}>{t('reminder.no', 'Agora não')}</button>
      </div>
      {failed && <p className="reminder-invite__err">{t('reminder.error', 'Não foi possível salvar. Tente de novo.')}</p>}
      <p className="reminder-invite__note">{t('reminder.note', 'Você pode mudar isso a qualquer momento no Perfil.')}</p>
    </div>
  );
}
