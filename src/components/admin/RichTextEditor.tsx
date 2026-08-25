import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  CtaNode,
  type CtaNodeAttrs,
} from './tiptap/CtaNode';

// ─────────────────────────────────────────────────────────────────────────────
// CTA MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface CtaModalProps {
  initial: CtaNodeAttrs;
  onSave: (attrs: CtaNodeAttrs) => void;
  onCancel: () => void;
}

function CtaModal({
  initial,
  onSave,
  onCancel,
}: CtaModalProps) {
  const [form, setForm] =
    useState<CtaNodeAttrs>({
      title: initial.title ?? '',
      description: initial.description ?? '',
      label: initial.label ?? '',
      url: initial.url ?? '',
      action: initial.action ?? '',
    });

  const set = (
    key: keyof CtaNodeAttrs,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const normalized: CtaNodeAttrs = {
      title: form.title.trim(),
      description: form.description.trim(),
      label: form.label.trim(),
      url: form.url.trim(),
      action: form.action.trim(),
    };

    if (!normalized.label) {
      alert(
        'O campo Texto do Botão é obrigatório.'
      );
      return;
    }

    if (!normalized.url && !normalized.action) {
      alert(
        'Informe uma URL ou uma ação interna para o botão.'
      );
      return;
    }

    if (normalized.url) {
      normalized.action = '';
    }

    if (normalized.action) {
      normalized.url = '';
    }

    onSave(normalized);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minWidth: 0,
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d7d7d7',
    fontSize: '0.9rem',
    lineHeight: 1.4,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: '#fff',
    color: '#222',
    outline: 'none',
    appearance: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontSize: '0.82rem',
    lineHeight: 1.4,
    fontWeight: 600,
    color: '#444',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cta-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,

        width: '100%',
        height: '100%',
        minHeight: '100dvh',

        background:
          'rgba(0, 0, 0, 0.45)',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        padding: '16px',

        boxSizing: 'border-box',

        overflowY: 'auto',
        overflowX: 'hidden',

        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        style={{
          position: 'relative',
          zIndex: 100000,

          background: '#fff',

          width: '100%',
          maxWidth: '480px',

          maxHeight:
            'calc(100dvh - 32px)',

          minHeight: 0,

          borderRadius: '16px',

          padding: '2rem',

          boxSizing: 'border-box',

          overflowY: 'auto',
          overflowX: 'hidden',

          WebkitOverflowScrolling: 'touch',

          boxShadow:
            '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <h3
          id="cta-modal-title"
          style={{
            margin: '0 0 1.5rem',
            fontSize: '1.1rem',
            lineHeight: 1.3,
            fontWeight: 700,
            color: '#1a1a1a',
          }}
        >
          {initial.label
            ? 'Editar CTA Editorial'
            : 'Inserir CTA Editorial'}
        </h3>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            minWidth: 0,
          }}
        >
          {/* TÍTULO */}

          <div>
            <label style={labelStyle}>
              Título{' '}
              <span
                style={{
                  fontWeight: 400,
                  color: '#aaa',
                }}
              >
                (opcional)
              </span>
            </label>

            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                set(
                  'title',
                  e.target.value
                )
              }
              placeholder="Ex: Quer aprofundar esse tema?"
              style={inputStyle}
            />
          </div>

          {/* DESCRIÇÃO */}

          <div>
            <label style={labelStyle}>
              Descrição{' '}
              <span
                style={{
                  fontWeight: 400,
                  color: '#aaa',
                }}
              >
                (opcional)
              </span>
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                set(
                  'description',
                  e.target.value
                )
              }
              placeholder="Ex: Leia o guia completo sobre apostas."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '72px',
                appearance: 'auto',
              }}
            />
          </div>

          {/* TEXTO DO BOTÃO */}

          <div>
            <label style={labelStyle}>
              Texto do Botão{' '}
              <span
                style={{
                  color: '#c46d53',
                }}
              >
                *
              </span>
            </label>

            <input
              type="text"
              value={form.label}
              onChange={(e) =>
                set(
                  'label',
                  e.target.value
                )
              }
              placeholder="Ex: Saiba mais"
              required
              style={inputStyle}
            />
          </div>

          {/* URL / AÇÃO */}

          <div
            style={{
              borderTop:
                '1px solid #eee',
              paddingTop: '1rem',
            }}
          >
            <p
              style={{
                margin:
                  '0 0 0.75rem',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                color: '#666',
              }}
            >
              Escolha{' '}
              <strong>URL</strong>{' '}
              <em>ou</em>{' '}
              <strong>Ação interna</strong>{' '}
              — um dos dois é obrigatório.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                minWidth: 0,
              }}
            >
              {/* URL */}

              <div>
                <label style={labelStyle}>
                  URL (link externo ou
                  rota interna)
                </label>

                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      url: value,
                      action: value
                        ? ''
                        : prev.action,
                    }));
                  }}
                  placeholder="https://... ou /rota-interna"
                  style={{
                    ...inputStyle,
                    opacity:
                      form.action ? 0.5 : 1,
                  }}
                  disabled={!!form.action}
                />
              </div>

              {/* DIVISOR */}

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: '#aaa',
                  padding: '2px 0',
                }}
              >
                — ou —
              </div>

              {/* AÇÃO INTERNA */}

              <div>
                <label style={labelStyle}>
                  Ação interna
                </label>

                <select
                  value={form.action}
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      action: value,
                      url: value
                        ? ''
                        : prev.url,
                    }));
                  }}
                  style={{
                    ...inputStyle,
                    opacity:
                      form.url ? 0.5 : 1,
                    appearance: 'auto',
                  }}
                  disabled={!!form.url}
                >
                  <option value="">
                    Selecione uma ação...
                  </option>

                  <option value="share">
                    Compartilhar devocional
                  </option>

                  <option value="save">
                    Salvar devocional
                  </option>

                  <option value="login">
                    Fazer login
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* BOTÕES DO MODAL */}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',

                padding:
                  '0.6rem 1.2rem',

                minHeight: '40px',

                borderRadius: '8px',
                border:
                  '1px solid #d5d5d5',

                background: '#fff',
                color: '#555',

                cursor: 'pointer',

                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'inherit',

                appearance: 'none',
                WebkitAppearance: 'none',

                visibility: 'visible',
                opacity: 1,

                boxSizing: 'border-box',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',

                padding:
                  '0.6rem 1.4rem',

                minHeight: '40px',

                borderRadius: '8px',
                border:
                  '1px solid #c46d53',

                background: '#c46d53',
                color: '#fff',

                cursor: 'pointer',

                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: 'inherit',

                appearance: 'none',
                WebkitAppearance: 'none',

                visibility: 'visible',
                opacity: 1,

                boxSizing: 'border-box',
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

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY CTA
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_CTA: CtaNodeAttrs = {
  title: '',
  description: '',
  label: '',
  url: '',
  action: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR
// ─────────────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const [ctaModal, setCtaModal] =
    useState<{
      attrs: CtaNodeAttrs;
      updateAttributes?: (
        attrs: Partial<CtaNodeAttrs>
      ) => void;
      deleteNode?: () => void;
    } | null>(null);

  // ─────────────────────────────────────────────
  // TIPTAP
  // ─────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),

      Underline,

      CtaNode,
    ],

    content: value || '<p></p>',

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class:
          'tiptap-editor-content',
      },

      handleDOMEvents: {
        mousedown: (_view, event) => {
          const target =
            event.target as HTMLElement;

          /*
           * Mantém o comportamento normal
           * do editor, mas impede que cliques
           * em elementos internos causem efeitos
           * inesperados.
           */
          if (
            target.closest(
              '.editor-toolbar'
            )
          ) {
            return true;
          }

          return false;
        },
      },
    },
  });

  // ─────────────────────────────────────────────
  // SYNC EXTERNAL VALUE
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current =
      editor.getHTML();

    const next =
      value || '<p></p>';

    if (next !== current) {
      /*
       * IMPORTANTE:
       *
       * Tiptap atual não aceita mais:
       *
       * setContent(value, false)
       *
       * O segundo parâmetro precisa ser
       * um objeto de opções.
       *
       * Para evitar problemas de tipagem
       * e disparo desnecessário do onUpdate,
       * usamos:
       *
       * emitUpdate: false
       */
      editor.commands.setContent(
        next,
        {
          emitUpdate: false,
        }
      );
    }
  }, [value, editor]);

  // ─────────────────────────────────────────────
  // CTA EVENT
  // ─────────────────────────────────────────────

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent =
        event as CustomEvent<{
          attrs: CtaNodeAttrs;
          updateAttributes?: (
            attrs: Partial<CtaNodeAttrs>
          ) => void;
          deleteNode?: () => void;
        }>;

      const detail =
        customEvent.detail;

      if (!detail) {
        return;
      }

      setCtaModal({
        attrs: {
          ...EMPTY_CTA,
          ...(detail.attrs || {}),
        },
        updateAttributes:
          detail.updateAttributes,
        deleteNode:
          detail.deleteNode,
      });
    };

    document.addEventListener(
      'cta:edit',
      handler
    );

    return () => {
      document.removeEventListener(
        'cta:edit',
        handler
      );
    };
  }, []);

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  if (!editor) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '260px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border:
            '1px solid #ddd',
          borderRadius: '8px',
          background: '#fff',
          color: '#777',
          fontSize: '0.9rem',
        }}
      >
        Carregando editor...
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // TOOLBAR HANDLERS
  // ─────────────────────────────────────────────

  const toggleBold = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    editor
      .chain()
      .focus()
      .toggleBold()
      .run();
  };

  const toggleItalic = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    editor
      .chain()
      .focus()
      .toggleItalic()
      .run();
  };

  const toggleUnderline = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    editor
      .chain()
      .focus()
      .toggleUnderline()
      .run();
  };

  const toggleH2 = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    editor
      .chain()
      .focus()
      .toggleHeading({
        level: 2,
      })
      .run();
  };

  const toggleH3 = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    editor
      .chain()
      .focus()
      .toggleHeading({
        level: 3,
      })
      .run();
  };

  const toggleQuote = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    editor
      .chain()
      .focus()
      .toggleBlockquote()
      .run();
  };

  const toggleUl = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    editor
      .chain()
      .focus()
      .toggleBulletList()
      .run();
  };

  const toggleOl = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    editor
      .chain()
      .focus()
      .toggleOrderedList()
      .run();
  };

  // ─────────────────────────────────────────────
  // INSERT CTA
  // ─────────────────────────────────────────────

  const insertCta = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setCtaModal({
      attrs: {
        ...EMPTY_CTA,
      },
    });
  };

  // ─────────────────────────────────────────────
  // SAVE CTA
  // ─────────────────────────────────────────────

  const handleCtaSave = (
    attrs: CtaNodeAttrs
  ) => {
    if (
      ctaModal?.updateAttributes
    ) {
      ctaModal.updateAttributes(
        attrs
      );
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'cta',
          attrs,
        })
        .run();
    }

    setCtaModal(null);

    /*
     * getHTML depois da operação
     * garante que o pai receba o CTA
     * já inserido no documento.
     */
    onChange(editor.getHTML());
  };

  // ─────────────────────────────────────────────
  // BUTTON STYLES
  // ─────────────────────────────────────────────

  const toolbarButtonStyle = (
    isActive: boolean
  ): React.CSSProperties => ({
    display: 'inline-flex',

    alignItems: 'center',
    justifyContent: 'center',

    flex: '0 0 auto',

    minWidth: '34px',
    minHeight: '32px',

    padding:
      '6px 10px',

    margin: 0,

    fontFamily:
      'Arial, Helvetica, sans-serif',

    fontSize: '13px',
    lineHeight: 1,

    fontWeight: 700,

    borderRadius: '5px',

    cursor: 'pointer',

    boxSizing: 'border-box',

    appearance: 'none',
    WebkitAppearance: 'none',

    /*
     * IMPORTANTE:
     * essas propriedades impedem que regras
     * globais do projeto escondam os botões.
     */
    visibility: 'visible',
    opacity: 1,

    position: 'relative',
    zIndex: 2,

    background: isActive
      ? '#c46d53'
      : '#ffffff',

    color: isActive
      ? '#ffffff'
      : '#333333',

    border: isActive
      ? '1px solid #c46d53'
      : '1px solid #d2d2d2',

    boxShadow:
      '0 1px 2px rgba(0,0,0,0.08)',

    whiteSpace: 'nowrap',
  });

  const separatorStyle:
    React.CSSProperties = {
    display: 'block',

    flex: '0 0 1px',

    width: '1px',

    height: '24px',

    margin:
      '4px 3px',

    background: '#d5d5d5',

    alignSelf: 'center',
  };

  const ctaButtonStyle:
    React.CSSProperties = {
    display: 'inline-flex',

    alignItems: 'center',
    justifyContent: 'center',

    flex: '0 0 auto',

    minHeight: '32px',

    padding:
      '6px 12px',

    margin: 0,

    fontFamily:
      'Arial, Helvetica, sans-serif',

    fontSize: '13px',
    lineHeight: 1,

    fontWeight: 700,

    borderRadius: '5px',

    cursor: 'pointer',

    boxSizing: 'border-box',

    appearance: 'none',
    WebkitAppearance: 'none',

    visibility: 'visible',
    opacity: 1,

    position: 'relative',
    zIndex: 2,

    background: '#fff7f4',

    color: '#c46d53',

    border:
      '1px solid #c46d53',

    boxShadow:
      '0 1px 2px rgba(0,0,0,0.08)',

    whiteSpace: 'nowrap',
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <>
      <div
        className="rich-text-editor-container"
        style={{
          display: 'flex',
          flexDirection: 'column',

          width: '100%',
          minWidth: 0,

          position: 'relative',

          visibility: 'visible',
          opacity: 1,
        }}
      >
        {/* ─────────────────────────────────────
            TOOLBAR
        ───────────────────────────────────── */}

        <div
          className="editor-toolbar"
          role="toolbar"
          aria-label="Ferramentas de formatação"
          style={{
            display: 'flex',

            flexDirection: 'row',

            flexWrap: 'wrap',

            alignItems: 'center',

            gap: '4px',

            width: '100%',
            minHeight: '49px',

            padding: '8px',

            boxSizing: 'border-box',

            background: '#f5f5f5',

            border:
              '1px solid #d5d5d5',

            borderBottom: 'none',

            borderTopLeftRadius:
              '8px',

            borderTopRightRadius:
              '8px',

            position: 'relative',

            zIndex: 10,

            visibility: 'visible',
            opacity: 1,

            overflow: 'visible',
          }}
        >
          {/* BOLD */}

          <button
            type="button"
            title="Negrito"
            aria-label="Negrito"
            aria-pressed={editor.isActive(
              'bold'
            )}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={toggleBold}
            style={toolbarButtonStyle(
              editor.isActive('bold')
            )}
          >
            B
          </button>

          {/* ITALIC */}

          <button
            type="button"
            title="Itálico"
            aria-label="Itálico"
            aria-pressed={editor.isActive(
              'italic'
            )}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={toggleItalic}
            style={{
              ...toolbarButtonStyle(
                editor.isActive(
                  'italic'
                )
              ),
              fontStyle: 'italic',
            }}
          >
            I
          </button>

          {/* UNDERLINE */}

          <button
            type="button"
            title="Sublinhado"
            aria-label="Sublinhado"
            aria-pressed={editor.isActive(
              'underline'
            )}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={toggleUnderline}
            style={{
              ...toolbarButtonStyle(
                editor.isActive(
                  'underline'
                )
              ),
              textDecoration:
                'underline',
            }}
          >
            U
          </button>

          <div
            style={separatorStyle}
            aria-hidden="true"
          />

          {/* H2 */}

          <button
            type="button"
            title="Título H2"
            aria-label="Título H2"
            aria-pressed={editor.isActive(
              'heading',
              { level: 2 }
            )}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={toggleH2}
            style={toolbarButtonStyle(
              editor.isActive(
                'heading',
                { level: 2 }
              )
            )}
          >
            H2
          </button>

          {/* H3 */}

          <button
            type="button"
            title="Título H3"
            aria-label="Título H3"
            aria-pressed={editor.isActive(
              'heading',
              { level: 3 }
            )}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={toggleH3}
            style={toolbarButtonStyle(
              editor.isActive(
                'heading',
                { level: 3 }
              )
            )}
          >
            H3
          </button>

          {/* QUOTE */}

          <button
            type="button"
            title="Citação"
            aria-label="Citação"
            aria-pressed={editor.isActive(
              'blockquote'
            )}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={toggleQuote}
            style={toolbarButtonStyle(
              editor.isActive(
                'blockquote'
              )
            )}
          >
            “”
          </button>

          <div
            style={separatorStyle}
            aria-hidden="true"
          />

          {/* BULLET LIST */}

          <button
            type="button"
            title="Lista com marcadores"
            aria-label="Lista com marcadores"
            aria-pressed={editor.isActive(
              'bulletList'
            )}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={toggleUl}
            style={toolbarButtonStyle(
              editor.isActive(
                'bulletList'
              )
            )}
          >
            UL
          </button>

          {/* ORDERED LIST */}

          <button
            type="button"
            title="Lista numerada"
            aria-label="Lista numerada"
            aria-pressed={editor.isActive(
              'orderedList'
            )}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={toggleOl}
            style={toolbarButtonStyle(
              editor.isActive(
                'orderedList'
              )
            )}
          >
            OL
          </button>

          <div
            style={separatorStyle}
            aria-hidden="true"
          />

          {/* CTA */}

          <button
            type="button"
            title="Inserir CTA editorial"
            aria-label="Inserir CTA editorial"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={insertCta}
            style={ctaButtonStyle}
          >
            + CTA
          </button>
        </div>

        {/* ─────────────────────────────────────
            EDITOR CONTENT
        ───────────────────────────────────── */}

        <div
          style={{
            width: '100%',
            minWidth: 0,

            position: 'relative',
            zIndex: 1,

            visibility: 'visible',
            opacity: 1,
          }}
        >
          <EditorContent
            editor={editor}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────
          CTA MODAL
      ───────────────────────────────────── */}

      {ctaModal && (
        <CtaModal
          initial={
            ctaModal.attrs
          }
          onSave={
            handleCtaSave
          }
          onCancel={() =>
            setCtaModal(null)
          }
        />
      )}
    </>
  );
}