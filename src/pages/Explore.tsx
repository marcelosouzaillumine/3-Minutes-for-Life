import { useState, useEffect, useRef } from 'react';
import { DevotionalService } from '../services/DevotionalService';
import type { Devotional } from '../types/Devotional';
import { PrincipleView } from '../components/PrincipleView';
import { JourneyService } from '../services/JourneyService';
import { searchMoments, significantWords, topicsOf } from '../utils/momentSearch';
import { AnalyticsService } from '../services/AnalyticsService';
import { useTranslation } from 'react-i18next';

export function Explore() {
  const { t, i18n } = useTranslation(['library']);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [loadingDevotional, setLoadingDevotional] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Biblioteca completa (com o texto), carregada só quando a pessoa começa a escrever.
  const [library, setLibrary] = useState<Devotional[] | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const lastTracked = useRef('');

  useEffect(() => {
    DevotionalService.getDevotionalsForBrowse(i18n.language)
      .then(data => {
        setDevotionals(data as any);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, [i18n.language]);

  useEffect(() => { setLibrary(null); }, [i18n.language]);

  const hasQuery = searchQuery.trim().length > 0;
  useEffect(() => {
    if (!hasQuery || library) return;
    let alive = true;
    DevotionalService.getDevotionals(i18n.language)
      .then(data => { if (alive) setLibrary(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [hasQuery, library, i18n.language]);

  // Vindo do link no fim do devocional: abre já com o cursor na busca.
  useEffect(() => {
    try {
      if (sessionStorage.getItem('explore:focus') === '1') {
        sessionStorage.removeItem('explore:focus');
        setTimeout(() => searchInput.current?.focus(), 150);
      }
    } catch { /* sem sessionStorage, só não foca */ }
  }, [loading]);

  // Estatística da busca: depois que a pessoa para de digitar, uma vez por frase. Vão só as palavras
  // úteis, os temas e quantos devocionais voltaram, nunca a frase inteira.
  const trimmed = searchQuery.trim();
  useEffect(() => {
    if (trimmed.length < 3 || !library) return;
    const handle = setTimeout(() => {
      if (lastTracked.current === trimmed.toLowerCase()) return;
      lastTracked.current = trimmed.toLowerCase();
      const terms = significantWords(trimmed);
      const topics = topicsOf(trimmed);
      if (!terms.length && !topics.length) return;
      AnalyticsService.trackEvent('library_search', {
        terms,
        topics,
        results: searchMoments(trimmed, library).length,
        language: i18n.language,
      });
    }, 1500);
    return () => clearTimeout(handle);
  }, [trimmed, library, i18n.language]);

  if (loading) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{t('title')}</h2>
        <span className="label" style={{ opacity: 0.5 }}>{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{t('title')}</h2>
        <p>{t('error')}</p>
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
  ).sort((a, b) => a.localeCompare(b, i18n.language, { sensitivity: 'base' }));

  const handleSelectDevotional = async (id: string) => {
    setLoadingDevotional(true);
    try {
      const full = await DevotionalService.getDevotional(id, i18n.language);
      setSelectedDevotional(full);
      JourneyService.registerOpen(full, 'library', i18n.language);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDevotional(false);
    }
  };

  if (selectedDevotional) {
    return <PrincipleView devotional={selectedDevotional} onBack={() => setSelectedDevotional(null)} />;
  }

  if (loadingDevotional) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <span className="label" style={{ opacity: 0.5 }}>{t('loading')}</span>
      </div>
    );
  }

  if (selectedCategory) {
    const categoryDevotionals = devotionals.filter(d => d.categories?.name === selectedCategory);
    return (
      <div>
        <button onClick={() => setSelectedCategory(null)} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('categories')}
        </button>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{selectedCategory}</h2>
        <div className="category-list">
          {categoryDevotionals.map(d => (
            <div key={d.id} className="principle-list-item" onClick={() => handleSelectDevotional(d.id)}>
              <h3 className="principle-list-title">{d.title}</h3>
              <p className="principle-list-preview">
                {d.principle_statement || ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const trimmedQuery = searchQuery.trim();
  // Frase livre ("estou sem forças") → devocionais cujo texto mais conversa com ela.
  // Enquanto a biblioteca completa não chega, vale a busca simples por título e princípio.
  const searchResults: { id: string; title: string; principle_statement?: string | null }[] = !trimmedQuery
    ? []
    : library
      ? searchMoments(trimmedQuery, library).map(m => m.devotional)
      : devotionals.filter(d => `${d.title ?? ''} ${d.principle_statement ?? ''}`.toLowerCase().includes(trimmedQuery.toLowerCase()));

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{t('title')}</h2>

      <input
        ref={searchInput}
        type="search"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder={t('search_placeholder')}
        aria-label={t('search_placeholder')}
        style={{
          width: '100%',
          padding: '10px 14px',
          marginBottom: '1.5rem',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontSize: '0.95rem',
        }}
      />

      {trimmedQuery ? (
        searchResults.length > 0 ? (
          <div className="category-list">
            {searchResults.map(d => (
              <div key={d.id} className="principle-list-item" onClick={() => handleSelectDevotional(d.id)}>
                <h3 className="principle-list-title">{d.title}</h3>
                <p className="principle-list-preview">{d.principle_statement || ''}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="label" style={{ opacity: 0.6 }}>{t('search_no_results', { query: trimmedQuery })}</p>
        )
      ) : (
        <ul className="category-list">
          {categories.map(category => {
            const count = devotionals.filter(d => d.categories?.name === category).length;
            return (
              <li key={category} className="category-item" onClick={() => setSelectedCategory(category)}>
                <span className="category-title">{category}</span>
                <span className="category-count">{count === 1 ? t('count_one', { count }) : t('count_other', { count })}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
