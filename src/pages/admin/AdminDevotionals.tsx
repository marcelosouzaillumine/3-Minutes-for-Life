import React, { useEffect, useState } from 'react';
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
      const fullDevotional = await AdminContentService.getDevotional(id);
      
      // Transform fetched devotional_translations into a dictionary for the form
      const translationsMap: Record<string, any> = {};
      if (fullDevotional.devotional_translations) {
        fullDevotional.devotional_translations.forEach((t: any) => {
          if (t.language !== 'pt-BR') {
            translationsMap[t.language] = {
              title: t.title,
              subtitle: t.subtitle,
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


      setEditForm({
        ...fullDevotional,
        translations: translationsMap
      });
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
        initialTranslations[lang.iso_code] = { title: '', subtitle: '', principle_statement: '', reflection: '', practical_application: '', prayer: '' };
      }
    });

    setEditForm({
      title: '',
      subtitle: '',
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
    const sourceLang = languages.find(l => l.is_source)?.iso_code || 'pt-BR';
    setCurrentLang(sourceLang);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    // Remove empty optional fields that shouldn't be empty strings in db
    const payload = { ...editForm };
    if (!payload.category_id) payload.category_id = null;
    if (!payload.subtitle) payload.subtitle = null;
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
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>Subtítulo</label>
                  <input 
                    type="text" 
                    value={getValue('subtitle')}
                    onChange={(e) => setValue('subtitle', e.target.value)}
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
