import React, { useEffect, useState } from 'react';
import { AdminContentService } from '../../services/AdminContentService';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { PrincipleView } from '../../components/PrincipleView';
import { MediaLibraryPicker } from '../../components/admin/MediaLibraryPicker';
import '../../styles/admin.css';

export function AdminDevotionals() {
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States for editor
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [currentLang, setCurrentLang] = useState<string>('pt-BR');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // WhatsApp share state
  const [waPreviewLang, setWaPreviewLang] = useState<string | null>(null);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devs, cats, langs] = await Promise.all([
        AdminContentService.getDevotionals(),
        AdminContentService.getCategories(),
        AdminContentService.getLanguages()
      ]);
      setDevotionals(devs);
      setCategories(cats);
      setLanguages(langs);
    } catch (err: any) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (id: string) => {
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
      setWaPreviewLang(null);
      const sourceLang = languages.find(l => l.is_source)?.iso_code || 'pt-BR';
      setCurrentLang(sourceLang);
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
    setEditForm(null);
    setShowPreview(false);
    setWaPreviewLang(null);
    const sourceLang = languages.find(l => l.is_source)?.iso_code || 'pt-BR';
    setCurrentLang(sourceLang);
  };

  // ─── WhatsApp Share ───────────────────────────────────────────────────────

  const WA_CTA: Record<string, string> = {
    'pt-BR': '📖 Leia o devocional de hoje:',
    'en':    '📖 Read today\'s devotional:',
    'es':    '📖 Lee el devocional de hoy:',
  };

  const buildWaText = (langCode: string): string => {
    const isSource = languages.find(l => l.iso_code === langCode)?.is_source;
    const tr = editForm?.translations?.[langCode];
    const title = ((isSource ? editForm?.title : tr?.title) || editForm?.title || '').trim();
    const principle = ((isSource ? editForm?.principle_statement : tr?.principle_statement) || editForm?.principle_statement || '').trim();
    const cta = WA_CTA[langCode] || WA_CTA['pt-BR'];
    const link = 'https://www.3minutesforlife.com';
    return [title, principle ? `"${principle}"` : '', cta, link].filter(Boolean).join('\n\n');
  };

  const handleShareWhatsApp = (langCode: string) => {
    const text = buildWaText(langCode);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    // Remove empty optional fields that shouldn't be empty strings in db
    const payload = { ...editForm };
    if (!payload.category_id) payload.category_id = null;
    if (!payload.principle_statement) payload.principle_statement = null;
    if (!payload.prayer) payload.prayer = null;
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

  if (showPreview && editForm) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 9999, overflowY: 'auto' }}>
        <button 
          onClick={() => setShowPreview(false)}
          style={{ 
            position: 'absolute', 
            top: '16px', 
            left: '16px', 
            zIndex: 10000, 
            background: 'rgba(255,255,255,0.9)', 
            color: 'var(--color-text)', 
            border: '1px solid #ddd', 
            borderRadius: '20px', 
            padding: '8px 16px', 
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          &larr; Fechar Preview
        </button>
        <div style={{ paddingTop: '60px' }}>
          <PrincipleView 
            devotional={editForm as any}
            onBack={() => setShowPreview(false)}
          />
        </div>
      </div>
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

            const handleContentImageRemove = (field: 'content_tip_image_url' | 'support_banner_url') => {
              const oldUrl = getValue(field);
              setValue(field, '');
              if (oldUrl) {
                AdminContentService.deleteShareAssetFile(oldUrl).catch(() => {});
              }
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

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Apoio ao projeto (opcional)
                  </label>
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#888' }}>
                    Aparece por último, após a Dica de conteúdo. Use para convidar o leitor a apoiar o projeto. Pode usar só banner, só texto, ou os dois juntos — deixe ambos em branco para não exibir.
                  </p>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      🖼️ Banner opcional (imagem larga, no topo da seção)
                    </label>

                    {getValue('support_banner_url') ? (
                      <div>
                        <img
                          src={getValue('support_banner_url')}
                          alt="Prévia"
                          style={{ width: '100%', maxWidth: '320px', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd', display: 'block', marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => { setMediaPickerTarget('support_banner_url'); setMediaPickerOpen(true); }}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
                          >
                            Trocar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContentImageRemove('support_banner_url')}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setMediaPickerTarget('support_banner_url'); setMediaPickerOpen(true); }}
                        style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
                      >
                        🖼️ Selecionar da biblioteca
                      </button>
                    )}
                    {contentImageError['support_banner_url'] && (
                      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#dc2626' }}>
                        {contentImageError['support_banner_url']}
                      </p>
                    )}
                  </div>

                  <RichTextEditor 
                    key={`support_message-${currentLang}`}
                    value={getValue('support_message')}
                    onChange={(html) => setValue('support_message', html)}
                  />

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      🔗 Link do botão "Quero apoiar" (opcional)
                    </label>
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#888' }}>
                      Se preenchido, um botão "Quero apoiar" aparece no final da seção, apontando para este link.
                    </p>
                    <input
                      type="url"
                      value={getValue('support_link_url')}
                      onChange={(e) => setValue('support_link_url', e.target.value)}
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
            className="action-button-primary"
            style={{ width: '100%', padding: '16px', marginTop: '8px', fontSize: '1rem' }}
          >
            {saving ? 'Salvando...' : 'Salvar Devocional'}
          </button>
        </form>

        {/* ── WhatsApp Share Section ── */}
        {editingId !== 'new' && (
          <div style={{ marginTop: '32px', borderTop: '2px solid #eee', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '4px' }}>📤 Compartilhar no WhatsApp</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '20px' }}>
              Gera e abre o WhatsApp com o texto do devocional no idioma selecionado.
            </p>

            {languages.map(lang => {
              const lc: string = lang.iso_code;
              const preview = buildWaText(lc);
              const isActive = waPreviewLang === lc;

              return (
                <div
                  key={lc}
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{lang.flag_emoji} {lang.name}</strong>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setWaPreviewLang(isActive ? null : lc)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        {isActive ? 'Ocultar prévia' : 'Ver prévia'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(lc)}
                        style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#25D366', color: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Abrir WhatsApp
                      </button>
                    </div>
                  </div>

                  {isActive && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prévia do texto</div>
                      <div style={{ background: '#dcf8c6', borderRadius: '12px', borderBottomLeftRadius: '4px', padding: '12px 14px', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        {preview || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Salve o devocional antes de compartilhar.</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
            </div>
          ))}
          {devotionals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-light)' }}>
              Nenhum devocional encontrado.
            </div>
          )}
        </div>
      )}

      {mediaPickerOpen && mediaPickerTarget && (
        <MediaLibraryPicker
          onSelect={(url) => {
            setEditForm({ ...editForm, [mediaPickerTarget]: url });
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
