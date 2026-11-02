import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from './Sheet';
import { FamilyService, type FamilyNotice } from '../services/FamilyService';
import { illumineAuth } from '../lib/illumine';
import { getTodayInSaoPaulo } from '../utils/date';
import '../styles/family.css';

/** Texto do aviso: quem registrou na mesa, ou o grupo que completou à distância. */
function useNoticeText() {
  const { t } = useTranslation('common');
  return (n: FamilyNotice) => {
    const d = (n.data ?? {}) as { by?: string | null; mode?: string };
    return d.mode === 'together' && d.by
      ? t('groupNotice.together', { by: d.by, family: n.familyName, defaultValue: '{{by}} registrou a leitura de hoje: o grupo {{family}} leu junto.' })
      : t('groupNotice.remote', { family: n.familyName, defaultValue: 'O grupo {{family}} leu junto hoje: todos completaram a leitura.' });
  };
}

/** Lista os avisos do grupo (menu Mais) e, ao abrir, marca todos como lidos. */
export function GroupNoticesSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('common');
  const text = useNoticeText();
  const [notices, setNotices] = useState<FamilyNotice[] | null>(null);
  useEffect(() => {
    FamilyService.notices().then((r) => {
      setNotices(r.notices);
      if (r.unread > 0) FamilyService.markNoticesRead().then(() => window.dispatchEvent(new Event('notices:changed'))).catch(() => {});
    }).catch(() => setNotices([]));
  }, []);
  return (
    <Sheet title={t('groupNotice.title', 'Avisos do grupo')} onClose={onClose}>
      {notices === null ? <p className="fam-note">…</p> : notices.length === 0 ? (
        <p className="fam-note">{t('groupNotice.empty', 'Quando o grupo ler junto, o aviso aparece aqui.')}</p>
      ) : (
        <div className="notice-list">
          {notices.map((n) => (
            <div key={n.id} className={`notice-item${n.read ? '' : ' is-new'}`}>
              <b>🎉 {t('groupNotice.heading', 'O grupo leu junto hoje')}</b>
              <p>{text(n)}</p>
              <small>{new Date(n.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {n.familyName}</small>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

/** Faixa leve no topo: aparece quando há um aviso de hoje ainda não lido; some sozinha em poucos segundos. */
export function GroupCelebrationBanner() {
  const text = useNoticeText();
  const [notice, setNotice] = useState<FamilyNotice | null>(null);
  useEffect(() => {
    if (!illumineAuth.isAuthenticated()) return;
    let alive = true;
    const load = () => FamilyService.notices().then((r) => {
      if (!alive) return;
      const today = getTodayInSaoPaulo();
      setNotice(r.notices.find((n) => !n.read && n.day === today) ?? null);
    }).catch(() => {});
    load();
    const on = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', on);
    return () => { alive = false; document.removeEventListener('visibilitychange', on); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(id);
  }, [notice]);
  if (!notice) return null;
  return (
    <div className="celebration-banner" role="status">
      <span>🎉 {text(notice)}</span>
      <button type="button" aria-label="×" onClick={() => setNotice(null)}>×</button>
    </div>
  );
}
