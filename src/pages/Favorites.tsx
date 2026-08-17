import { useState, useEffect } from 'react';
import { DevotionalService } from '../services/DevotionalService';
import type { Devotional } from '../types/Devotional';
import { JourneyService } from '../services/JourneyService';
import { PrincipleView } from '../components/PrincipleView';

export function Favorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      JourneyService.listFavorites(),
      DevotionalService.getDevotionals()
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
  }, [selectedDevotional]); // re-fetch when returning from view to catch removals

  if (selectedDevotional) {
    return <PrincipleView devotional={selectedDevotional} onBack={() => setSelectedDevotional(null)} />;
  }

  if (loading) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Salvos</h2>
        <span className="label" style={{ opacity: 0.5 }}>Carregando favoritos...</span>
      </div>
    );
  }

  const favoriteDevotionals = devotionals.filter(d => favoriteIds.includes(d.id));

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Salvos</h2>
      
      {favoriteDevotionals.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não salvou nenhum devocional.</p>
        </div>
      ) : (
        <div className="category-list">
          {favoriteDevotionals.map(d => (
            <div key={d.id} className="principle-list-item" onClick={() => setSelectedDevotional(d)}>
              <span className="label" style={{ marginBottom: '4px' }}>{d.categories?.name}</span>
              <h3 className="principle-list-title">{d.title}</h3>
              <p className="principle-list-preview">{d.reflection.split('\\n\\n')[0]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
