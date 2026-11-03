import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { FamilyService, type Band, type Family } from '../services/FamilyService';
import { ReadStartSheet } from '../components/ReadStartSheet';
import '../styles/family.css';

// Sem grupo ainda: a pessoa lê escolhendo só a versão; cadastrar crianças pede um grupo.
const NO_GROUP: Family = { id: '', name: '', meetingTime: null, role: 'owner', inviteCode: '', members: [], children: [], week: { days: [], streak: 0 }, plan: null };

const bandLabel = (b: Band) => b.replace('-', ' a ');

/** Aba Crianças: tudo de criança num lugar só. Quem lê, em que idade e o começo da leitura feita para elas. */
export function Kids() {
  const { t } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`kids.${k}`, { defaultValue: d, ...o });
  const signedIn = illumineAuth.isAuthenticated();
  const [family, setFamily] = useState<Family | null>(null);
  const [loaded, setLoaded] = useState(!signedIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    FamilyService.get().then(setFamily).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  useEffect(() => { if (signedIn) load(); }, [signedIn, load]);
  // Trocar de grupo em qualquer tela recarrega as crianças deste.
  useEffect(() => {
    if (!signedIn) return;
    window.addEventListener('family:changed', load);
    return () => window.removeEventListener('family:changed', load);
  }, [signedIn, load]);

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
        <p className="fam-hero__text">{tt('text', 'Cada faixa de idade tem a sua versão: 0 a 3, 4 a 6, 7 a 10 e 11 a 13 anos. Você lê em voz alta e conduz a conversa com o guia do adulto.')}</p>
      </div>

      {(
        <section className="fam-section">
          <ReadStartSheet key={family?.id ?? 'sem-grupo'} audience="kids" family={family ?? NO_GROUP} plan={false} inline onClose={() => {}} onChanged={setFamily} />
        </section>
      )}

      <section className="fam-section">
        {family && isOwner && children.length > 0 && (
          <details className="fam-manage">
            <summary>{tt('manage', 'Gerenciar crianças')}</summary>
            <div className="fam-manage__list">
              {children.map((c) => (
                <div key={c.id} className="fam-manage__row">
                  <span>{c.nickname} · {bandLabel(c.band)}{c.daysRead ? ` · ${c.daysRead === 1 ? tt('dayRead', '1 dia lendo') : tt('daysRead', '{{count}} dias lendo', { count: c.daysRead })}` : ''}</span>
                  <button type="button" className="fam-link fam-link--muted" disabled={busy} onClick={() => run(() => FamilyService.removeChild(c.id))}>{tt('remove', 'Remover')}</button>
                </div>
              ))}
            </div>
          </details>
        )}
        {!family && <p className="fam-note">{tt('setupNote', 'Ao começar, você escolhe a idade de cada criança.')}</p>}
        {error && <p className="fam-error">{error}</p>}
        <p className="fam-note">{tt('privacy', 'Crianças não têm conta: guardamos só o apelido e a faixa de idade, nunca sobrenome, foto ou e-mail.')}</p>
      </section>
    </div>
  );
}
