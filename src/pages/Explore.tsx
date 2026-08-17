import { useState, useEffect } from 'react';
import { DevotionalService } from '../services/DevotionalService';
import type { Devotional } from '../types/Devotional';
import { PrincipleView } from '../components/PrincipleView';

export function Explore() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);

  useEffect(() => {
    DevotionalService.getDevotionals()
      .then(data => {
        setDevotionals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Explorar</h2>
        <span className="label" style={{ opacity: 0.5 }}>Carregando biblioteca...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>Explorar</h2>
        <p>Não foi possível carregar a biblioteca de devocionais.</p>
      </div>
    );
  }

  // Extract unique categories safely
  const categories = Array.from(
    new Set(
      devotionals
        .map(d => d.categories?.name)
        .filter(Boolean) as string[]
    )
  );

  if (selectedDevotional) {
    return <PrincipleView devotional={selectedDevotional} onBack={() => setSelectedDevotional(null)} />;
  }

  if (selectedCategory) {
    const categoryDevotionals = devotionals.filter(d => d.categories?.name === selectedCategory);
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
          {categoryDevotionals.map(d => (
            <div key={d.id} className="principle-list-item" onClick={() => setSelectedDevotional(d)}>
              <h3 className="principle-list-title">{d.title}</h3>
              <p className="principle-list-preview">{d.reflection.split('\\n\\n')[0]}</p>
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
          const count = devotionals.filter(d => d.categories?.name === category).length;
          return (
            <li key={category} className="category-item" onClick={() => setSelectedCategory(category)}>
              <span className="category-title">{category}</span>
              <span className="category-count">{count} {count === 1 ? 'devocional' : 'devocionais'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
