import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminContentService } from '../../services/AdminContentService';
import { ManualTranslationList } from '../../components/admin/ManualTranslationList';
import { ManualTranslationEditor } from '../../components/admin/ManualTranslationEditor';
import '../../styles/admin.css';

export function AdminTranslations() {
  const [languages, setLanguages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // States for Manual Translation Workflow
  const [selectedLangForManual, setSelectedLangForManual] = useState<any | null>(null);
  const [manualDevotionals, setManualDevotionals] = useState<any[]>([]);
  const [loadingDevotionals, setLoadingDevotionals] = useState(false);
  const [selectedDevotionalForManual, setSelectedDevotionalForManual] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: langs } = await supabase.from('languages').select('*').order('display_order');
      if (langs) setLanguages(langs);

      // Jobs aggregation for queue and errors
      const { data: jobs } = await supabase.from('translation_jobs').select('target_language, status');
      
      // Published translations aggregation (Distinct count of devotionals with published translation)
      const { data: translations } = await supabase
        .from('devotional_translations')
        .select('devotional_id, language')
        .eq('status', 'published');

      // Total count of base devotionals
      const { count: totalDevotionals } = await supabase
        .from('devotionals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      
      const newStats: any = {};
      langs?.forEach(l => {
        if (l.is_source) return;

        // Distinct devotional count with any published translation (Manual or AI)
        const publishedDevotionalIds = new Set(
          (translations || [])
            .filter(t => t.language === l.iso_code)
            .map(t => t.devotional_id)
        );
        const completed = publishedDevotionalIds.size;

        const langJobs = jobs?.filter(j => j.target_language === l.iso_code) || [];
        const pending = langJobs.filter(j => j.status === 'queued').length;
        const translating = langJobs.filter(j => j.status === 'translating').length;
        const failed = langJobs.filter(j => j.status === 'failed').length;
        
        newStats[l.iso_code] = {
          total: totalDevotionals || 0,
          completed,
          pending,
          translating,
          failed,
          percent: totalDevotionals ? Math.round((completed / totalDevotionals) * 100) : 0
        };
      });

      setStats(newStats);
    } catch (err: any) {
      console.error('Error loading translation stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManualTranslation = async (lang: any) => {
    try {
      setSelectedLangForManual(lang);
      setSelectedDevotionalForManual(null);
      setLoadingDevotionals(true);
      const devs = await AdminContentService.getDevotionalsForManualTranslation(lang.iso_code);
      setManualDevotionals(devs);
    } catch (err: any) {
      alert('Erro ao carregar devocionais para tradução: ' + err.message);
    } finally {
      setLoadingDevotionals(false);
    }
  };

  const handleRefreshManualList = async () => {
    if (!selectedLangForManual) return;
    try {
      setLoadingDevotionals(true);
      const devs = await AdminContentService.getDevotionalsForManualTranslation(selectedLangForManual.iso_code);
      setManualDevotionals(devs);
      setSelectedDevotionalForManual(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingDevotionals(false);
    }
  };

  const handleTranslateAcervo = async (isoCode: string) => {
    if (!confirm(`Deseja enviar todo o acervo não traduzido para a fila de tradução automática (${isoCode})?`)) return;
    
    try {
      const { data: devotionals } = await supabase.from('devotionals').select('id, status').eq('status', 'published');
      if (!devotionals) return;

      const jobs = devotionals.map(d => ({
        devotional_id: d.id,
        source_language: 'pt-BR',
        target_language: isoCode,
        status: 'queued'
      }));

      const { error } = await supabase
        .from('translation_jobs')
        .upsert(jobs, { onConflict: 'devotional_id,source_language,target_language' });

      if (error) throw error;
      alert('Traduções enviadas para a fila automática!');
      loadData();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="admin-spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  // View: Manual Translation Editor
  if (selectedLangForManual && selectedDevotionalForManual) {
    return (
      <div style={{ padding: '20px', paddingBottom: '100px', width: '100%' }}>
        <ManualTranslationEditor
          devotional={selectedDevotionalForManual}
          language={selectedLangForManual}
          onBack={() => setSelectedDevotionalForManual(null)}
          onSaved={handleRefreshManualList}
        />
      </div>
    );
  }

  // View: Manual Translation List for selected language
  if (selectedLangForManual) {
    return (
      <div style={{ padding: '20px', paddingBottom: '100px', width: '100%' }}>
        {loadingDevotionals ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="admin-spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : (
          <ManualTranslationList
            language={selectedLangForManual}
            devotionals={manualDevotionals}
            onSelectDevotional={(dev) => setSelectedDevotionalForManual(dev)}
            onBack={() => {
              setSelectedLangForManual(null);
              setSelectedDevotionalForManual(null);
              loadData();
            }}
          />
        )}
      </div>
    );
  }

  // View: Translation Center Overview
  return (
    <div style={{ padding: '20px', paddingBottom: '100px', width: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>Translation Center</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {languages.filter(l => !l.is_source).map(lang => {
          const s = stats[lang.iso_code];
          return (
            <div key={lang.iso_code} style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                  {lang.flag_emoji} {lang.name}
                  {!lang.is_active && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginLeft: '8px' }}>(Inativo)</span>}
                </h3>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleOpenManualTranslation(lang)}
                    style={{
                      background: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ✍️ Traduzir manualmente
                  </button>

                  <button 
                    onClick={() => handleTranslateAcervo(lang.iso_code)}
                    style={{
                      background: 'none',
                      border: '1px solid #ddd',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      color: 'var(--color-text)'
                    }}
                  >
                    Traduzir Acervo Existente (IA)
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 'bold' }}>
                  <span>Progresso Geral</span>
                  <span>{s?.percent || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${s?.percent || 0}%`, height: '100%', background: 'var(--color-primary)' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 120px', background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{s?.total || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Total</div>
                </div>
                <div style={{ flex: '1 1 120px', background: '#ecfdf5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{s?.completed || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#059669' }}>Publicados</div>
                </div>
                <div style={{ flex: '1 1 120px', background: '#eff6ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2563eb' }}>{s?.pending + s?.translating || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Na Fila</div>
                </div>
                <div style={{ flex: '1 1 120px', background: '#fef2f2', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626' }}>{s?.failed || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Falhas</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
