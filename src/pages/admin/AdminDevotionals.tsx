import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminContentService, buildLangMap } from '../../services/AdminContentService';
import { AdminService, type DevotionalRanking, type DevotionalRankingItem } from '../../services/AdminService';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { PrincipleView } from '../../components/PrincipleView';
import { MediaLibraryPicker } from '../../components/admin/MediaLibraryPicker';
import { DevotionalLanguages, type KidsSummaries } from '../../components/admin/DevotionalLanguages';
import { BANDS, FamilyAdmin, type Band } from '../../services/FamilyService';
import { KidsBandEditor, bandLabel } from '../../components/admin/KidsBandEditor';
import { ManualTranslationEditor } from '../../components/admin/ManualTranslationEditor';
import { publishAll, publishAllForDevotional, type PublishReport } from '../../services/PublishAllService';
import '../../styles/admin.css';

export function AdminDevotionals() {
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // null = ranking indisponível (gateway sem o endpoint ou falha de rede);
  // a lista de conteúdo continua funcionando sem as métricas.
  const [ranking, setRanking] = useState<DevotionalRanking | null>(null);

  // States for editor
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [currentLang, setCurrentLang] = useState<string>('pt-BR');
  // Versão em edição dentro do idioma: o texto adulto ou uma das faixas infantis.
  const [version, setVersion] = useState<'adult' | Band>('adult');
  const [studioMsg, setStudioMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Content image state (Dica de conteúdo / Apoio ao projeto) — keyed by field name
  const [contentImageError] = useState<Record<string, string>>({});

  // Media library picker state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'content_tip_image_url' | 'support_banner_url' | null>(null);

  // States for Category Management
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryActionError, setCategoryActionError] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingDevotionalId, setDeletingDevotionalId] = useState<string | null>(null);

  // Idiomas na lista: faixas infantis por idioma e publicação em lote
  const [kidsSummaries, setKidsSummaries] = useState<KidsSummaries>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishReport, setPublishReport] = useState<PublishReport | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devs, cats, langs, rank] = await Promise.all([
        AdminContentService.getDevotionals(),
        AdminContentService.getCategories(),
        AdminContentService.getLanguages(),
        AdminService.getDevotionalRanking().catch(() => null)
      ]);
      setDevotionals(devs);
      setCategories(cats);
      setLanguages(langs);
      setRanking(rank);
      loadKidsSummaries(langs);
    } catch (err: any) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadKidsSummaries = async (langs: any[]) => {
    const all = await Promise.all(langs.map((l: any) => FamilyAdmin.kidsSummary(l.iso_code).catch(() => ({}))));
    setKidsSummaries(Object.fromEntries(langs.map((l: any, i: number) => [l.iso_code, all[i]])));
  };

  const runPublish = async (key: string, targets: any[], question: string) => {
    if (!window.confirm(question)) return;
    setPublishing(key);
    setPublishReport(null);
    try {
      const report = targets.length === 1 ? await publishAllForDevotional(targets[0], languages) : await publishAll(targets, languages);
      setPublishReport(report);
      await loadData();
    } catch (err: any) {
      alert('Erro ao publicar: ' + err.message);
    } finally {
      setPublishing(null);
    }
  };

  const handlePublishDevotional = (e: React.MouseEvent, devo: any) => {
    e.stopPropagation();
    runPublish(devo.id, [devo], `Publicar em todos os idiomas os rascunhos de "${devo.title}" (texto adulto e faixas infantis)? O que estiver incompleto fica de fora.`);
  };

  const handlePublishEverything = () =>
    runPublish('all', devotionals, 'Publicar os rascunhos de TODOS os devocionais em todos os idiomas (texto adulto e faixas infantis)? O que estiver incompleto fica de fora.');

  const handleEditClick = async (id: string, lang?: string) => {
    try {
      setLoading(true);
      const fullDevotional = await AdminContentService.getDevotional(id);

      const translationsMap: Record<string, any> = {};
      if (fullDevotional.devotional_translations) {
        fullDevotional.devotional_translations.forEach((t: any) => {
          if (t.language !== 'pt-BR') {
            translationsMap[t.language] = {
              title: t.title,
              principle_statement: t.principle_statement,
              reflection: t.reflection,
              practical_application: t.practical_application,
              prayer: t.prayer,
              content_tip: t.content_tip,
              content_tip_image_url: t.content_tip_image_url,
              content_tip_url: t.content_tip_url,
              support_message: t.support_message,
              support_banner_url: t.support_banner_url,
              support_link_url: t.support_link_url,
              status: t.status,
              validation_warnings: t.validation_warnings
            };
          }
        });
      }

      setEditForm({ ...fullDevotional, translations: translationsMap });
      setEditingId(id);
      const sourceLang = languages.find(l => l.is_source)?.iso_code || 'pt-BR';
      setCurrentLang(lang ?? sourceLang);
      setVersion('adult');
      setStudioMsg('');
    } catch (err: any) {
      alert('Erro ao carregar devocional: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    const initialTranslations: Record<string, any> = {};
    languages.forEach(lang => {
      if (!lang.is_source) {
        initialTranslations[lang.iso_code] = { title: '', principle_statement: '', reflection: '', practical_application: '', prayer: '', content_tip: '', content_tip_image_url: '', content_tip_url: '', support_message: '', support_banner_url: '', support_link_url: '' };
      }
    });

    setEditForm({
      title: '',
      principle_statement: '',
      reflection: '',
      practical_application: '',
      prayer: '',
      discussion_questions: '',
      content_tip: '',
      content_tip_image_url: '',
      content_tip_url: '',
      support_message: '',
      support_banner_url: '',
      support_link_url: '',
      scripture_reference: '',
      scripture_text: '',
      audio_url: '',
      status: 'draft',
      publication_date: new Date().toISOString().split('T')[0],
      category_id: '',
      translations: initialTranslations
    });
    setEditingId('new');
    const sourceLang = languages.find(l => l.is_source)?.iso_code || 'pt-BR';
    setCurrentLang(sourceLang);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    loadData();
    setEditForm(null);
    setShowPreview(false);
    const sourceLang = languages.find(l => l.is_source)?.iso_code || 'pt-BR';
    setCurrentLang(sourceLang);
  };

  /** Recarrega só as traduções e as faixas do devocional aberto, sem perder o que está sendo digitado no texto original. */
  const refreshStudio = async () => {
    if (!editingId || editingId === 'new') return;
    const fresh = await AdminContentService.getDevotional(editingId);
    setEditForm((prev: any) => ({ ...prev, devotional_translations: fresh.devotional_translations }));
    loadKidsSummaries(languages);
  };

  const langName = (iso: string) => languages.find((l) => l.iso_code === iso)?.name ?? iso;

  const handleTranslate = async (isoCodes: string[]) => {
    if (!editingId || editingId === 'new' || isoCodes.length === 0) return;
    setPublishing('translate');
    setStudioMsg('Traduzindo com IA…');
    const r = await AdminContentService.translateWithAi(editingId, isoCodes);
    setStudioMsg(r.ok ? `Tradução em rascunho: ${isoCodes.map(langName).join(', ')}. Revise antes de publicar.` : `Tradução falhou: ${r.error}`);
    await refreshStudio();
    setPublishing(null);
  };

  const handlePublishFromEditor = async (only?: string) => {
    if (!editingId || editingId === 'new' || !editForm) return;
    const targets = only ? languages.filter((l) => l.iso_code === only) : languages;
    if (!window.confirm(only ? `Publicar os rascunhos de ${langName(only)} deste devocional (texto adulto e faixas infantis)?` : 'Publicar os rascunhos de todos os idiomas deste devocional (texto adulto e faixas infantis)? O que estiver incompleto fica de fora.')) return;
    setPublishing(only ?? 'editor');
    try {
      const fresh = await AdminContentService.getDevotional(editingId);
      const report = await publishAllForDevotional(fresh, targets);
      setPublishReport(report);
      setStudioMsg(`${report.published} item(ns) publicado(s)${report.skipped.length ? `; ${report.skipped.length} ficaram de fora (veja abaixo)` : ''}.`);
      await refreshStudio();
    } catch (err: any) {
      setStudioMsg('Erro ao publicar: ' + err.message);
    } finally {
      setPublishing(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    // Remove empty optional fields that shouldn't be empty strings in db
    const payload = { ...editForm };
    if (!payload.category_id) payload.category_id = null;
    if (!payload.principle_statement) payload.principle_statement = null;
    if (!payload.prayer) payload.prayer = null;
    if (!payload.discussion_questions?.trim()) payload.discussion_questions = null;
    if (!payload.content_tip) payload.content_tip = null;
    if (!payload.content_tip_image_url) payload.content_tip_image_url = null;
    if (!payload.content_tip_url) payload.content_tip_url = null;
    if (!payload.support_message) payload.support_message = null;
    if (!payload.support_banner_url) payload.support_banner_url = null;
    if (!payload.support_link_url) payload.support_link_url = null;

    try {
      setSaving(true);
      if (editingId === 'new') {
        await AdminContentService.createDevotional(payload);
      } else {
        await AdminContentService.updateDevotional(editingId!, payload);
      }
      setEditingId(null);
      setEditForm(null);
      await loadData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      setSavingCategory(true);
      setCategoryActionError('');
      await AdminContentService.createCategory(newCategoryName.trim());
      setNewCategoryName('');
      const cats = await AdminContentService.getCategories();
      setCategories(cats);
    } catch (err: any) {
      setCategoryActionError('Erro ao criar categoria: ' + err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleStartEditCategory = (cat: any) => {
    setCategoryActionError('');
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    try {
      setSavingCategory(true);
      setCategoryActionError('');
      await AdminContentService.updateCategory(editingCategoryId, editingCategoryName.trim());
      setEditingCategoryId(null);
      setEditingCategoryName('');
      const cats = await AdminContentService.getCategories();
      setCategories(cats);
      await loadData();
    } catch (err: any) {
      setCategoryActionError('Erro ao atualizar categoria: ' + err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    const inUse = devotionals.filter(d => d.category_id === cat.id).length;
    const confirmMsg = inUse > 0
      ? `A categoria "${cat.name}" está em uso em ${inUse} devocional(is). Excluí-la vai remover essa categoria desses devocionais. Deseja continuar?`
      : `Excluir a categoria "${cat.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingCategoryId(cat.id);
      setCategoryActionError('');
      await AdminContentService.deleteCategory(cat.id);
      const cats = await AdminContentService.getCategories();
      setCategories(cats);
      await loadData();
    } catch (err: any) {
      setCategoryActionError('Erro ao excluir categoria: ' + err.message);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleDeleteDevotional = async (e: React.MouseEvent, devo: any) => {
    e.stopPropagation();
    if (!window.confirm(`Excluir o devocional "${devo.title}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setDeletingDevotionalId(devo.id);
      await AdminContentService.deleteDevotional(devo.id);
      setDevotionals(prev => prev.filter(d => d.id !== devo.id));
      // Excluir um episódio reposiciona todos os abaixo dele no ranking.
      setRanking(await AdminService.getDevotionalRanking().catch(() => null));
    } catch (err: any) {
      alert('Erro ao excluir devocional: ' + err.message);
    } finally {
      setDeletingDevotionalId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'var(--color-text-light)',
      scheduled: '#d97706',
      published: '#059669',
      archived: '#dc2626'
    };
    
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      scheduled: 'Agendado',
      published: 'Publicado',
      archived: 'Arquivado'
    };

    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        backgroundColor: `${colors[status] || '#999'}20`,
        color: colors[status] || '#999'
      }}>
        {labels[status] || status}
      </span>
    );
  };

  const fmt = (n: number) => n.toLocaleString('pt-BR');

  const renderStats = (stats: DevotionalRankingItem | undefined) => {
    // Episódio criado depois da última carga do ranking: mostra zeros, sem posição.
    const s = stats ?? { devotional_id: '', unique_reads: 0, total_opens: 0, total_shares: 0, rank_by_reads: null, rank_by_opens: null, rank_by_shares: null };
    const ranked = s.rank_by_reads !== null;
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px 14px',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        fontSize: '0.85rem',
      }}>
        <span title="Usuários distintos que leram este episódio">
          📖 <strong>{fmt(s.unique_reads)}</strong> {s.unique_reads === 1 ? 'leitura única' : 'leituras únicas'}
        </span>
        <span title="Todas as aberturas do episódio, incluindo reaberturas e visitantes">
          👁️ <strong>{fmt(s.total_opens)}</strong> {s.total_opens === 1 ? 'abertura' : 'aberturas'}
        </span>
        <span title="Compartilhamentos concluídos deste episódio (o mesmo episódio compartilhado duas vezes conta duas)">
          🔗 <strong>{fmt(s.total_shares)}</strong> {s.total_shares === 1 ? 'compartilhamento' : 'compartilhamentos'}
        </span>
        <span
          title={ranked
            ? `Ranking entre ${ranking?.total_ranked ?? 0} episódios, por leituras únicas (desempate por aberturas). Por aberturas: ${s.rank_by_opens}º.`
            : 'Rascunhos e episódios agendados não entram no ranking'}
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {ranked ? (
            <>
              <span style={{
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 10px',
                fontWeight: 'bold',
                fontSize: '0.8rem',
              }}>
                🏆 #{s.rank_by_reads} de {ranking?.total_ranked}
              </span>
              <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem' }}>
                #{s.rank_by_opens} em aberturas
                {/* Sem compartilhamentos todos empatam em último: a posição não informa nada. */}
                {s.total_shares > 0 && s.rank_by_shares !== null && <> · #{s.rank_by_shares} em compartilhamentos</>}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem' }}>Fora do ranking</span>
          )}
        </span>
      </div>
    );
  };

  if (showPreview && editForm) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 9999, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <button
            onClick={() => setShowPreview(false)}
            style={{
              background: 'white',
              color: 'var(--color-text)',
              border: '1px solid #ddd',
              borderRadius: '20px',
              padding: '8px 20px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            &larr; Fechar Preview
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 'var(--content-max-width)' }}>
            <PrincipleView
              devotional={editForm as any}
              onBack={() => setShowPreview(false)}
            />
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (editingId) {
    return (
      <div style={{ padding: '20px', paddingBottom: '100px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button 
            onClick={handleCancelEdit}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 'bold', padding: 0 }}
          >
            &larr; Voltar
          </button>
          
          <button 
            onClick={() => setShowPreview(true)}
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid #ddd', borderRadius: '8px', padding: '6px 12px', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            👁️ Preview
          </button>
        </div>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 'bold' }}>
          {editingId === 'new' ? 'Novo Devocional' : 'Editar Devocional'}
        </h2>

        {editingId !== 'new' && (() => {
          const langMap = buildLangMap(editForm);
          const kidsFor = (iso: string) => kidsSummaries[iso]?.[editingId!];
          const missing = languages.filter((l) => !l.is_source && !langMap[l.iso_code]).map((l) => l.iso_code);
          const chip = (active: boolean) => ({ padding: '6px 12px', borderRadius: '999px', border: `1px solid ${active ? 'var(--color-primary)' : '#ddd'}`, background: active ? 'var(--color-primary)' : 'white', color: active ? 'white' : 'var(--color-text)', fontSize: '0.85rem', cursor: 'pointer' } as const);
          return (
            <div style={{ marginBottom: '16px', display: 'grid', gap: '10px' }}>
              <div role="tablist" aria-label="Idioma" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {languages.map((l) => {
                  const e = langMap[l.iso_code];
                  const mark = l.is_source ? '' : !e ? ' ○' : e.state === 'draft' ? ' ●' : e.isStale || e.isPossiblyStale ? ' ⚠' : ' ✓';
                  return <button key={l.iso_code} type="button" role="tab" aria-selected={l.iso_code === currentLang} style={chip(l.iso_code === currentLang)} onClick={() => { setCurrentLang(l.iso_code); setStudioMsg(''); }}>{l.iso_code === 'pt-BR' ? 'PT' : l.iso_code.toUpperCase()}{mark}</button>;
                })}
              </div>
              <div role="tablist" aria-label="Versão" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" role="tab" aria-selected={version === 'adult'} style={chip(version === 'adult')} onClick={() => setVersion('adult')}>Texto adulto</button>
                {BANDS.map((b) => (
                  <button key={b} type="button" role="tab" aria-selected={version === b} style={chip(version === b)} onClick={() => { setVersion(b); setStudioMsg(''); }}>
                    {bandLabel(b)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  {langName(currentLang)} · faixas infantis no ar: {kidsFor(currentLang)?.published ?? 0}/{BANDS.length}
                </span>
                <span style={{ flex: 1 }} />
                {missing.length > 0 && <button type="button" disabled={publishing !== null} style={chip(false)} onClick={() => handleTranslate(missing)}>Traduzir com IA ({missing.map((m) => m.toUpperCase()).join(', ')})</button>}
                <button type="button" disabled={publishing !== null} style={chip(false)} onClick={() => handlePublishFromEditor(currentLang)}>Publicar este idioma</button>
                <button type="button" disabled={publishing !== null} style={{ ...chip(true), fontWeight: 'bold' }} onClick={() => handlePublishFromEditor()}>Publicar em todos os idiomas</button>
              </div>
              {studioMsg && <p role="status" style={{ margin: 0, fontSize: '0.85rem' }}>{studioMsg}</p>}
              {publishReport && publishReport.skipped.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#b45309' }}>{publishReport.skipped.map((m) => <li key={m}>{m}</li>)}</ul>
              )}
            </div>
          );
        })()}

        {editingId !== 'new' && version !== 'adult' && (
          <KidsBandEditor devotional={editForm} language={currentLang} languageName={langName(currentLang)} band={version} onChanged={refreshStudio} />
        )}

        {editingId !== 'new' && version === 'adult' && !languages.find((l) => l.iso_code === currentLang)?.is_source && (() => {
          const lang = languages.find((l) => l.iso_code === currentLang)!;
          const entry = buildLangMap(editForm)[currentLang];
          return (
            <ManualTranslationEditor
              key={`${currentLang}-${entry?.manual?.updated_at ?? ''}-${entry?.ai?.updated_at ?? ''}`}
              devotional={{ ...editForm, manualTranslation: entry?.manual ?? null, aiTranslation: entry?.ai ?? null }}
              language={{ ...lang, native_name: lang.native_name ?? lang.name }}
              onBack={() => { setCurrentLang(languages.find((l) => l.is_source)?.iso_code ?? 'pt-BR'); }}
              onSaved={refreshStudio}
            />
          );
        })()}

        {(editingId === 'new' || (version === 'adult' && languages.find((l) => l.iso_code === currentLang)?.is_source)) && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Data de Publicação</label>
              <input 
                type="date" 
                value={editForm.publication_date || ''}
                onChange={(e) => setEditForm({...editForm, publication_date: e.target.value})}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Status</label>
              <select 
                value={editForm.status || 'draft'}
                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
              >
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendado</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Categoria</label>
              <select 
                value={editForm.category_id || ''}
                onChange={(e) => setEditForm({...editForm, category_id: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
              >
                <option value="">Nenhuma</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>URL do Áudio</label>
              <input 
                type="text" 
                value={editForm.audio_url || ''}
                onChange={(e) => setEditForm({...editForm, audio_url: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #ddd', paddingBottom: '16px', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Versículo Base</label>
              <textarea 
                value={editForm.scripture_text || ''}
                onChange={(e) => setEditForm({...editForm, scripture_text: e.target.value})}
                rows={2}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Referência (Ex: João 3:16)</label>
              <input 
                type="text" 
                value={editForm.scripture_reference || ''}
                onChange={(e) => setEditForm({...editForm, scripture_reference: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>
          </div>



          {(() => {
            const isSource = languages.find(l => l.iso_code === currentLang)?.is_source;
            const currentTranslation = editForm?.translations?.[currentLang];
            const hasWarnings = currentTranslation?.validation_warnings?.length > 0;
            
            // Helper to get/set value based on current language
            const getValue = (field: string) => {
              if (isSource) return editForm[field] || '';
              return currentTranslation?.[field] || '';
            };

            const setValue = (field: string, value: string) => {
              if (isSource) {
                setEditForm({ ...editForm, [field]: value });
              } else {
                setEditForm({
                  ...editForm,
                  translations: {
                    ...editForm.translations,
                    [currentLang]: {
                      ...(editForm.translations?.[currentLang] || {}),
                      [field]: value
                    }
                  }
                });
              }
            };

            // Só desvincula a imagem deste conteúdo; o arquivo continua na biblioteca de mídia.
            const handleContentImageRemove = (field: 'content_tip_image_url' | 'support_banner_url') => {
              setValue(field, '');
            };

            return (
              <>
                {!isSource && hasWarnings && (
                  <div style={{ padding: '12px', background: '#fffbeb', color: '#b45309', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fde68a' }}>
                    <strong>⚠️ Avisos de Validação da IA:</strong>
                    <ul style={{ margin: '8px 0 0 20px' }}>
                      {currentTranslation.validation_warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Título</label>
                  <input 
                    type="text" 
                    value={getValue('title')}
                    onChange={(e) => setValue('title', e.target.value)}
                    required={isSource}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Destaque / Principle Statement</label>
                  <textarea 
                    value={getValue('principle_statement')}
                    onChange={(e) => setValue('principle_statement', e.target.value)}
                    rows={3}
                    placeholder="Frase curta de destaque..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Reflexão</label>
                  <RichTextEditor 
                    key={`reflection-${currentLang}`}
                    value={getValue('reflection')}
                    onChange={(html) => setValue('reflection', html)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Aplicação Prática</label>
                  <RichTextEditor 
                    key={`practical-${currentLang}`}
                    value={getValue('practical_application')}
                    onChange={(html) => setValue('practical_application', html)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Oração</label>
                  <RichTextEditor 
                    key={`prayer-${currentLang}`}
                    value={getValue('prayer')}
                    onChange={(html) => setValue('prayer', html)}
                  />
                </div>

                {isSource && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Perguntas para conversar (adultos)</label>
                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#888' }}>
                      De 3 a 5 perguntas, uma por linha, para casal ou grupo conversarem no Ler juntos. Se ficar em branco, o app usa perguntas gerais. Depois, traduza para os outros idiomas.
                    </p>
                    <textarea
                      rows={5}
                      value={getValue('discussion_questions')}
                      onChange={(e) => setValue('discussion_questions', e.target.value)}
                      placeholder={'O que mais chamou a sua atenção?\nOnde isso toca a sua semana?'}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Dica de conteúdo (opcional)
                  </label>
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#888' }}>
                    Aparece logo após "Minha reflexão". Use para indicar outro conteúdo relacionado ao tema — sem tom de venda. Deixe em branco para não exibir.
                  </p>
                  <RichTextEditor 
                    key={`content_tip-${currentLang}`}
                    value={getValue('content_tip')}
                    onChange={(html) => setValue('content_tip', html)}
                  />

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      🖼️ Imagem opcional (proporção 4:5, aparece ao lado do texto)
                    </label>
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#888' }}>
                      Se enviada, o texto fica alinhado à esquerda e a imagem à direita. Em telas pequenas, a imagem passa para cima do texto.
                    </p>

                    {getValue('content_tip_image_url') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={getValue('content_tip_image_url')}
                          alt="Prévia"
                          style={{ width: '80px', aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <button
                          type="button"
                          onClick={() => { setMediaPickerTarget('content_tip_image_url'); setMediaPickerOpen(true); }}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
                        >
                          Trocar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContentImageRemove('content_tip_image_url')}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setMediaPickerTarget('content_tip_image_url'); setMediaPickerOpen(true); }}
                        style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
                      >
                        🖼️ Selecionar da biblioteca
                      </button>
                    )}
                    {contentImageError['content_tip_image_url'] && (
                      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#dc2626' }}>
                        {contentImageError['content_tip_image_url']}
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      🔗 Link externo (opcional)
                    </label>
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#888' }}>
                      Se preenchido, a imagem acima fica clicável e abre este link em nova aba.
                    </p>
                    <input
                      type="url"
                      value={getValue('content_tip_url')}
                      onChange={(e) => setValue('content_tip_url', e.target.value)}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </>
            );
          })()}

          <button
            type="submit"
            disabled={saving}
            style={{ width: '100%', padding: '16px', marginTop: '8px', fontSize: '1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Salvando...' : 'Salvar Devocional'}
          </button>
        </form>
        )}
      {mediaPickerOpen && mediaPickerTarget && (
        <MediaLibraryPicker
          onSelect={(url) => {
            const isSource = languages.find(l => l.iso_code === currentLang)?.is_source;
            if (isSource) {
              setEditForm((prev: any) => ({ ...prev, [mediaPickerTarget]: url }));
            } else {
              setEditForm((prev: any) => ({
                ...prev,
                translations: {
                  ...prev.translations,
                  [currentLang]: {
                    ...(prev.translations?.[currentLang] || {}),
                    [mediaPickerTarget]: url,
                  },
                },
              }));
            }
            setMediaPickerOpen(false);
            setMediaPickerTarget(null);
          }}
          onClose={() => {
            setMediaPickerOpen(false);
            setMediaPickerTarget(null);
          }}
        />
      )}
    </div>
  );

  }

  if (showCategoryManager) {
    return (
      <div style={{ padding: '20px', paddingBottom: '100px', width: '100%' }}>
        <button 
          onClick={() => setShowCategoryManager(false)}
          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '16px', padding: 0 }}
        >
          &larr; Voltar
        </button>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 'bold' }}>Categorias</h2>

        {categoryActionError && (
          <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {categoryActionError}
          </div>
        )}

        <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Nova categoria"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <button
            type="submit"
            disabled={savingCategory || !newCategoryName.trim()}
            style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: 'bold' }}
          >
            Adicionar
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eee' }}>
              {editingCategoryId === cat.id ? (
                <form onSubmit={handleSaveEditCategory} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    autoFocus
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                  <button
                    type="submit"
                    disabled={savingCategory || !editingCategoryName.trim()}
                    style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditCategory}
                    disabled={savingCategory}
                    style={{ background: 'white', color: 'var(--color-text)', border: '1px solid #ddd', borderRadius: '6px', padding: '0 12px', fontSize: '0.85rem' }}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleStartEditCategory(cat)}
                      style={{ background: 'white', color: 'var(--color-text)', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={deletingCategoryId === cat.id}
                      onClick={() => handleDeleteCategory(cat)}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', cursor: deletingCategoryId === cat.id ? 'not-allowed' : 'pointer' }}
                    >
                      {deletingCategoryId === cat.id ? 'Excluindo…' : 'Excluir'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <p style={{ color: 'var(--color-text-light)' }}>Nenhuma categoria criada.</p>
          )}
        </div>
      </div>
    );
  }

  const rankingById = new Map(ranking?.items.map(i => [i.devotional_id, i]) ?? []);

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Conteúdo</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowCategoryManager(true)}
            style={{ 
              background: 'var(--color-surface)', 
              color: 'var(--color-text)', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '8px 12px',
              fontWeight: 'bold'
            }}
          >
            Categorias
          </button>
          <button
            type="button"
            disabled={publishing !== null || devotionals.length === 0}
            onClick={handlePublishEverything}
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 12px', fontWeight: 'bold', opacity: publishing ? 0.6 : 1 }}
          >
            {publishing === 'all' ? 'Publicando…' : 'Publicar tudo'}
          </button>
          <button 
            onClick={handleCreateNew}
            style={{ 
              background: 'var(--color-primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '8px 16px',
              fontWeight: 'bold'
            }}
          >
            + Criar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="admin-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!ranking && devotionals.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'center' }}>
              Métricas de leitura e ranking indisponíveis no momento.
            </div>
          )}
          {publishReport && (
            <div role="status" style={{ background: publishReport.skipped.length ? '#fffbeb' : '#ecfdf5', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem' }}>
              {publishReport.published} item(ns) publicado(s){publishReport.skipped.length > 0 && <>; {publishReport.skipped.length} ficaram de fora:</>}
              {publishReport.skipped.length > 0 && <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>{publishReport.skipped.map((m) => <li key={m}>{m}</li>)}</ul>}
              <button type="button" onClick={() => setPublishReport(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Fechar</button>
            </div>
          )}
          {devotionals.map(devo => (
            <div 
              key={devo.id} 
              onClick={() => handleEditClick(devo.id)}
              style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, flex: 1, paddingRight: '12px' }}>
                  {devo.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {getStatusBadge(devo.status || 'published')}
                  <button
                    type="button"
                    disabled={publishing !== null}
                    onClick={(e) => handlePublishDevotional(e, devo)}
                    style={{ background: 'var(--color-surface)', border: '1px solid #ddd', borderRadius: '6px', padding: '3px 8px', fontSize: '0.78rem', cursor: publishing ? 'not-allowed' : 'pointer', opacity: publishing ? 0.6 : 1 }}
                  >
                    {publishing === devo.id ? '…' : 'Publicar em todos os idiomas'}
                  </button>
                  <button
                    type="button"
                    disabled={deletingDevotionalId === devo.id}
                    onClick={(e) => handleDeleteDevotional(e, devo)}
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.78rem',
                      cursor: deletingDevotionalId === devo.id ? 'not-allowed' : 'pointer',
                      opacity: deletingDevotionalId === devo.id ? 0.6 : 1,
                    }}
                  >
                    {deletingDevotionalId === devo.id ? '…' : 'Excluir'}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', display: 'flex', gap: '12px' }}>
                <span>📅 {devo.publication_date}</span>
                {devo.categories?.name && <span>🏷️ {devo.categories.name}</span>}
              </div>
              {ranking && renderStats(rankingById.get(devo.id))}
              <DevotionalLanguages devo={devo} languages={languages} kids={kidsSummaries} onOpen={(iso) => handleEditClick(devo.id, iso)} />
            </div>
          ))}
          {devotionals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-light)' }}>
              Nenhum devocional encontrado.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
