import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { BANDS, FamilyService, type Band, type Family } from '../services/FamilyService';
import { openRitual } from './Family';
import '../styles/family.css';

const bandLabel = (b: Band) => b.replace('-', ' a ');
const initials = (name: string) => name.trim().slice(0, 2).replace(/^./, (c) => c.toUpperCase());

/** Aba Crianças: tudo de criança num lugar só. Quem lê, em que idade e o começo da leitura feita para elas. */
export function Kids() {
  const { t } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`kids.${k}`, { defaultValue: d, ...o });
  const signedIn = illumineAuth.isAuthenticated();
  const [family, setFamily] = useState<Family | null>(null);
  const [loaded, setLoaded] = useState(!signedIn);
  const [nick, setNick] = useState('');
  const [band, setBand] = useState<Band>('7-10');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    FamilyService.get().then(setFamily).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  useEffect(() => { if (signedIn) load(); }, [signedIn, load]);

  const run = async (fn: () => Promise<Family>, after?: () => void) => {
    setBusy(true);
    setError('');
    try { setFamily(await fn()); after?.(); } catch { setError(tt('error', 'Não foi possível concluir. Tente de novo.')); }
    setBusy(false);
  };

  if (!loaded) return <div className="fam fam--loading">{tt('loading', 'Carregando…')}</div>;
  const children = family?.children ?? [];
  const isOwner = family?.role === 'owner';

  return (
    <div className="fam">
      <div className="fam-hero">
        <p className="fam-eyebrow">{tt('eyebrow', 'Ler com as crianças')}</p>
        <h1 className="fam-hero__title">{tt('title', 'Uma leitura feita para a idade delas')}</h1>
        <p className="fam-hero__text">{tt('text', 'Cada faixa de idade tem a sua versão: 4 a 6, 7 a 10 e 11 a 13 anos. Você lê em voz alta e conduz a conversa com o guia do adulto.')}</p>
        <button type="button" className="fam-btn fam-btn--primary" onClick={() => openRitual('daily', 'kids')}>{tt('start', 'Começar a leitura de hoje')}</button>
      </div>

      <section className="fam-section">
        <h2 className="fam-section__title">{tt('who', 'Quem lê com você')}</h2>
        {children.length > 0 && (
          <div className="fam-people">
            {children.map((c) => (
              <div key={c.id} className="fam-person">
                <span className="fam-avatar fam-avatar--child">{initials(c.nickname)}</span>
                <span className="fam-person__label">{c.nickname}</span>
                <span className="fam-person__state">{bandLabel(c.band)}</span>
                {isOwner && <button type="button" className="fam-link fam-link--muted" disabled={busy} onClick={() => run(() => FamilyService.removeChild(c.id))}>{tt('remove', 'Remover')}</button>}
              </div>
            ))}
          </div>
        )}
        {signedIn && isOwner && (
          <form className="fam-inline" onSubmit={(e) => { e.preventDefault(); if (nick.trim()) run(() => FamilyService.addChild(nick.trim(), band), () => setNick('')); }}>
            <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={tt('nickname', 'Apelido')} maxLength={20} aria-label={tt('nickname', 'Apelido')} />
            <select value={band} onChange={(e) => setBand(e.target.value as Band)} aria-label={tt('band', 'Faixa de idade')}>{BANDS.map((b) => <option key={b} value={b}>{bandLabel(b)}</option>)}</select>
            <button type="submit" className="fam-btn fam-btn--secondary" disabled={busy || !nick.trim()}>{tt('add', 'Adicionar')}</button>
          </form>
        )}
        {!family && <p className="fam-note">{tt('setupNote', 'Ao começar, você escolhe a idade de cada criança.')}</p>}
        {error && <p className="fam-error">{error}</p>}
        <p className="fam-note">{tt('privacy', 'Crianças não têm conta: guardamos só o apelido e a faixa de idade, nunca sobrenome, foto ou e-mail.')}</p>
      </section>
    </div>
  );
}
