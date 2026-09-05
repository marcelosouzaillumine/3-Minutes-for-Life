import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminContentService } from '../../services/AdminContentService';
import { ManualTranslationEditor } from '../../components/admin/ManualTranslationEditor';
import '../../styles/admin.css';

type FilterMode = 'all' | 'gaps' | 'complete';

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  manual_published: { label: '✓', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  ai_published:     { label: '✓', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  draft:            { label: '📝', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  none:             { label: '+', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
};

export function AdminTranslations() {
  const [languages, setLanguages] = useState<any[]>([]);
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [editing, setEditing] = useState<{ devotional: any; language: any } | null>(null);
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [langs, devos] = await Promise.all([
        AdminContentService.getLanguages(),
        AdminContentService.getDevotionalsWithAllTranslations(),
      ]);
      setLanguages(langs.filter((l: any) => !l.is_source && l.is_active !== false));
      setDevotionals(devos);
    } catch (err: any) {
      console.error('Error loading translation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateGaps = async (devotional: any) => {
    const missingLangs = languages.filter(l => {
      const state = devotional.langMap?.[l.iso_code]?.state;
      return !state || state === 'none';
    });
    if (missingLangs.length === 0) return;

    setTranslatingIds(prev => new Set(prev).add(devotional.id));
    try {
      for (const lang of missingLangs) {
        await supabase.from('translation_jobs').upsert(
          [{ devotional_id: devotional.id, source_language: 'pt-BR', target_language: lang.iso_code, status: 'queued', attempts: 0, error_message: null }],
          { onConflict: 'devotional_id,source_language,target_language' }
        );
      }
      const { error: fnError } = await supabase.functions.invoke('translate-devotional');
      if (fnError) { alert('Erro ao executar tradução: ' + fnError.message); return; }
      await loadData();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setTranslatingIds(prev => { const s = new Set(prev); s.delete(devotional.id); return s; });
    }
  };

  const openEditor = (devotional: any, language: any) => {
    const entry = devotional.langMap?.[language.iso_code];
    const devWithTrans = {
      ...devotional,
      manualTranslation: entry?.manual || null,
      aiTranslation: entry?.ai || null,
    };
    setEditing({ devotional: devWithTrans, language });
  };

  const filteredDevotionals = useMemo(() => {
    return devotionals.filter(devo => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!devo.title?.toLowerCase().includes(q) &&
            !String(devo.legacy_id || '').includes(q) &&
            !devo.publication_date?.includes(q)) return false;
      }
      if (filterMode === 'gaps') {
        return languages.some(l => {
          const s = devo.langMap?.[l.iso_code]?.state;
          return !s || s === 'none';
        });
      }
      if (filterMode === 'complete') {
        return languages.every(l => {
          const s = devo.langMap?.[l.iso_code]?.state;
          return s && s !== 'none';
        });
      }
      return true;
    });
  }, [devotionals, searchQuery, filterMode, languages]);

  // Summary stats
  const totalDevos = devotionals.length;
  const withGaps = devotionals.filter(d =>
    languages.some(l => { const s = d.langMap?.[l.iso_code]?.state; return !s || s === 'none'; })
  ).length;
  const complete = totalDevos - withGaps;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="admin-spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  if (editing) {
    return (
      <div style={{ padding: '20px', paddingBottom: '140px', width: '100%' }}>
        <ManualTranslationEditor
          devotional={editing.devotional}
          language={editing.language}
          onBack={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await loadData(); }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '140px', width: '100%', maxWidth: '900px', margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px 0' }}>Translation Center</h2>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-light)' }}>
          Cobertura de tradução por devocional e idioma
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { label: 'Devocionais', value: totalDevos, color: '#64748b', bg: '#f1f5f9' },
          { label: 'Idiomas', value: languages.length, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Com lacunas', value: withGaps, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Completos', value: complete, color: '#059669', bg: '#ecfdf5' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, padding: '10px 16px', borderRadius: '10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px',
          }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: '0.72rem', color: s.color, opacity: 0.75, marginTop: '2px' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Buscar por título, ID ou data..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 200px', padding: '9px 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '0.875rem',
            background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            ['all', 'Todos'],
            ['gaps', 'Com lacunas'],
            ['complete', 'Completos'],
          ] as [FilterMode, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilterMode(id)}
              style={{
                padding: '8px 14px', borderRadius: '7px', fontWeight: 600,
                fontSize: '0.8rem', whiteSpace: 'nowrap', cursor: 'pointer',
                border: filterMode === id ? '1px solid #c46d53' : '1px solid #e2e8f0',
                background: filterMode === id ? '#c46d53' : 'var(--color-surface)',
                color: filterMode === id ? '#fff' : 'var(--color-text-light)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Language legend */}
      {languages.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
          <span>Idiomas ativos:</span>
          {languages.map(l => (
            <span key={l.iso_code} style={{ fontWeight: 600 }}>{l.flag_emoji} {l.iso_code.toUpperCase()}</span>
          ))}
        </div>
      )}

      {/* Devotional cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredDevotionals.map((devo, idx) => {
          const missingCount = languages.filter(l => {
            const s = devo.langMap?.[l.iso_code]?.state;
            return !s || s === 'none';
          }).length;
          const isTranslating = translatingIds.has(devo.id);

          return (
            <div
              key={devo.id}
              style={{
                background: 'var(--color-surface)',
                borderRadius: '10px',
                padding: '16px 18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* Row 1: Title + meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ fontSize: '0.97rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, flex: 1 }}>
                  {devo.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  #{devo.legacy_id || idx + 1} · {devo.publication_date}
                </div>
              </div>

              {/* Row 2: Language pills + translate button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {languages.map(lang => {
                  const entry = devo.langMap?.[lang.iso_code];
                  const state = entry?.state || 'none';
                  const cfg = STATE_CONFIG[state] || STATE_CONFIG.none;

                  return (
                    <button
                      key={lang.iso_code}
                      onClick={() => openEditor(devo, lang)}
                      title={`${lang.name} — ${state === 'none' ? 'Não traduzido' : state === 'draft' ? 'Rascunho' : state === 'manual_published' ? 'Manual publicado' : 'IA publicado'}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        padding: '4px 9px', borderRadius: '6px',
                        border: `1px solid ${cfg.border}`,
                        background: cfg.bg, color: cfg.color,
                        fontSize: '0.75rem', fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      {lang.flag_emoji} {lang.iso_code.toUpperCase()}
                      <span style={{ marginLeft: '2px', fontSize: '0.7rem' }}>{cfg.label}</span>
                    </button>
                  );
                })}

                {missingCount > 0 && (
                  <button
                    disabled={isTranslating}
                    onClick={() => handleTranslateGaps(devo)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 11px', borderRadius: '6px',
                      border: '1px solid #c4b5fd',
                      background: '#faf5ff', color: '#7c3aed',
                      fontSize: '0.75rem', fontWeight: 700,
                      cursor: isTranslating ? 'not-allowed' : 'pointer',
                      opacity: isTranslating ? 0.55 : 1,
                      whiteSpace: 'nowrap', marginLeft: 'auto',
                    }}
                  >
                    {isTranslating
                      ? '⏳ Traduzindo...'
                      : `✨ Traduzir ${missingCount} ${missingCount === 1 ? 'lacuna' : 'lacunas'} com IA`}
                  </button>
                )}

                {missingCount === 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                    ✓ Completo
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredDevotionals.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'var(--color-surface)', borderRadius: '10px',
            color: 'var(--color-text-light)', fontSize: '0.9rem',
          }}>
            Nenhum devocional encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
