import { useState } from 'react';
import { principles } from "../data/principles";
import type { Principle } from '../data/principles';
import { PrincipleView } from '../components/PrincipleView';

const categories = Array.from(new Set(principles.map(p => p.category)));

export function Explore() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrinciple, setSelectedPrinciple] = useState<Principle | null>(null);

  if (selectedPrinciple) {
    return <PrincipleView principle={selectedPrinciple} onBack={() => setSelectedPrinciple(null)} />;
  }

  if (selectedCategory) {
    const categoryPrinciples = principles.filter(p => p.category === selectedCategory);
    return (
      <div>
        <button onClick={() => setSelectedCategory(null)} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Categorias
        </button>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{selectedCategory}</h2>
        <div className="category-list">
          {categoryPrinciples.map(p => (
            <div key={p.id} className="principle-list-item" onClick={() => setSelectedPrinciple(p)}>
              <h3 className="principle-list-title">{p.title}</h3>
              <p className="principle-list-preview">{p.principle}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Explorar</h2>
      <ul className="category-list">
        {categories.map(category => {
          const count = principles.filter(p => p.category === category).length;
          return (
            <li key={category} className="category-item" onClick={() => setSelectedCategory(category)}>
              <span className="category-title">{category}</span>
              <span className="category-count">{count} {count === 1 ? 'princípio' : 'princípios'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
