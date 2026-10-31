import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { FamilyService, type Family } from '../services/FamilyService';
import { openRitual } from '../pages/Family';
import '../styles/family.css';

/** Cartão compacto na Hoje: para quem já tem família mostra quem leu; para os demais, o convite para começar. */
export function FamilyTodayCard({ devotionalId }: { devotionalId?: string }) {
  const { t, i18n } = useTranslation('common');
  const [hasKids, setHasKids] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!illumineAuth.isAuthenticated()) return;
    let alive = true;
    FamilyService.get().then((f) => { if (alive) { setFamily(f); setLoaded(true); } }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!devotionalId || !illumineAuth.isAuthenticated()) return;
    let alive = true;
    FamilyService.getKids(devotionalId, i18n.language).then((v) => { if (alive) setHasKids(v.length > 0); }).catch(() => {});
    return () => { alive = false; };
  }, [devotionalId, i18n.language]);

  if (!loaded) return null;
  // Sem família ainda: o mesmo botão leva a criar uma em dois passos e segue direto para a leitura.
  if (!family) {
    return (
      <div className="fam-today">
        <div>
          <p className="fam-eyebrow">{t('ritual.inviteTitle', 'Leia com quem você ama')}</p>
          <p className="fam-today__text">{t('ritual.inviteText', 'Família, casal ou grupo. Cada um no seu tempo.')}</p>
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
        {hasKids && <span className="fam-today__tag">{t('fam.today.kids', 'Versão para crianças')}</span>}
      </div>
      <button type="button" className="fam-btn fam-btn--primary fam-today__btn" onClick={() => openRitual(plan ? 'plan' : 'daily')}>
        {t('fam.today.cta', 'Ler')}
      </button>
    </div>
  );
}
