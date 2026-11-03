import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { FamilyService, type Family } from '../services/FamilyService';
import { ReadStartSheet } from './ReadStartSheet';
import '../styles/family.css';

/** Capa do Hoje: ler sozinho em destaque e, abaixo, os caminhos em grupo e com as crianças, cada um com o seu estado. */
export function FamilyTodayCard({ devotionalId, daily = true, onReadSolo }: { devotionalId?: string; /** false fora do Hoje: sem estado do dia, e a leitura é a deste devocional. */ daily?: boolean; onReadSolo: () => void }) {
  const { t, i18n } = useTranslation('common');
  const [hasKids, setHasKids] = useState<boolean | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [sheet, setSheet] = useState<'adults' | 'kids' | null>(null);

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
  const plan = daily && family?.plan && !family.plan.completed && !family.plan.lockedUntilTomorrow ? family.plan : null;
  const kidNames = (family?.children ?? []).map((c) => c.nickname);
  const names = kidNames.length > 2 ? `${kidNames.slice(0, 2).join(', ')} +${kidNames.length - 2}` : kidNames.join(' e ');

  // Sem cadastro, os cards só convidam; estado (andamento, versão pronta) só aparece quando já há grupo ou criança.
  const missing = family ? family.members.length - readers : 0;
  const groupLine = !family || !daily
    ? t('ritual.groupFirst', 'Leia com o casal, a célula ou amigos')
    : readers === 0
      ? t('fam.today.none', 'Ninguém leu ainda hoje')
      : missing <= 0
        ? t('ritual.groupAll', 'Todos já leram hoje ✓')
        : t('ritual.groupMissing', { count: missing, defaultValue: 'Falta {{count}} ler hoje' });
  const kidsLine = !names
    ? t('ritual.kidsFirst', 'Leia a versão feita para a idade delas')
    : !daily || hasKids === null
      ? t('ritual.kidsWith', { names, defaultValue: 'Com {{names}}' })
      : hasKids
        ? t('ritual.kidsCan', { count: kidNames.length, names, defaultValue: '{{names}} pode ler a versão de hoje' })
        : t('ritual.kidsSoon', { names, defaultValue: 'A versão de {{names}} sai em breve' });

  return (
    <div className="hoje-capa">
      <button type="button" className="hoje-capa__main" onClick={onReadSolo}>
        <b>{t('ritual.readNow', 'Ler agora')}</b>
        <span>{t('ritual.readNowHint', '3 minutos · no seu ritmo')}</span>
      </button>
      <div className="hoje-capa__list">
        <div className="hoje-capa__item">
          <button type="button" className="hoje-capa__row" onClick={() => (family ? setSheet('adults') : goTab('family'))}>
            <span className="hoje-capa__text"><b>{t('ritual.modeGroup', 'Grupo')}</b>
            <span>
              {groupLine}
              {plan && ` · ${t('fam.today.planDay', { n: plan.currentDay, defaultValue: 'plano, dia {{n}}' })}`}
            </span></span>
            <span aria-hidden="true">›</span>
          </button>
          {family && <button type="button" className="hoje-capa__hint" onClick={() => goTab('family')}>{t('ritual.groupMore', '+ Convidar pessoas ou criar outro grupo')}</button>}
        </div>
        <div className="hoje-capa__item">
          <button type="button" className="hoje-capa__row" onClick={() => (family ? setSheet('kids') : goTab('kids'))}>
            <span className="hoje-capa__text"><b>{t('ritual.modeKids', 'Crianças')}</b>
            <span>{kidsLine}</span></span>
            <span aria-hidden="true">›</span>
          </button>
          {names && <button type="button" className="hoje-capa__hint" onClick={() => goTab('kids')}>{t('ritual.kidsMore', '+ Incluir outra criança')}</button>}
        </div>
      </div>
      {sheet && family && <ReadStartSheet audience={sheet} family={family} plan={!!plan} devotionalId={daily ? undefined : devotionalId} onClose={() => setSheet(null)} onChanged={setFamily} />}
    </div>
  );
}
