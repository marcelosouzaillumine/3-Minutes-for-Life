import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { PlansService, type PlanCategoryGroup, type PlanDetail } from '../services/PlansService';
import '../styles/family.css';

interface Props {
  onOpen: (devotionalId: string) => void;
  /** Mostrado enquanto a pessoa não tem planos publicados (ou não entrou na conta). */
  fallback: ReactNode;
}

/** Planos em Explorar, por categoria (Liderança, Casais…). A categoria da família fica na aba Família. */
export function PlanCategories({ onOpen, fallback }: Props) {
  const { t } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`plansx.${k}`, { defaultValue: d, ...o });
  const [groups, setGroups] = useState<PlanCategoryGroup[] | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!illumineAuth.isAuthenticated()) { setGroups([]); return; }
    let alive = true;
    PlansService.list().then((g) => { if (alive) setGroups(g); });
    return () => { alive = false; };
  }, [openId]);

  useEffect(() => {
    if (!openId) { setDetail(null); return; }
    let alive = true;
    PlansService.get(openId).then((d) => { if (alive) setDetail(d); });
    return () => { alive = false; };
  }, [openId]);

  const shown = useMemo(() => (groups ?? []).filter((g) => filter === 'all' || g.id === filter), [groups, filter]);

  if (groups === null) return null;
  if (!groups.length) return <>{fallback}</>;

  if (openId) {
    if (!detail) return <section className="plans"><p className="fam-note">…</p></section>;
    const next = detail.days.find((d) => !d.done);
    const toggle = async () => {
      setBusy(true);
      if (detail.started) await PlansService.stop(detail.id); else await PlansService.start(detail.id);
      setDetail(await PlansService.get(detail.id));
      setBusy(false);
    };
    return (
      <section className="plans">
        <button type="button" className="plans__back" onClick={() => setOpenId(null)}>← {tt('back', 'Planos')}</button>
        <p className="fam-eyebrow fam-eyebrow--accent">{detail.category}</p>
        <h3 className="plans__title">{detail.title}</h3>
        <p className="plans__desc">{detail.description}</p>
        <p className="plans__progress" aria-live="polite">{tt('progress', '{{done}} de {{total}} dias', { done: detail.daysRead, total: detail.days.length })}</p>
        <ol className="plans__days">
          {detail.days.map((d) => (
            <li key={d.devotionalId}>
              <button
                type="button"
                className={`plans__day${d.done ? ' plans__day--done' : ''}${next === d ? ' plans__day--next' : ''}`}
                onClick={() => { if (!detail.started) PlansService.start(detail.id); onOpen(d.devotionalId); }}
              >
                <span className="plans__day-n">{d.done ? '✓' : d.day}</span>
                <span>{d.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="fam-link fam-link--muted" disabled={busy} onClick={toggle}>
          {detail.started ? tt('stop', 'Parar este plano') : tt('start', 'Começar este plano')}
        </button>
      </section>
    );
  }

  return (
    <section className="plans">
      <h3 className="plans__heading">{tt('heading', 'Planos')}</h3>
      {groups.length > 1 && (
        <div className="fam-people" role="tablist">
          <button type="button" className={`fam-chip${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>{tt('all', 'Todos')}</button>
          {groups.map((g) => (
            <button key={g.id} type="button" className={`fam-chip${filter === g.id ? ' is-on' : ''}`} onClick={() => setFilter(g.id)}>{g.name}</button>
          ))}
        </div>
      )}
      {shown.map((g) => (
        <div key={g.id} className="plans__group">
          <p className="fam-eyebrow">{g.name}</p>
          {g.description && <p className="fam-note">{g.description}</p>}
          <div className="plans__list">
            {g.plans.map((p) => (
              <button key={p.id} type="button" className="plans__card" onClick={() => setOpenId(p.id)}>
                <strong>{p.title}</strong>
                <span>{p.description}</span>
                <em>
                  {p.completed ? tt('done', 'Concluído')
                    : p.started ? tt('progress', '{{done}} de {{total}} dias', { done: p.daysRead, total: p.days })
                    : tt('days', '{{count}} dias', { count: p.days })}
                </em>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
