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

  // States for Category Management
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

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
        initialTranslations[lang.iso_code] = { title: '', principle_statement: '', reflection: '', practical_application: '', prayer: '' };
      }
    });

    setEditForm({
      title: '',
      principle_statement: '',
      reflection: '',
      practical_application: '',
      prayer: '',
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
      await AdminContentService.createCategory(newCategoryName);
      setNewCategoryName('');
      const cats = await AdminContentService.getCategories();
      setCategories(cats);
    } catch (err: any) {
      alert('Erro ao criar categoria: ' + err.message);
    } finally {
      setSavingCategory(false);
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
              {cat.name}
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
                {getStatusBadge(devo.status || 'published')}
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
