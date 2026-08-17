import { useState, useEffect } from 'react';
import { principles } from "../data/principles";
import type { Principle } from '../data/principles';
import { getFavorites } from '../utils/storage';
import { PrincipleView } from '../components/PrincipleView';

export function Favorites() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [selectedPrinciple, setSelectedPrinciple] = useState<Principle | null>(null);

  useEffect(() => {
    setFavoriteIds(getFavorites());
  }, [selectedPrinciple]); // re-fetch when returning from view to catch removals

  if (selectedPrinciple) {
    return <PrincipleView principle={selectedPrinciple} onBack={() => setSelectedPrinciple(null)} />;
  }

  const favoritePrinciples = principles.filter(p => favoriteIds.includes(p.id));

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Salvos</h2>
      
      {favoritePrinciples.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não salvou nenhum princípio.</p>
        </div>
      ) : (
        <div className="category-list">
          {favoritePrinciples.map(p => (
            <div key={p.id} className="principle-list-item" onClick={() => setSelectedPrinciple(p)}>
              <span className="label" style={{ marginBottom: '4px' }}>{p.category}</span>
              <h3 className="principle-list-title">{p.title}</h3>
              <p className="principle-list-preview">{p.principle}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
