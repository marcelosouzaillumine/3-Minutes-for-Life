import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DevotionalService } from '../services/DevotionalService';
import { JourneyService } from '../services/JourneyService';
import type { Devotional } from '../types/Devotional';
import { PrincipleView } from '../components/PrincipleView';
import { PlansSection } from '../components/PlansSection';
import { PlanCategories } from '../components/PlanCategories';

/** Aba Planos: os planos de leitura, por categoria. Abrir um dia leva ao devocional, com "Voltar" para o plano. */
export function Plans() {
  const { t, i18n } = useTranslation('common');
  const [library, setLibrary] = useState<Devotional[] | null>(null);
  const [selected, setSelected] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    DevotionalService.getDevotionals(i18n.language)
      .then((data) => { if (alive) setLibrary(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [i18n.language]);

  const open = async (id: string) => {
    setLoading(true);
    try {
      const full = await DevotionalService.getDevotional(id, i18n.language);
      setSelected(full);
      JourneyService.registerOpen(full, 'library', i18n.language);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (selected) return <PrincipleView devotional={selected} onBack={() => setSelected(null)} />;
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}><span className="label" style={{ opacity: 0.5 }}>…</span></div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{t('plansNav', 'Planos')}</h2>
      <PlanCategories onOpen={open} fallback={<PlansSection library={library} onOpen={open} />} />
    </div>
  );
}
