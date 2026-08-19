import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/admin.css';

export function AdminTranslations() {
  const [languages, setLanguages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: langs } = await supabase.from('languages').select('*').order('display_order');
      if (langs) setLanguages(langs);

      // Simple stats aggregation
      const { data: jobs } = await supabase.from('translation_jobs').select('target_language, status');
      const { count: totalDevotionals } = await supabase.from('devotionals').select('*', { count: 'exact', head: true });
      
      const newStats: any = {};
      langs?.forEach(l => {
        if (l.is_source) return;
        const langJobs = jobs?.filter(j => j.target_language === l.iso_code) || [];
        const completed = langJobs.filter(j => j.status === 'completed').length;
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateAcervo = async (isoCode: string) => {
    if (!confirm(`Deseja enviar todo o acervo não traduzido para a fila de tradução (${isoCode})?`)) return;
    
    try {
      // In a real robust system, this should be an Edge Function. 
      // For now, we simulate bulk insert to the queue.
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
      alert('Traduções enviadas para a fila!');
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

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', width: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>Translation Center</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {languages.filter(l => !l.is_source).map(lang => {
          const s = stats[lang.iso_code];
          return (
            <div key={lang.iso_code} style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                  {lang.flag_emoji} {lang.name}
                  {!lang.is_active && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginLeft: '8px' }}>(Inativo)</span>}
                </h3>
                <button 
                  onClick={() => handleTranslateAcervo(lang.iso_code)}
                  style={{ background: 'none', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  Traduzir Acervo Existente
                </button>
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

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }}>
                <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{s?.total || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Total</div>
                </div>
                <div style={{ flex: 1, background: '#ecfdf5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{s?.completed || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#059669' }}>Publicados</div>
                </div>
                <div style={{ flex: 1, background: '#eff6ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2563eb' }}>{s?.pending + s?.translating || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Na Fila</div>
                </div>
                <div style={{ flex: 1, background: '#fef2f2', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
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
