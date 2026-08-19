import { useState, useEffect } from 'react';
import { DevotionalService } from '../services/DevotionalService';
import type { Devotional } from '../types/Devotional';
import { JourneyService } from '../services/JourneyService';
import { PrincipleView } from '../components/PrincipleView';
import { useTranslation } from 'react-i18next';

export function Favorites() {
  const { t, i18n } = useTranslation(['common']);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      JourneyService.listFavorites(),
      DevotionalService.getDevotionals(i18n.language)
    ])
      .then(([ids, data]) => {
        setFavoriteIds(ids);
        setDevotionals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedDevotional, i18n.language]); // re-fetch when returning from view to catch removals

  if (selectedDevotional) {
    return <PrincipleView devotional={selectedDevotional} onBack={() => setSelectedDevotional(null)} />;
  }

  if (loading) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{t('savedNav')}</h2>
        <span className="label" style={{ opacity: 0.5 }}>{t('loadingFavorites')}</span>
      </div>
    );
  }

  const favoriteDevotionals = devotionals.filter(d => favoriteIds.includes(d.id));

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{t('savedNav')}</h2>
      
      {favoriteDevotionals.length === 0 ? (
        <div className="empty-state">
          <p>{t('noFavorites')}</p>
        </div>
      ) : (
        <div className="category-list">
          {favoriteDevotionals.map(d => (
            <div key={d.id} className="principle-list-item" onClick={() => setSelectedDevotional(d)}>
              <span className="label" style={{ marginBottom: '4px' }}>{d.categories?.name}</span>
              <h3 className="principle-list-title">{d.title}</h3>
              <p className="principle-list-preview">
                {d.principle_statement ? d.principle_statement : d.reflection.split(/(?:\r?\n|\\n)\s*(?:\r?\n|\\n)/)[0]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
