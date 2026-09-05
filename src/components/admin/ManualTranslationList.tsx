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
  onTranslateWithAI?: (devotionalId: string) => Promise<void>;
}

type FilterTab = 'all' | 'pending' | 'draft' | 'published';

export const ManualTranslationList: React.FC<ManualTranslationListProps> = ({
  language,
  devotionals,
  onSelectDevotional,
  onBack,
  onTranslateWithAI,
}) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

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
    <div style={{ width: '100%', maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-light)',
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.82rem',
            marginBottom: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Translation Center
        </button>

        {/* Language title + stats inline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{language.flag_emoji}</span>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                {language.name}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                {language.native_name}
              </span>
            </div>
          </div>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total', value: totalCount, color: '#64748b', bg: '#f1f5f9' },
              { label: 'Traduzidos', value: publishedCount, color: '#059669', bg: '#ecfdf5' },
              { label: 'Rascunhos', value: draftCount, color: '#d97706', bg: '#fffbeb' },
              { label: 'Pendentes', value: pendingCount, color: '#2563eb', bg: '#eff6ff' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: stat.bg,
                padding: '4px 10px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: '0.72rem', color: stat.color, opacity: 0.8 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search + filter row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por título, ID ou data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexShrink: 0 }}>
            {[
              { id: 'all' as FilterTab, label: 'Todos' },
              { id: 'pending' as FilterTab, label: 'Pendentes' },
              { id: 'draft' as FilterTab, label: 'Rascunhos' },
              { id: 'published' as FilterTab, label: 'Publicados' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: filterTab === tab.id ? '1px solid #c46d53' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  background: filterTab === tab.id ? '#c46d53' : 'var(--color-surface)',
                  color: filterTab === tab.id ? '#fff' : 'var(--color-text-light)',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Devotionals list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredDevotionals.map((devo, idx) => {
          const buttonLabel = devo.translationState === 'none' ? 'Inserir tradução' : 'Editar tradução';
          const isTranslating = translatingIds.has(devo.id);

          return (
            <div
              key={devo.id}
              style={{
                background: 'var(--color-surface, #ffffff)',
                borderRadius: '10px',
                padding: '16px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {/* Row 1: Title */}
              <div style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                lineHeight: 1.3,
              }}>
                {devo.title}
              </div>

              {/* Row 2: Meta */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: 'var(--color-text-light)',
              }}>
                <span style={{ fontWeight: 600 }}>#{devo.legacy_id || idx + 1}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{devo.publication_date}</span>
                {(devo.manualTranslation?.title || devo.aiTranslation?.title) && (
                  <>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ fontStyle: 'italic', color: 'var(--color-text-light)' }}>
                      {devo.manualTranslation?.title || devo.aiTranslation?.title}
                    </span>
                  </>
                )}
              </div>

              {/* Row 3: Badges + Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '2px',
              }}>
                {renderOriginBadge(devo.translationState)}

                {devo.translationState === 'none' && onTranslateWithAI && (
                  <button
                    disabled={isTranslating}
                    onClick={async () => {
                      setTranslatingIds(prev => new Set(prev).add(devo.id));
                      try {
                        await onTranslateWithAI(devo.id);
                      } finally {
                        setTranslatingIds(prev => { const s = new Set(prev); s.delete(devo.id); return s; });
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: '#f9fafb',
                      color: '#374151',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: isTranslating ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: isTranslating ? 0.55 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isTranslating ? '⏳ Traduzindo...' : '✨ Traduzir com IA'}
                  </button>
                )}

                <button
                  onClick={() => onSelectDevotional(devo)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #c46d53',
                    background: devo.translationState === 'none' ? '#c46d53' : 'transparent',
                    color: devo.translationState === 'none' ? '#ffffff' : '#c46d53',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
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
            borderRadius: '10px',
            color: 'var(--color-text-light)',
            fontSize: '0.9rem',
          }}>
            Nenhum devocional encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
