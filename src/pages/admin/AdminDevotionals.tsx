import React, { useEffect, useRef, useState } from 'react';
import { AdminContentService } from '../../services/AdminContentService';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { PrincipleView } from '../../components/PrincipleView';
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

  // Share assets state (by language)
  const [shareAssets, setShareAssets] = useState<Record<string, any>>({});
  const [shareAssetsBusy, setShareAssetsBusy] = useState<Record<string, boolean>>({});
  const [shareAssetsError, setShareAssetsError] = useState<Record<string, string>>({});
  const feedInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const storyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const whatsappInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Content image state (Dica de conteúdo / Apoio ao projeto) — keyed by field name
  const [contentImageBusy, setContentImageBusy] = useState<Record<string, boolean>>({});
  const [contentImageError, setContentImageError] = useState<Record<string, string>>({});
  const contentTipImageInputRef = useRef<HTMLInputElement | null>(null);
  const supportBannerInputRef = useRef<HTMLInputElement | null>(null);

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
      const [fullDevotional, existingAssets] = await Promise.all([
        AdminContentService.getDevotional(id),
        AdminContentService.getShareAssets(id),
      ]);
      
      // Transform fetched devotional_translations into a dictionary for the form
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

      // Build shareAssets map keyed by language_code
      const assetsMap: Record<string, any> = {};
      existingAssets.forEach((a: any) => {
        assetsMap[a.language_code] = { ...a };
      });

      setEditForm({
        ...fullDevotional,
        translations: translationsMap
      });
      setShareAssets(assetsMap);
      setShareAssetsError({});
      setShareAssetsBusy({});
      setEditingId(id);
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
    setShareAssets({});
    setShareAssetsError({});
    setShareAssetsBusy({});
    const sourceLang = languages.find(l => l.is_source)?.iso_code || 'pt-BR';
    setCurrentLang(sourceLang);
  };

  // ─── Share Asset Helpers ───────────────────────────────────────────────────

  const getAssetForLang = (langCode: string) =>
    shareAssets[langCode] || { whatsapp_text: '', feed_image_url: null, story_image_url: null };

  const setAssetField = (langCode: string, field: string, value: any) => {
    setShareAssets(prev => ({
      ...prev,
      [langCode]: { ...getAssetForLang(langCode), ...prev[langCode], [field]: value }
    }));
  };

  const setBusy = (langCode: string, busy: boolean) =>
    setShareAssetsBusy(prev => ({ ...prev, [langCode]: busy }));

  const setErr = (langCode: string, msg: string) =>
    setShareAssetsError(prev => ({ ...prev, [langCode]: msg }));

  const handleSaveWhatsappText = async (langCode: string) => {
    if (!editingId || editingId === 'new') return;
    setBusy(langCode, true);
    setErr(langCode, '');
    try {
      const asset = getAssetForLang(langCode);
      const saved = await AdminContentService.saveShareAsset({
        devotional_id: editingId,
        language_code: langCode,
        whatsapp_text: asset.whatsapp_text || null,
        whatsapp_image_url: asset.whatsapp_image_url || null,
        feed_image_url: asset.feed_image_url || null,
        story_image_url: asset.story_image_url || null,
      });
      setShareAssets(prev => ({ ...prev, [langCode]: saved }));
    } catch (err: any) {
      setErr(langCode, 'Erro ao salvar texto: ' + err.message);
    } finally {
      setBusy(langCode, false);
    }
  };

  const handleGenerateCards = async (langCode: string) => {
    if (!editingId || editingId === 'new') return;
    setBusy(langCode, true);
    setErr(langCode, '');
    try {
      const { logoBase64 } = await import('../../constants/logoBase64');
      const { captureCardAsBlob } = await import('../../utils/generateShareCards');

      const isSource = languages.find(l => l.iso_code === langCode)?.is_source;
      const translation = editForm.translations?.[langCode];
      const title = (isSource ? editForm.title : translation?.title) || editForm.title;
      const subtitle = (isSource ? editForm.principle_statement : translation?.principle_statement) || editForm.principle_statement || null;

      if (!title?.trim()) {
        setErr(langCode, 'O devocional não tem título neste idioma. Salve o conteúdo antes de gerar os cards.');
        return;
      }

      const content = { title: title.trim(), subtitle: subtitle?.trim() || null };

      const [feedBlob, storyBlob] = await Promise.all([
        captureCardAsBlob(content, 'feed', logoBase64),
        captureCardAsBlob(content, 'story', logoBase64),
      ]);

      const feedFile = new File([feedBlob], 'feed-generated.png', { type: 'image/png' });
      const storyFile = new File([storyBlob], 'story-generated.png', { type: 'image/png' });

      const [feedUrl, storyUrl] = await Promise.all([
        AdminContentService.uploadShareAsset(editingId, langCode, 'feed', feedFile),
        AdminContentService.uploadShareAsset(editingId, langCode, 'story', storyFile),
      ]);

      const currentAsset = getAssetForLang(langCode);
      const saved = await AdminContentService.saveShareAsset({
        devotional_id: editingId,
        language_code: langCode,
        whatsapp_text: currentAsset.whatsapp_text || null,
        whatsapp_image_url: currentAsset.whatsapp_image_url || null,
        feed_image_url: feedUrl,
        story_image_url: storyUrl,
      });
      setShareAssets(prev => ({ ...prev, [langCode]: saved }));
    } catch (err: any) {
      setErr(langCode, 'Erro ao gerar cards: ' + err.message);
    } finally {
      setBusy(langCode, false);
    }
  };

  const handleImageUpload = async (
    langCode: string,
    type: 'feed' | 'story' | 'whatsapp',
    file: File
  ) => {
    if (!editingId || editingId === 'new') return;

    // Pre-upload validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErr(langCode, 'Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr(langCode, 'Arquivo muito grande. Limite: 5 MB.');
      return;
    }

    setBusy(langCode, true);
    setErr(langCode, '');

    const currentAsset = getAssetForLang(langCode);
    const oldUrl: string | null = type === 'feed' ? currentAsset.feed_image_url : type === 'story' ? currentAsset.story_image_url : currentAsset.whatsapp_image_url;
    let newUrl: string | null = null;

    try {
      // 1. Upload new file
      newUrl = await AdminContentService.uploadShareAsset(editingId, langCode, type, file);

      // 2. Save to DB
      const payload = {
        devotional_id: editingId,
        language_code: langCode,
        whatsapp_text: currentAsset.whatsapp_text || null,
        whatsapp_image_url: type === 'whatsapp' ? newUrl : (currentAsset.whatsapp_image_url || null),
        feed_image_url: type === 'feed' ? newUrl : (currentAsset.feed_image_url || null),
        story_image_url: type === 'story' ? newUrl : (currentAsset.story_image_url || null),
      };
      const saved = await AdminContentService.saveShareAsset(payload);
      setShareAssets(prev => ({ ...prev, [langCode]: saved }));

      // 3. Delete old file from storage (best-effort, after DB success)
      if (oldUrl) {
        AdminContentService.deleteShareAssetFile(oldUrl).catch(() => {
          // Non-blocking: old file becomes orphan but DB is clean
        });
      }
    } catch (err: any) {
      // If DB save failed and we uploaded a new file, purge it
      if (newUrl) {
        AdminContentService.deleteShareAssetFile(newUrl).catch(() => {});
      }
      setErr(langCode, 'Erro ao enviar imagem: ' + err.message);
    } finally {
      setBusy(langCode, false);
    }
  };

  const handleImageRemove = async (langCode: string, type: 'feed' | 'story' | 'whatsapp') => {
    if (!editingId || editingId === 'new') return;
    setBusy(langCode, true);
    setErr(langCode, '');

    const currentAsset = getAssetForLang(langCode);
    const oldUrl: string | null = type === 'feed' ? currentAsset.feed_image_url : type === 'story' ? currentAsset.story_image_url : currentAsset.whatsapp_image_url;

    try {
      // 1. Remove URL from DB first
      const payload = {
        devotional_id: editingId,
        language_code: langCode,
        whatsapp_text: currentAsset.whatsapp_text || null,
        whatsapp_image_url: type === 'whatsapp' ? null : (currentAsset.whatsapp_image_url || null),
        feed_image_url: type === 'feed' ? null : (currentAsset.feed_image_url || null),
        story_image_url: type === 'story' ? null : (currentAsset.story_image_url || null),
      };
      const saved = await AdminContentService.saveShareAsset(payload);
      setShareAssets(prev => ({ ...prev, [langCode]: saved }));

      // 2. Delete from storage after DB success
      if (oldUrl) {
        AdminContentService.deleteShareAssetFile(oldUrl).catch(() => {});
      }
    } catch (err: any) {
      setErr(langCode, 'Erro ao remover imagem: ' + err.message);
    } finally {
      setBusy(langCode, false);
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

            const handleContentImageUpload = async (
              field: 'content_tip_image_url' | 'support_banner_url',
              storageField: 'content_tip_image' | 'support_banner',
              file: File
            ) => {
              if (!editingId || editingId === 'new') {
                setContentImageError(prev => ({ ...prev, [field]: 'Salve o devocional antes de enviar imagens.' }));
                return;
              }
              const allowed = ['image/jpeg', 'image/png', 'image/webp'];
              if (!allowed.includes(file.type)) {
                setContentImageError(prev => ({ ...prev, [field]: 'Formato inválido. Use JPG, PNG ou WebP.' }));
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                setContentImageError(prev => ({ ...prev, [field]: 'Arquivo muito grande. Limite: 5 MB.' }));
                return;
              }

              setContentImageBusy(prev => ({ ...prev, [field]: true }));
              setContentImageError(prev => ({ ...prev, [field]: '' }));

              const oldUrl = getValue(field);

              try {
                const newUrl = await AdminContentService.uploadContentImage(editingId, currentLang, storageField, file);
                setValue(field, newUrl);
                if (oldUrl) {
                  AdminContentService.deleteShareAssetFile(oldUrl).catch(() => {});
                }
              } catch (err: any) {
                setContentImageError(prev => ({ ...prev, [field]: 'Erro ao enviar imagem: ' + err.message }));
              } finally {
                setContentImageBusy(prev => ({ ...prev, [field]: false }));
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
                          onClick={() => handleContentImageRemove('content_tip_image_url')}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={contentTipImageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleContentImageUpload('content_tip_image_url', 'content_tip_image', file);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          disabled={!editingId || editingId === 'new' || !!contentImageBusy['content_tip_image_url']}
                          onClick={() => contentTipImageInputRef.current?.click()}
                          style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
                        >
                          {contentImageBusy['content_tip_image_url'] ? 'Enviando...' : 'Enviar imagem'}
                        </button>
                        {(!editingId || editingId === 'new') && (
                          <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: '#b45309' }}>
                            Salve o devocional primeiro para poder enviar imagens.
                          </span>
                        )}
                      </>
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
                        <button
                          type="button"
                          onClick={() => handleContentImageRemove('support_banner_url')}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={supportBannerInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleContentImageUpload('support_banner_url', 'support_banner', file);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          disabled={!editingId || editingId === 'new' || !!contentImageBusy['support_banner_url']}
                          onClick={() => supportBannerInputRef.current?.click()}
                          style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fafafa', cursor: 'pointer' }}
                        >
                          {contentImageBusy['support_banner_url'] ? 'Enviando...' : 'Enviar banner'}
                        </button>
                        {(!editingId || editingId === 'new') && (
                          <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: '#b45309' }}>
                            Salve o devocional primeiro para poder enviar imagens.
                          </span>
                        )}
                      </>
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

        {/* ── Share Assets Section (only for saved devotionals) ── */}
        {editingId !== 'new' && (
          <div style={{ marginTop: '32px', borderTop: '2px solid #eee', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '4px' }}>📤 Compartilhamento</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '20px' }}>
              Materiais editoriais de distribuição por idioma. O texto do WhatsApp deve conter o placeholder <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '4px' }}>{'{{link}}'}</code> para o link de indicação.
            </p>

            {languages.map(lang => {
              const lc: string = lang.iso_code;
              const asset = getAssetForLang(lc);
              const busy = shareAssetsBusy[lc] || false;
              const errMsg = shareAssetsError[lc] || '';
              const hasLink = (asset.whatsapp_text || '').includes('{{link}}');
              const waText = asset.whatsapp_text || '';
              
              const hasWaText = !!waText.trim();
              const hasWaImage = !!asset.whatsapp_image_url;
              const hasFeed = !!asset.feed_image_url;
              const hasStory = !!asset.story_image_url;

              return (
                <div
                  key={lc}
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {/* Detailed Header Status */}
                  <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '8px' }}>{lang.name} ({lc})</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: '#4b5563' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>WhatsApp</strong>
                        <div>{hasWaText ? '🟢' : '🔴'} Texto</div>
                        <div>{hasWaImage ? '🟢 Imagem' : hasFeed ? '🟡 Imagem usando Feed' : '🔴 Sem imagem'}</div>
                      </div>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>Instagram</strong>
                        <div>{hasFeed ? '🟢' : '🔴'} Feed</div>
                        <div>{hasStory ? '🟢' : '🔴'} Story</div>
                      </div>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>Facebook</strong>
                        <div>{hasFeed ? '🟢 Feed disponível' : '🔴 Indisponível'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Generate Cards Button */}
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleGenerateCards(lc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: '1.5px solid #c8924a',
                        background: busy ? '#f9f5f0' : '#fdf8f2',
                        color: '#9a6e30',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy ? 0.6 : 1,
                        transition: 'background 0.15s',
                        whiteSpace: 'normal',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      title="Gera automaticamente os cards de Feed (1:1) e Story (9:16) com o design da marca"
                    >
                      <span aria-hidden="true">✨</span>
                      {busy ? 'Gerando cards…' : 'Gerar Cards Automaticamente'}
                    </button>
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                      Gera Feed (1080×1080) e Story (1080×1920) com título e princípio do devocional.
                    </p>
                  </div>

                  {errMsg && (
                    <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem', marginBottom: '12px' }}>
                      {errMsg}
                    </div>
                  )}

                  {/* WhatsApp text */}
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Texto WhatsApp</label>
                  <textarea
                    value={waText}
                    onChange={e => setAssetField(lc, 'whatsapp_text', e.target.value)}
                    rows={4}
                    placeholder={`Texto para compartilhar... Use {{link}} para inserir o link de indicação.`}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${!hasLink && waText ? '#f59e0b' : '#ddd'}`, resize: 'vertical', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                  {waText && !hasLink && (
                    <div style={{ fontSize: '0.78rem', color: '#d97706', marginBottom: '4px' }}>⚠️ O texto não contém o placeholder <code>{'{{link}}'}</code>. O link de indicação não será inserido.</div>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSaveWhatsappText(lc)}
                    style={{ marginTop: '6px', padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
                  >
                    {busy ? 'Salvando…' : 'Salvar Texto'}
                  </button>

                  {/* WhatsApp Preview */}
                  {waText && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pré-visualização WhatsApp</div>
                      <div style={{ background: '#dcf8c6', borderRadius: '12px', borderBottomLeftRadius: '4px', padding: '10px 14px', fontSize: '0.875rem', lineHeight: '1.5', maxWidth: '340px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        {waText.replace('{{link}}', '🔗 https://3minutosparaavida.com/c/SEU_CODIGO')}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    {(['whatsapp', 'feed', 'story'] as const).map(type => {
                      const url: string | null = type === 'whatsapp' ? asset.whatsapp_image_url : type === 'feed' ? asset.feed_image_url : asset.story_image_url;
                      const label = type === 'whatsapp' ? '💬 WhatsApp Opcional' : type === 'feed' ? '📸 Feed / Facebook' : '📱 Story';
                      const ratio = type === 'story' ? '9/16' : '1/1';
                      const inputRef = type === 'whatsapp' ? whatsappInputRefs : type === 'feed' ? feedInputRefs : storyInputRefs;
                      
                      // For whatsapp image, if it doesn't exist but feed exists, show a placeholder indication
                      const isFallbackWa = type === 'whatsapp' && !url && hasFeed;

                      return (
                        <div key={type}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px' }}>{label}</div>
                          {url ? (
                            <div style={{ position: 'relative' }}>
                              <img
                                src={url}
                                alt={`${type} ${lc}`}
                                style={{ width: '100%', borderRadius: '8px', aspectRatio: ratio, objectFit: 'cover', border: '1px solid #e5e7eb' }}
                              />
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => inputRef.current[lc]?.click()}
                                  style={{ flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', fontSize: '0.78rem', cursor: 'pointer' }}
                                >
                                  Subst
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => { if (window.confirm('Remover esta imagem?')) handleImageRemove(lc, type); }}
                                  style={{ flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '0.78rem', cursor: 'pointer' }}
                                >
                                  Remov
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => !busy && inputRef.current[lc]?.click()}
                              style={{ border: '2px dashed #d1d5db', borderRadius: '8px', aspectRatio: ratio, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: busy ? 'not-allowed' : 'pointer', background: isFallbackWa ? '#fef3c7' : '#f9fafb', color: isFallbackWa ? '#d97706' : '#9ca3af', fontSize: '0.75rem', textAlign: 'center', padding: '8px' }}
                            >
                              <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{isFallbackWa ? '👁️' : '+'}</span>
                              {isFallbackWa ? 'Usando imagem do Feed' : 'Adicionar imagem'}
                            </div>
                          )}
                          <input
                            ref={el => { inputRef.current[lc] = el; }}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(lc, type, file);
                              e.target.value = '';
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
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
    </div>
  );
}
