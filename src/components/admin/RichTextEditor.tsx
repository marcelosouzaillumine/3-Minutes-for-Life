import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { CtaNode, type CtaNodeAttrs } from './tiptap/CtaNode';

// ─── CTA Modal ────────────────────────────────────────────────────────────────

interface CtaModalProps {
  initial: CtaNodeAttrs;
  onSave: (attrs: CtaNodeAttrs) => void;
  onCancel: () => void;
}

function CtaModal({ initial, onSave, onCancel }: CtaModalProps) {
  const [form, setForm] = useState<CtaNodeAttrs>(initial);

  const set = (key: keyof CtaNodeAttrs, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label) {
      alert('O campo Texto do Botão é obrigatório.');
      return;
    }
    if (!form.url && !form.action) {
      alert('Informe uma URL ou uma ação interna para o botão.');
      return;
    }
    onSave(form);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '0.9rem', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '4px',
    fontSize: '0.82rem', fontWeight: 600, color: '#444',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        padding: '2rem', width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
          {initial.label ? 'Editar CTA Editorial' : 'Inserir CTA Editorial'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Título <span style={{ fontWeight: 400, color: '#aaa' }}>(opcional)</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex: Quer aprofundar esse tema?"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Descrição <span style={{ fontWeight: 400, color: '#aaa' }}>(opcional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Ex: Leia o guia completo sobre apostas."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Label (required) */}
          <div>
            <label style={labelStyle}>Texto do Botão <span style={{ color: '#c46d53' }}>*</span></label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder="Ex: Saiba mais"
              required
              style={inputStyle}
            />
          </div>

          {/* URL or Action — mutually exclusive */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#666' }}>
              Escolha <strong>URL</strong> <em>ou</em> <strong>Ação interna</strong> — um dos dois é obrigatório.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>URL (link externo ou rota interna)</label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => set('url', e.target.value)}
                  placeholder="https://... ou /rota-interna"
                  style={{ ...inputStyle, opacity: form.action ? 0.5 : 1 }}
                  disabled={!!form.action}
                />
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#aaa' }}>— ou —</div>

              <div>
                <label style={labelStyle}>Ação interna</label>
                <select
                  value={form.action}
                  onChange={(e) => set('action', e.target.value)}
                  style={{ ...inputStyle, opacity: form.url ? 0.5 : 1 }}
                  disabled={!!form.url}
                >
                  <option value="">Selecione uma ação...</option>
                  <option value="share">Compartilhar devocional</option>
                  <option value="save">Salvar devocional</option>
                  <option value="login">Fazer login</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '8px',
                border: '1px solid #ddd', background: 'transparent',
                color: '#666', cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.4rem', borderRadius: '8px',
                border: 'none', background: '#c46d53',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              Salvar CTA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Empty CTA defaults ───────────────────────────────────────────────────────

const EMPTY_CTA: CtaNodeAttrs = {
  title: '', description: '', label: '', url: '', action: '',
};

// ─── Editor Component ─────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [ctaModal, setCtaModal] = useState<{
    attrs: CtaNodeAttrs;
    updateAttributes?: (attrs: Partial<CtaNodeAttrs>) => void;
    deleteNode?: () => void;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      CtaNode,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        style: 'min-height: 200px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; border-top-left-radius: 0; border-top-right-radius: 0; background: white; outline: none;',
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Listen for the cta:edit event dispatched from CtaNodeView
  useEffect(() => {
    const handler = (e: Event) => {
      const { attrs, updateAttributes, deleteNode } = (e as CustomEvent).detail;
      setCtaModal({ attrs, updateAttributes, deleteNode });
    };
    document.addEventListener('cta:edit', handler);
    return () => document.removeEventListener('cta:edit', handler);
  }, []);

  if (!editor) return null;

  // ── Toolbar handlers ──

  const toggleBold      = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); };
  const toggleItalic    = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); };
  const toggleUnderline = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); };
  const toggleH2        = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); };
  const toggleH3        = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); };
  const toggleQuote     = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); };
  const toggleUl        = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); };
  const toggleOl        = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); };

  const insertCta = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtaModal({ attrs: { ...EMPTY_CTA } });
  };

  const handleCtaSave = (attrs: CtaNodeAttrs) => {
    if (ctaModal?.updateAttributes) {
      // Editing existing CTA node
      ctaModal.updateAttributes(attrs);
    } else {
      // Inserting new CTA node
      editor.chain().focus().insertContent({
        type: 'cta',
        attrs,
      }).run();
    }
    setCtaModal(null);
    onChange(editor.getHTML());
  };

  // ── Styles ──

  const activeStyle: React.CSSProperties  = { background: '#c46d53', color: 'white', border: 'none' };
  const inactiveStyle: React.CSSProperties = { background: '#f5f5f5', color: '#333', border: '1px solid #ddd' };
  const btnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 10px', fontSize: '0.85rem', fontWeight: 'bold',
    borderRadius: '4px', cursor: 'pointer',
    ...(isActive ? activeStyle : inactiveStyle),
  });
  const ctaBtnStyle: React.CSSProperties = {
    padding: '6px 12px', fontSize: '0.82rem', fontWeight: 700,
    borderRadius: '4px', cursor: 'pointer',
    background: '#fdf7f5', color: '#c46d53',
    border: '1px solid #c46d53',
  };

  return (
    <>
      <div className="rich-text-editor-container" style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          className="editor-toolbar"
          style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px',
            background: '#f5f5f5', border: '1px solid #ddd', borderBottom: 'none',
            borderTopLeftRadius: '8px', borderTopRightRadius: '8px',
          }}
        >
          <button type="button" onClick={toggleBold}      style={btnStyle(editor.isActive('bold'))}>B</button>
          <button type="button" onClick={toggleItalic}    style={btnStyle(editor.isActive('italic'))}>I</button>
          <button type="button" onClick={toggleUnderline} style={btnStyle(editor.isActive('underline'))}>U</button>
          <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
          <button type="button" onClick={toggleH2}        style={btnStyle(editor.isActive('heading', { level: 2 }))}>H2</button>
          <button type="button" onClick={toggleH3}        style={btnStyle(editor.isActive('heading', { level: 3 }))}>H3</button>
          <button type="button" onClick={toggleQuote}     style={btnStyle(editor.isActive('blockquote'))}>&ldquo;&rdquo;</button>
          <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
          <button type="button" onClick={toggleUl}        style={btnStyle(editor.isActive('bulletList'))}>UL</button>
          <button type="button" onClick={toggleOl}        style={btnStyle(editor.isActive('orderedList'))}>OL</button>
          <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
          {/* CTA button */}
          <button type="button" onClick={insertCta} style={ctaBtnStyle} title="Inserir CTA editorial">
            + CTA
          </button>
        </div>

        <EditorContent editor={editor} />
      </div>

      {/* CTA Modal — rendered outside the editor */}
      {ctaModal && (
        <CtaModal
          initial={ctaModal.attrs}
          onSave={handleCtaSave}
          onCancel={() => setCtaModal(null)}
        />
      )}
    </>
  );
}
