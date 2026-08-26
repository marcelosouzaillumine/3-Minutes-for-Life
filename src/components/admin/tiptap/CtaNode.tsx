import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';
import type { NodeViewProps } from '@tiptap/react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CtaNodeAttrs {
  title: string;
  description: string;
  label: string;

  /**
   * External URL or internal route.
   * Mutually exclusive with `action`.
   */
  url: string;

  /**
   * Internal action identifier.
   * Examples: share, save, login.
   *
   * This value is stored in the document but is NOT
   * displayed to the user.
   */
  action: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function normalizeAttrs(
  attrs: Partial<CtaNodeAttrs> | null | undefined
): CtaNodeAttrs {
  return {
    title: attrs?.title ?? '',
    description: attrs?.description ?? '',
    label: attrs?.label ?? '',
    url: attrs?.url ?? '',
    action: attrs?.action ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REACT NODE VIEW
// ─────────────────────────────────────────────────────────────────────────────

function CtaNodeView({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = normalizeAttrs(
    node.attrs as Partial<CtaNodeAttrs>
  );

  const isEditable = editor.isEditable;

  // ─────────────────────────────────────────────
  // EDIT
  // ─────────────────────────────────────────────

  const handleEdit = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const event = new CustomEvent(
      'cta:edit',
      {
        detail: {
          attrs,
          updateAttributes,
          deleteNode,
        },
      }
    );

    document.dispatchEvent(event);
  };

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────

  const handleDelete = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    deleteNode();
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div
      contentEditable={false}
      data-type="cta"
      style={{
        border: `2px solid ${
          selected
            ? '#c46d53'
            : '#e0cfc9'
        }`,

        borderRadius: '12px',

        padding:
          '1rem 1.25rem',

        margin:
          '1rem 0',

        background:
          '#fdf7f5',

        position:
          'relative',

        cursor:
          isEditable
            ? 'pointer'
            : 'default',

        userSelect:
          'none',

        boxSizing:
          'border-box',

        width:
          '100%',
      }}

      onClick={
        isEditable
          ? handleEdit
          : undefined
      }
    >
      {/* ─────────────────────────────────────
          BADGE
      ───────────────────────────────────── */}

      <span
        style={{
          display:
            'inline-block',

          fontSize:
            '0.7rem',

          fontWeight:
            700,

          letterSpacing:
            '0.08em',

          textTransform:
            'uppercase',

          color:
            '#c46d53',

          marginBottom:
            '0.5rem',

          background:
            '#f9ece8',

          padding:
            '2px 8px',

          borderRadius:
            '99px',
        }}
      >
        CTA Editorial
      </span>

      {/* ─────────────────────────────────────
          TITLE
      ───────────────────────────────────── */}

      {attrs.title && (
        <p
          style={{
            margin:
              '0.25rem 0 0.15rem',

            fontWeight:
              700,

            fontSize:
              '0.95rem',

            color:
              '#1a1a1a',

            lineHeight:
              1.4,
          }}
        >
          {attrs.title}
        </p>
      )}

      {/* ─────────────────────────────────────
          DESCRIPTION
      ───────────────────────────────────── */}

      {attrs.description && (
        <p
          style={{
            margin:
              '0 0 0.75rem',

            fontSize:
              '0.85rem',

            color:
              '#555',

            lineHeight:
              1.5,
          }}
        >
          {attrs.description}
        </p>
      )}

      {/* ─────────────────────────────────────
          BUTTON PREVIEW
      ───────────────────────────────────── */}

      {attrs.label && (
        <span
          style={{
            display:
              'inline-flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            padding:
              '0.45rem 0.95rem',

            borderRadius:
              '8px',

            background:
              '#c46d53',

            color:
              '#fff',

            fontSize:
              '0.8rem',

            fontWeight:
              600,

            lineHeight:
              1.2,
          }}
        >
          {attrs.label}
        </span>
      )}

      {/* ─────────────────────────────────────
          EDIT / DELETE
          
          IMPORTANTE:
          Não mostramos `url` nem `action`
          aqui. Esses valores são dados
          técnicos do CTA.
      ───────────────────────────────────── */}

      {isEditable && (
        <div
          style={{
            position:
              'absolute',

            top:
              '0.5rem',

            right:
              '0.5rem',

            display:
              'flex',

            gap:
              '4px',

            zIndex:
              5,
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleEdit}
            title="Editar CTA"
            style={{
              padding:
                '2px 8px',

              fontSize:
                '0.72rem',

              borderRadius:
                '6px',

              border:
                '1px solid #c46d53',

              background:
                '#fff',

              color:
                '#c46d53',

              cursor:
                'pointer',

              fontWeight:
                600,
            }}
          >
            Editar
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleDelete}
            title="Remover CTA"
            aria-label="Remover CTA"
            style={{
              padding:
                '2px 8px',

              fontSize:
                '0.72rem',

              borderRadius:
                '6px',

              border:
                '1px solid #ccc',

              background:
                '#fff',

              color:
                '#888',

              cursor:
                'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPTAP NODE
// ─────────────────────────────────────────────────────────────────────────────

export const CtaNode = Node.create({
  name: 'cta',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  isolating: true,

  // ─────────────────────────────────────────────
  // ATTRIBUTES
  // ─────────────────────────────────────────────

  addAttributes() {
    return {
      title: {
        default: '',
      },

      description: {
        default: '',
      },

      label: {
        default: '',
      },

      url: {
        default: '',
      },

      action: {
        default: '',
      },
    };
  },

  // ─────────────────────────────────────────────
  // PARSE HTML
  // ─────────────────────────────────────────────

  parseHTML() {
    return [
      {
        tag:
          'div[data-type="cta"]',

        getAttrs: (element) => {
          const div =
            element as HTMLElement;

          return {
            title:
              div.getAttribute(
                'data-title'
              ) || '',

            description:
              div.getAttribute(
                'data-description'
              ) || '',

            label:
              div.getAttribute(
                'data-label'
              ) || '',

            url:
              div.getAttribute(
                'data-url'
              ) || '',

            action:
              div.getAttribute(
                'data-action'
              ) || '',
          };
        },
      },
    ];
  },

  // ─────────────────────────────────────────────
  // RENDER HTML
  //
  // IMPORTANTE:
  //
  // `action` continua sendo preservado
  // em `data-action`, pois é necessário
  // para o processamento do CTA.
  //
  // Porém, `action` NÃO é renderizado
  // visualmente.
  //
  // O usuário verá apenas o conteúdo
  // editorial do CTA.
  // ─────────────────────────────────────────────

  renderHTML({
    HTMLAttributes,
  }) {
    const attrs =
      normalizeAttrs(
        HTMLAttributes as Partial<CtaNodeAttrs>
      );

    const buttonAttrs =
      attrs.url
        ? {
            href: attrs.url,
            target: '_blank',
            rel:
              'noopener noreferrer',
          }
        : {
            'data-action':
              attrs.action,
          };

    return [
      'div',

      mergeAttributes(
        {
          'data-type':
            'cta',

          'data-title':
            attrs.title,

          'data-description':
            attrs.description,

          'data-label':
            attrs.label,

          'data-url':
            attrs.url,

          'data-action':
            attrs.action,

          style:
            [
              'margin:32px 0',
              'padding:24px',
              'border:1px solid #ead8d1',
              'border-radius:12px',
              'background:#fdf7f5',
              'box-sizing:border-box',
            ].join(';'),
        }
      ),

      // ─────────────────────────────────────
      // BADGE
      // ─────────────────────────────────────

      [
        'div',
        {
          style:
            [
              'display:inline-block',
              'margin-bottom:10px',
              'padding:4px 9px',
              'border-radius:999px',
              'background:#f9ece8',
              'color:#c46d53',
              'font-size:11px',
              'font-weight:700',
              'letter-spacing:.08em',
              'text-transform:uppercase',
            ].join(';'),
        },
        'CTA Editorial',
      ],

      // ─────────────────────────────────────
      // TITLE
      // ─────────────────────────────────────

      ...(attrs.title
        ? [
            [
              'div',
              {
                style:
                  [
                    'margin:0 0 8px',
                    'font-size:18px',
                    'line-height:1.35',
                    'font-weight:700',
                    'color:#1a1a1a',
                  ].join(';'),
              },
              attrs.title,
            ],
          ]
        : []),

      // ─────────────────────────────────────
      // DESCRIPTION
      // ─────────────────────────────────────

      ...(attrs.description
        ? [
            [
              'div',
              {
                style:
                  [
                    'margin:0 0 16px',
                    'font-size:14px',
                    'line-height:1.6',
                    'color:#555',
                  ].join(';'),
              },
              attrs.description,
            ],
          ]
        : []),

      // ─────────────────────────────────────
      // BUTTON
      //
      // Para URL:
      //   <a href="...">
      //
      // Para action:
      //   <a data-action="share">
      //
      // O action permanece no HTML como
      // metadado técnico, mas nunca é exibido.
      // ─────────────────────────────────────

      ...(attrs.label
        ? [
            [
              'a',
              mergeAttributes(
                buttonAttrs,
                {
                  style:
                    [
                      'display:inline-block',
                      'padding:12px 20px',
                      'border-radius:8px',
                      'background:#c46d53',
                      'color:#ffffff',
                      'font-size:14px',
                      'font-weight:700',
                      'line-height:1.2',
                      'text-decoration:none',
                    ].join(';'),
                }
              ),
              attrs.label,
            ],
          ]
        : []),
    ];
  },

  // ─────────────────────────────────────────────
  // REACT NODE VIEW
  // ─────────────────────────────────────────────

  addNodeView() {
    return ReactNodeViewRenderer(
      CtaNodeView
    );
  },
});