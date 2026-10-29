import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { JourneyService } from '../services/JourneyService';
import { buildPlan, PLANS, type PlanDef } from '../utils/plans';
import type { Devotional } from '../types/Devotional';

interface Props {
  library: Devotional[] | null;
  onOpen: (id: string) => void;
}

/** Planos de 7 e 21 dias: lista de planos e, ao abrir um, os dias com o progresso de quem lê. */
export function PlansSection({ library, onOpen }: Props) {
  const { t } = useTranslation(['library']);
  const [openId, setOpenId] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const plans = useMemo(
    () => (library ? PLANS.map((p) => ({ def: p, days: buildPlan(p, library) })).filter((p) => p.days.length >= Math.min(p.def.days, 5)) : []),
    [library],
  );
  const open = plans.find((p) => p.def.id === openId) ?? null;

  useEffect(() => {
    if (!open || !illumineAuth.isAuthenticated()) return;
    let alive = true;
    Promise.all(
      open.days.map((d) =>
        JourneyService.getStatus(d.devotional.id, d.devotional.legacy_id)
          .then((s) => (s?.completed_at ? d.devotional.id : null))
          .catch(() => null),
      ),
    ).then((ids) => { if (alive) setDone(new Set(ids.filter(Boolean) as string[])); });
    return () => { alive = false; };
  }, [open]);

  if (!plans.length) return null;

  const title = (def: PlanDef) => t(`plans.${def.id}.title`);

  if (open) {
    const finished = open.days.filter((d) => done.has(d.devotional.id)).length;
    const next = open.days.find((d) => !done.has(d.devotional.id));
    return (
      <section className="plans">
        <button type="button" className="plans__back" onClick={() => setOpenId(null)}>← {t('plans.back')}</button>
        <h3 className="plans__title">{title(open.def)}</h3>
        <p className="plans__desc">{t(`plans.${open.def.id}.desc`)}</p>
        <p className="plans__progress" aria-live="polite">{t('plans.progress', { done: finished, total: open.days.length })}</p>
        <ol className="plans__days">
          {open.days.map((d) => (
            <li key={d.devotional.id}>
              <button
                type="button"
                className={`plans__day${done.has(d.devotional.id) ? ' plans__day--done' : ''}${next === d ? ' plans__day--next' : ''}`}
                onClick={() => onOpen(d.devotional.id)}
              >
                <span className="plans__day-n">{done.has(d.devotional.id) ? '✓' : d.day}</span>
                <span>{d.devotional.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="plans">
      <h3 className="plans__heading">{t('plans.heading')}</h3>
      <div className="plans__list">
        {plans.map(({ def, days }) => (
          <button key={def.id} type="button" className="plans__card" onClick={() => setOpenId(def.id)}>
            <strong>{title(def)}</strong>
            <span>{t(`plans.${def.id}.desc`)}</span>
            <em>{t('plans.days', { count: days.length })}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
