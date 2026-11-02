import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FamilyService, type Family } from '../services/FamilyService';
import { ReadStartSheet } from './ReadStartSheet';
import '../styles/family.css';

/** Em qualquer devocional (Explorar, planos, salvos): ler com as crianças ou em grupo, no mesmo passo a passo. */
export function ReadWithOthers({ devotionalId }: { devotionalId: string }) {
  const { t } = useTranslation('common');
  const [family, setFamily] = useState<Family | null>(null);
  const [sheet, setSheet] = useState<'adults' | 'kids' | null>(null);
  const goTab = (tab: string) => window.dispatchEvent(new CustomEvent('app:tab', { detail: tab }));

  // Quem ainda não tem grupo vai à aba certa para criar; quem tem abre a folha de preparo.
  const open = async (audience: 'adults' | 'kids') => {
    const f = family ?? await FamilyService.get().catch(() => null);
    if (!f) { goTab(audience === 'kids' ? 'kids' : 'family'); return; }
    setFamily(f);
    setSheet(audience);
  };

  return (
    <section className="read-with-others">
      <p className="hoje-capa__or">{t('ritual.orWithOthers', 'Ou leia com outras pessoas')}</p>
      <div className="hoje-capa__list">
        <button type="button" className="hoje-capa__row" onClick={() => open('adults')}>
          <span className="hoje-capa__text"><b>{t('ritual.readGroup', 'Ler em grupo')}</b><span>{t('ritual.readGroupHint', 'Este devocional, passo a passo com o grupo')}</span></span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="hoje-capa__row" onClick={() => open('kids')}>
          <span className="hoje-capa__text"><b>{t('ritual.readKids', 'Ler com as crianças')}</b><span>{t('ritual.readKidsHint', 'A versão feita para a idade delas')}</span></span>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      {sheet && family && <ReadStartSheet audience={sheet} family={family} plan={false} devotionalId={devotionalId} onClose={() => setSheet(null)} onChanged={setFamily} />}
    </section>
  );
}
