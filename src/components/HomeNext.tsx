import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { PlansService, type PlanCard } from '../services/PlansService';
import { FamilyService } from '../services/FamilyService';
import { SectionLabel } from './SectionLabel';

const CHIPS = ['c1', 'c2', 'c3', 'c4'] as const;

/** Final da Home: o próximo passo (plano, família) e a busca pelo momento, no lugar de dois botões soltos. */
export function HomeNext({ onExplore }: { onExplore: () => void }) {
  const { t } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`next.${k}`, { defaultValue: d, ...o });
  const [plan, setPlan] = useState<PlanCard | null>(null);
  const [hasFamily, setHasFamily] = useState(false);
  const [query, setQuery] = useState('');
  const signedIn = illumineAuth.isAuthenticated();

  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    PlansService.list().then((groups) => {
      const active = groups.flatMap((g) => g.plans).find((p) => p.started && !p.completed);
      if (alive) setPlan(active ?? null);
    });
    FamilyService.get().then((f) => { if (alive) setHasFamily(!!f); }).catch(() => {});
    return () => { alive = false; };
  }, [signedIn]);

  // A busca vive em Explorar: leva a frase junto e abre lá já com o resultado.
  const search = (text: string) => {
    const q = text.trim();
    try { sessionStorage.setItem('explore:focus', '1'); if (q) sessionStorage.setItem('explore:query', q); } catch { /* segue sem a frase */ }
    onExplore();
  };
  const submit = (e: FormEvent) => { e.preventDefault(); search(query); };

  const goTab = (tab: string) => window.dispatchEvent(new CustomEvent('app:tab', { detail: tab }));

  return (
    <section className="home-next" aria-label={tt('title', 'E agora?')}>
      <SectionLabel icon="story">{tt('title', 'E agora?')}</SectionLabel>

      {plan && (
        <button type="button" className="home-next__row" onClick={() => goTab('plans')}>
          <span className="home-next__text">
            <strong>{tt('plan', 'Continuar o plano')}</strong>
            <small>{tt('planSub', '{{title}} · dia {{day}} de {{total}}', { title: plan.title, day: Math.min(plan.currentDay, plan.days), total: plan.days })}</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      )}
      {hasFamily && (
        <button type="button" className="home-next__row" onClick={() => window.dispatchEvent(new CustomEvent('family:ritual', { detail: 'daily' }))}>
          <span className="home-next__text">
            <strong>{tt('family', 'Ler juntos')}</strong>
            <small>{tt('familySub', 'Hoje, em voz alta, à mesa')}</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      <form className="home-next__search" onSubmit={submit}>
        <label htmlFor="home-moment"><strong>{tt('moment', 'Como você está hoje?')}</strong></label>
        <input id="home-moment" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tt('placeholder', 'Escreva em poucas palavras…')} />
        <div className="home-next__chips">
          {CHIPS.map((c) => {
            const label = tt(c, c);
            return <button key={c} type="button" className="home-next__chip" onClick={() => search(label)}>{label}</button>;
          })}
        </div>
      </form>

      <button type="button" className="home-next__library" onClick={onExplore}>{tt('library', 'Explorar a biblioteca')}</button>
    </section>
  );
}
