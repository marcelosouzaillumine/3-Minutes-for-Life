import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { FamilyService, type Family } from '../services/FamilyService';
import { openRitual } from '../pages/Family';
import '../styles/family.css';

/** Cartão compacto na Hoje: para quem já tem família mostra quem leu; para os demais, o convite para começar. */
export function FamilyTodayCard() {
  const { t } = useTranslation('common');
  const [family, setFamily] = useState<Family | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!illumineAuth.isAuthenticated()) return;
    let alive = true;
    FamilyService.get().then((f) => { if (alive) { setFamily(f); setLoaded(true); } }).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!loaded) return null;
  // Sem família ainda: o mesmo botão leva a criar uma em dois passos e segue direto para a leitura.
  if (!family) {
    return (
      <div className="fam-today">
        <div>
          <p className="fam-eyebrow">{t('ritual.inviteTitle', 'Ler em família')}</p>
          <p className="fam-today__text">{t('ritual.inviteText', 'Uma leitura para a mesa, com perguntas, uma atividade e uma oração.')}</p>
        </div>
        <button type="button" className="fam-btn fam-btn--secondary fam-today__btn" onClick={() => openRitual('daily')}>
          {t('ritual.inviteCta', 'Começar')}
        </button>
      </div>
    );
  }
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
