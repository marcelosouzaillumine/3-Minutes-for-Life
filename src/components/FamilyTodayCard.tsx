import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { FamilyService, type Family } from '../services/FamilyService';
import { openRitual } from '../pages/Family';
import '../styles/family.css';

/** Capa do Hoje: ler sozinho em destaque e, abaixo, os caminhos em grupo e com as crianças, cada um com o seu estado. */
export function FamilyTodayCard({ devotionalId, onReadSolo }: { devotionalId?: string; onReadSolo: () => void }) {
  const { t, i18n } = useTranslation('common');
  const [hasKids, setHasKids] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);

  useEffect(() => {
    if (!illumineAuth.isAuthenticated()) return;
    let alive = true;
    const load = () => FamilyService.get().then((f) => { if (alive) setFamily(f); }).catch(() => {});
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

  const goTab = (tab: string) => window.dispatchEvent(new CustomEvent('app:tab', { detail: tab }));
  const readers = family ? family.members.filter((m) => m.readToday).length : 0;
  const plan = family?.plan && !family.plan.completed && !family.plan.lockedUntilTomorrow ? family.plan : null;
  const kidNames = (family?.children ?? []).map((c) => c.nickname);
  const names = kidNames.length > 2 ? `${kidNames.slice(0, 2).join(', ')} +${kidNames.length - 2}` : kidNames.join(' e ');

  return (
    <div className="hoje-capa">
      <button type="button" className="hoje-capa__main" onClick={onReadSolo}>
        <b>{t('ritual.readNow', 'Ler agora')}</b>
        <span>{t('ritual.readNowHint', '3 minutos · no seu ritmo')}</span>
      </button>
      <p className="hoje-capa__or">{t('ritual.orWithOthers', 'Ou leia com outras pessoas')}</p>
      <div className="hoje-capa__pair">
        <button type="button" className="hoje-capa__card" onClick={() => (family ? openRitual(plan ? 'plan' : 'daily', 'adults', { intro: false }) : goTab('family'))}>
          <b>{t('ritual.modeGroup', 'Grupo')}</b>
          <span>
            {family
              ? (readers > 0
                ? t('fam.today.readers', { count: readers, total: family.members.length, defaultValue: '{{count}} de {{total}} já leram hoje' })
                : t('fam.today.none', 'Ninguém leu ainda hoje'))
              : t('ritual.groupText', 'Casal, célula ou amigos. Cada um no seu tempo.')}
            {plan && ` · ${t('fam.today.planDay', { n: plan.currentDay, defaultValue: 'plano, dia {{n}}' })}`}
          </span>
        </button>
        <button type="button" className="hoje-capa__card" onClick={() => openRitual('daily', 'kids', { intro: false })}>
          <b>{t('ritual.modeKids', 'Crianças')}</b>
          <span>
            {names ? t('ritual.kidsWith', { names, defaultValue: 'Com {{names}}' }) : t('ritual.kidsText', 'Escolha a idade e leia a versão feita para elas.')}
            {hasKids && names ? ` · ${t('ritual.kidsReady', 'versão pronta')}` : ''}
          </span>
        </button>
      </div>
    </div>
  );
}
