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
    const load = () => FamilyService.get().then((f) => { if (alive) { setFamily(f); setLoaded(true); } }).catch(() => {});
    load();
    window.addEventListener('family:changed', load);
    return () => { alive = false; window.removeEventListener('family:changed', load); };
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
    const go = (tab: string) => window.dispatchEvent(new CustomEvent('app:tab', { detail: tab }));
    return (
      <div className="fam-today-pair">
        <button type="button" className="fam-today fam-today--pick" onClick={() => go('family')}>
          <p className="fam-eyebrow">{t('ritual.groupTitle', 'Ler em grupo')}</p>
          <p className="fam-today__text">{t('ritual.groupText', 'Casal, célula ou amigos. Cada um no seu tempo.')}</p>
        </button>
        <button type="button" className="fam-today fam-today--pick" onClick={() => openRitual('daily', 'kids')}>
          <p className="fam-eyebrow">{t('ritual.kidsTitle', 'Ler com as crianças')}</p>
          <p className="fam-today__text">{t('ritual.kidsText', 'Escolha a idade e leia a versão feita para elas.')}</p>
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
        {hasKids && (
          <button type="button" className="fam-today__tag" onClick={() => openRitual('daily', 'kids')}>{t('fam.today.kids', 'Versão para crianças')} ›</button>
        )}
      </div>
      <button type="button" className="fam-btn fam-btn--primary fam-today__btn" onClick={() => openRitual(plan ? 'plan' : 'daily', 'adults')}>
        {t('fam.today.cta', 'Ler')}
      </button>
    </div>
  );
}
