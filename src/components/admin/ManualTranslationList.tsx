import React, { useState, useMemo } from 'react';

interface ManualTranslationListProps {
  language: {
    iso_code: string;
    name: string;
    native_name: string;
    flag_emoji: string;
  };
  devotionals: any[];
  onSelectDevotional: (devotional: any) => void;
  onBack: () => void;
}

type FilterTab = 'all' | 'pending' | 'draft' | 'published';

export const ManualTranslationList: React.FC<ManualTranslationListProps> = ({
  language,
  devotionals,
  onSelectDevotional,
  onBack
}) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counters
  const totalCount = devotionals.length;
  const publishedCount = devotionals.filter(
    d => d.translationState === 'manual_published' || d.translationState === 'ai_published'
  ).length;
  const draftCount = devotionals.filter(d => d.translationState === 'draft').length;
  const pendingCount = devotionals.filter(d => d.translationState === 'none').length;

  const filteredDevotionals = useMemo(() => {
    return devotionals.filter(d => {
      // Status filter
      if (filterTab === 'pending' && d.translationState !== 'none') return false;
      if (filterTab === 'draft' && d.translationState !== 'draft') return false;
      if (filterTab === 'published' && d.translationState !== 'manual_published' && d.translationState !== 'ai_published') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = d.title?.toLowerCase().includes(q);
        const matchesLegacyId = d.legacy_id ? String(d.legacy_id).includes(q) : false;
        const matchesDate = d.publication_date?.includes(q);
        const matchesTranslatedTitle = (d.manualTranslation?.title || d.aiTranslation?.title)?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLegacyId && !matchesDate && !matchesTranslatedTitle) {
          return false;
        }
      }

      return true;
    });
  }, [devotionals, filterTab, searchQuery]);

  const renderOriginBadge = (state: string) => {
    switch (state) {
      case 'manual_published':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            backgroundColor: 'rgba(5, 150, 105, 0.12)',
            color: '#059669',
            border: '1px solid rgba(5, 150, 105, 0.3)'
          }}>
            ✓ Manual
          </span>
        );
      case 'ai_published':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            color: '#2563eb',
            border: '1px solid rgba(37, 99, 235, 0.3)'
          }}>
            ✓ IA
          </span>
        );
      case 'draft':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            backgroundColor: 'rgba(217, 119, 6, 0.12)',
            color: '#d97706',
            border: '1px solid rgba(217, 119, 6, 0.3)'
          }}>
            📝 Rascunho
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            backgroundColor: 'rgba(100, 116, 139, 0.12)',
            color: '#64748b',
            border: '1px solid rgba(100, 116, 139, 0.2)'
          }}>
            ○ Não traduzido
          </span>
        );
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onBack}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--color-primary)', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.95rem'
          }}
        >
          &larr; Voltar ao Translation Center
        </button>
      </div>

      {/* Header section */}
      <div style={{
        background: 'var(--color-surface)',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '2rem' }}>{language.flag_emoji}</span>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
              {language.name}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
              Tradução Editorial / Manual ({language.native_name})
            </span>
          </div>
        </div>

        {/* Counter cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{totalCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Total</div>
          </div>
          <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#059669' }}>{publishedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#059669' }}>Traduzidos</div>
          </div>
          <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#d97706' }}>{draftCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#d97706' }}>Rascunhos</div>
          </div>
          <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2563eb' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Pendentes</div>
          </div>
        </div>
      </div>

      {/* Filter and search controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {/* Search input */}
        <input 
          type="text"
          placeholder="Buscar por título, ID ou data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '0.95rem',
            background: 'var(--color-surface)',
            color: 'var(--color-text)'
          }}
        />

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all' as FilterTab, label: `Todos (${totalCount})` },
            { id: 'pending' as FilterTab, label: `Pendentes (${pendingCount})` },
            { id: 'draft' as FilterTab, label: `Rascunhos (${draftCount})` },
            { id: 'published' as FilterTab, label: `Publicados (${publishedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                background: filterTab === tab.id ? 'var(--color-primary)' : 'var(--color-surface)',
                color: filterTab === tab.id ? 'white' : 'var(--color-text)',
                boxShadow: filterTab === tab.id ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Devotionals list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredDevotionals.map((devo, idx) => {
          const isTranslated = devo.translationState !== 'none';
          const buttonLabel = devo.translationState === 'none' ? 'Traduzir' : 'Editar';

          return (
            <div
              key={devo.id}
              style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
                    DEVOCIONAL #{devo.legacy_id || idx + 1}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    • 📅 {devo.publication_date}
                  </span>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '4px' }}>
                  {devo.title}
                </div>

                {isTranslated && (devo.manualTranslation?.title || devo.aiTranslation?.title) && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                    &ldquo;{devo.manualTranslation?.title || devo.aiTranslation?.title}&rdquo;
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                {renderOriginBadge(devo.translationState)}

                <button
                  onClick={() => onSelectDevotional(devo)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-primary)',
                    background: devo.translationState === 'none' ? 'var(--color-primary)' : 'transparent',
                    color: devo.translationState === 'none' ? 'white' : 'var(--color-primary)',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {buttonLabel}
                </button>
              </div>
            </div>
          );
        })}

        {filteredDevotionals.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--color-surface)',
            borderRadius: '12px',
            color: 'var(--color-text-light)'
          }}>
            Nenhum devocional encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
