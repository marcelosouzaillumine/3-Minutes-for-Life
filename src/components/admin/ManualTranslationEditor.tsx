import React, { useState } from 'react';
import { AdminContentService } from '../../services/AdminContentService';
import { RichTextEditor } from './RichTextEditor';
import { PrincipleView } from '../PrincipleView';
import { HtmlRenderer } from '../HtmlRenderer';

interface ManualTranslationEditorProps {
  devotional: any;
  language: {
    iso_code: string;
    name: string;
    native_name: string;
    flag_emoji: string;
  };
  onBack: () => void;
  onSaved: () => void;
}

export const ManualTranslationEditor: React.FC<ManualTranslationEditorProps> = ({
  devotional,
  language,
  onBack,
  onSaved
}) => {
  // Pre-fill initial form state: prioritizes existing manual translation, then AI translation as base, else empty
  const initialSource = devotional.manualTranslation || devotional.aiTranslation || {};

  const [form, setForm] = useState({
    title: initialSource.title || '',
    principle_statement: initialSource.principle_statement || '',
    scripture_reference: initialSource.scripture_reference || '',
    scripture_text: initialSource.scripture_text || '',
    reflection: initialSource.reflection || '',
    practical_application: initialSource.practical_application || '',
    prayer: initialSource.prayer || '',
  });

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSaveDraft = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      setSaving(true);

      await AdminContentService.saveManualTranslation({
        devotional_id: devotional.id,
        language: language.iso_code,
        title: form.title,
        principle_statement: form.principle_statement || null,
        scripture_reference: form.scripture_reference || null,
        scripture_text: form.scripture_text || null,
        reflection: form.reflection,
        practical_application: form.practical_application || null,
        prayer: form.prayer || null,
        status: 'draft'
      });

      setSuccessMessage('Rascunho salvo com sucesso!');
      setTimeout(() => {
        onSaved();
      }, 800);
    } catch (err: any) {
      setErrorMessage('Erro ao salvar rascunho: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      setPublishing(true);

      // Validate required fields
      if (!form.title.trim()) {
        throw new Error('O título é obrigatório para publicar.');
      }
      if (!form.principle_statement.trim()) {
        throw new Error('O destaque / principle statement é obrigatório para publicar.');
      }
      if (!form.reflection.trim()) {
        throw new Error('A reflexão é obrigatória para publicar.');
      }

      await AdminContentService.saveManualTranslation({
        devotional_id: devotional.id,
        language: language.iso_code,
        title: form.title,
        principle_statement: form.principle_statement,
        scripture_reference: form.scripture_reference || null,
        scripture_text: form.scripture_text || null,
        reflection: form.reflection,
        practical_application: form.practical_application || null,
        prayer: form.prayer || null,
        status: 'published'
      });

      setSuccessMessage('Tradução manual publicada com sucesso!');
      setTimeout(() => {
        onSaved();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Construct devotional preview object
  const previewDevotional = {
    ...devotional,
    title: form.title || devotional.title,
    principle_statement: form.principle_statement || devotional.principle_statement,
    scripture_reference: form.scripture_reference !== '' ? form.scripture_reference : devotional.scripture_reference,
    scripture_text: form.scripture_text !== '' ? form.scripture_text : devotional.scripture_text,
    reflection: form.reflection || devotional.reflection,
    practical_application: form.practical_application || devotional.practical_application,
    prayer: form.prayer || devotional.prayer,
    resolvedLanguage: language.iso_code,
    translationStatus: 'available'
  };

  if (showPreview) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'white',
        zIndex: 9999,
        overflowY: 'auto'
      }}>
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          zIndex: 10000
        }}>
          <button
            onClick={() => setShowPreview(false)}
            style={{
              background: 'none',
              border: '1px solid #ddd',
              borderRadius: '20px',
              padding: '6px 16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: 'var(--color-text)'
            }}
          >
            &larr; Fechar Preview
          </button>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
            Preview: {language.flag_emoji} {language.name}
          </span>
        </div>

        <div style={{ padding: '20px 0 60px' }}>
          <PrincipleView
            devotional={previewDevotional as any}
            onBack={() => setShowPreview(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#c46d53',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.95rem'
          }}
        >
          &larr; Voltar para a Lista
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            style={{
              background: '#ffffff',
              color: '#1a1a1a',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '8px 14px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            👁️ Preview
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || publishing}
            style={{
              background: '#c46d53',
              color: '#ffffff',
              border: '1px solid #c46d53',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {publishing ? 'Publicando...' : 'Publicar Tradução'}
          </button>
        </div>
      </div>

      {/* Title and metadata */}
      <div style={{
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>
            {devotional.title}
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#666666', display: 'flex', gap: '12px' }}>
            <span>DEVOCIONAL #{devotional.legacy_id || devotional.id.slice(0, 8)}</span>
            <span>📅 {devotional.publication_date}</span>
            {devotional.categories?.name && <span>🏷️ {devotional.categories.name}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#666666' }}>Destino:</span>
          <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {language.flag_emoji} {language.name}
          </span>
          {devotional.manualTranslation?.status === 'published' && (
            <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              ✓ Manual Publicado
            </span>
          )}
          {devotional.manualTranslation?.status === 'draft' && (
            <span style={{ background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              📝 Rascunho Manual
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #fecaca',
          fontSize: '0.9rem'
        }}>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '12px 16px',
          background: '#ecfdf5',
          color: '#059669',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #a7f3d0',
          fontSize: '0.9rem'
        }}>
          {successMessage}
        </div>
      )}

      {/* Side-by-side or stacked Editor Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: ORIGINAL PT-BR */}
        <div style={{
          background: '#f8fafc',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingBottom: '12px',
            borderBottom: '2px solid #cbd5e1'
          }}>
            <span>🇧🇷</span>
            <strong style={{ fontSize: '0.95rem', color: '#334155' }}>PORTUGUÊS — ORIGINAL</strong>
          </div>

          {/* 1. Título */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
              Título
            </label>
            <div style={{
              background: 'white',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              {devotional.title}
            </div>
          </div>

          {/* 2. Destaque / Principle Statement */}
          {devotional.principle_statement && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                Destaque / Principle Statement
              </label>
              <div style={{
                background: 'white',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                fontStyle: 'italic'
              }}>
                {devotional.principle_statement}
              </div>
            </div>
          )}

          {/* 3. Referência Bíblica */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
              Referência Bíblica
            </label>
            <div style={{
              background: 'white',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
              fontWeight: 500
            }}>
              {devotional.scripture_reference || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Não informada</span>}
            </div>
          </div>

          {/* 4. Texto Bíblico */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
              Texto Bíblico
            </label>
            <div style={{
              background: 'white',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
              fontSize: '0.9rem',
              lineHeight: 1.5
            }}>
              {devotional.scripture_text ? `"${devotional.scripture_text}"` : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Não informado</span>}
            </div>
          </div>

          {/* 5. Reflexão */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
              Reflexão
            </label>
            <div 
              style={{
                background: 'white',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              <HtmlRenderer html={devotional.reflection || ''} />
            </div>
          </div>

          {/* 6. Aplicação Prática */}
          {devotional.practical_application && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                Aplicação Prática
              </label>
              <div 
                style={{
                  background: 'white',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  color: '#1e293b',
                  fontSize: '0.95rem',
                  lineHeight: 1.6
                }}
              >
                <HtmlRenderer html={devotional.practical_application || ''} />
              </div>
            </div>
          )}

          {/* 7. Oração */}
          {devotional.prayer && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                Oração
              </label>
              <div 
                style={{
                  background: 'white',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  color: '#1e293b',
                  fontSize: '0.95rem',
                  lineHeight: 1.6
                }}
              >
                <HtmlRenderer html={devotional.prayer || ''} />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TARGET LANGUAGE EDITABLE TRANSLATION */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingBottom: '12px',
            borderBottom: '2px solid #c46d53'
          }}>
            <span>{language.flag_emoji}</span>
            <strong style={{ fontSize: '0.95rem', color: '#1a1a1a' }}>
              {language.name.toUpperCase()} — TRADUÇÃO MANUAL
            </strong>
          </div>

          {/* 1. Título */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={`Título em ${language.name}...`}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '0.95rem',
                color: '#1a1a1a'
              }}
            />
          </div>

          {/* 2. Destaque / Principle Statement */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              Destaque / Principle Statement *
            </label>
            <textarea
              value={form.principle_statement}
              onChange={(e) => setForm({ ...form, principle_statement: e.target.value })}
              rows={3}
              placeholder={`Frase curta de destaque em ${language.name}...`}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '0.95rem',
                color: '#1a1a1a',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 3. Referência Bíblica */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              Referência Bíblica
            </label>
            <input
              type="text"
              value={form.scripture_reference}
              onChange={(e) => setForm({ ...form, scripture_reference: e.target.value })}
              placeholder={`Ex: ${language.iso_code === 'en' ? 'Philippians 4:6-7' : 'Filipenses 4:6-7'}`}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '0.95rem',
                color: '#1a1a1a'
              }}
            />
          </div>

          {/* 4. Texto Bíblico */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              Texto Bíblico
            </label>
            <textarea
              value={form.scripture_text}
              onChange={(e) => setForm({ ...form, scripture_text: e.target.value })}
              rows={3}
              placeholder={`Texto bíblico no idioma ${language.name}...`}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '0.95rem',
                color: '#1a1a1a',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 5. Reflexão */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              Reflexão *
            </label>
            <RichTextEditor
              key={`manual-reflection-${language.iso_code}-${devotional.id}`}
              value={form.reflection}
              onChange={(html) => setForm(f => ({ ...f, reflection: html }))}
            />
          </div>

          {/* 6. Aplicação Prática */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              Aplicação Prática
            </label>
            <RichTextEditor
              key={`manual-practical-${language.iso_code}-${devotional.id}`}
              value={form.practical_application}
              onChange={(html) => setForm(f => ({ ...f, practical_application: html }))}
            />
          </div>

          {/* 7. Oração */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              Oração
            </label>
            <RichTextEditor
              key={`manual-prayer-${language.iso_code}-${devotional.id}`}
              value={form.prayer}
              onChange={(html) => setForm(f => ({ ...f, prayer: html }))}
            />
          </div>

          {/* Bottom actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || publishing}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={saving || publishing}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #c46d53',
                background: '#c46d53',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              {publishing ? 'Publicando...' : 'Publicar Tradução'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
