import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { FamilyService, type Family } from '../services/FamilyService';
import { openRitual } from '../pages/Family';
import '../styles/family.css';

/** Cartão compacto na Hoje: só aparece para quem já está em uma família. */
export function FamilyTodayCard() {
  const { t } = useTranslation('common');
  const [family, setFamily] = useState<Family | null>(null);

  useEffect(() => {
    if (!illumineAuth.isAuthenticated()) return;
    let alive = true;
    FamilyService.get().then((f) => { if (alive) setFamily(f); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!family) return null;
  const readers = family.members.filter((m) => m.readToday).length;
  const plan = family.plan && !family.plan.completed && !family.plan.lockedUntilTomorrow ? family.plan : null;

  return (
    <div className="fam-today">
      <div>
        <p className="fam-eyebrow">{family.name}</p>
        <p className="fam-today__text">
          {readers > 0
            ? t('fam.today.readers', { count: readers, total: family.members.length, defaultValue: '{{count}} de {{total}} já leram hoje' })
            : t('fam.today.none', 'Ninguém leu ainda hoje')}
          {plan && ` · ${t('fam.today.planDay', { n: plan.currentDay, defaultValue: 'plano, dia {{n}}' })}`}
        </p>
      </div>
      <button type="button" className="fam-btn fam-btn--secondary fam-today__btn" onClick={() => openRitual(plan ? 'plan' : 'daily')}>
        {t('fam.ritual', 'Ler em família')}
      </button>
    </div>
  );
}
