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
  // Dois caminhos sempre à vista: ler em grupo (adultos) e ler com as crianças. O estado de cada um aparece no próprio cartão.
  const goTab = (tab: string) => window.dispatchEvent(new CustomEvent('app:tab', { detail: tab }));
  const readers = family ? family.members.filter((m) => m.readToday).length : 0;
  const plan = family?.plan && !family.plan.completed && !family.plan.lockedUntilTomorrow ? family.plan : null;
  const kidNames = (family?.children ?? []).map((c) => c.nickname);
  const names = kidNames.length > 2 ? `${kidNames.slice(0, 2).join(', ')} +${kidNames.length - 2}` : kidNames.join(' e ');

  const hint = [
    family ? (readers > 0
      ? t('fam.today.readers', { count: readers, total: family.members.length, defaultValue: '{{count}} de {{total}} já leram hoje' })
      : t('fam.today.none', 'Ninguém leu ainda hoje')) : '',
    names && hasKids ? t('ritual.kidsWithReady', { names, defaultValue: '{{names}} têm versão pronta' }) : '',
  ].filter(Boolean).join(' · ');

  // Nenhum modo vem marcado: tocar em um já abre a leitura, sempre no mesmo passo a passo.
  return (
    <div className="fam-mode">
      <p className="fam-mode__q">{t('ritual.modeQuestion', 'Como você vai ler hoje?')}</p>
      <div className="fam-mode__seg" role="group" aria-label={t('ritual.modeQuestion', 'Como você vai ler hoje?')}>
        <button type="button" onClick={() => openRitual('daily', undefined, { solo: true, intro: false })}>{t('ritual.modeSolo', 'Eu')}</button>
        <button type="button" onClick={() => (family ? openRitual(plan ? 'plan' : 'daily', 'adults', { intro: false }) : goTab('family'))}>{t('ritual.modeGroup', 'Grupo')}</button>
        <button type="button" onClick={() => openRitual('daily', 'kids', { intro: false })}>{t('ritual.modeKids', 'Crianças')}</button>
      </div>
      {hint && <p className="fam-mode__hint">{hint}{plan && ` · ${t('fam.today.planDay', { n: plan.currentDay, defaultValue: 'plano, dia {{n}}' })}`}</p>}
    </div>
  );
}
