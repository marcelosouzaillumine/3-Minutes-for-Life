import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';
import type { NodeViewProps } from '@tiptap/react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CtaNodeAttrs {
  title: string;
  description: string;
  label: string;
  /** External URL or internal route — mutually exclusive with `action` */
  url: string;
  /** Internal action identifier (e.g. 'share', 'save') — mutually exclusive with `url` */
  action: string;
}

// ─── NodeView (React component rendered inside TipTap editor) ─────────────────

function CtaNodeView({ node, selected, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as CtaNodeAttrs;
  const isEditable = editor.isEditable;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dispatch a custom event so the editor can open the CTA modal.
    const event = new CustomEvent('cta:edit', { detail: { attrs, updateAttributes, deleteNode } });
    document.dispatchEvent(event);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode();
  };

  return (
    <div
      contentEditable={false}
      data-type="cta"
      style={{
        border: `2px solid ${selected ? '#c46d53' : '#e0cfc9'}`,
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        margin: '1rem 0',
        background: '#fdf7f5',
        position: 'relative',
        cursor: isEditable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={isEditable ? handleEdit : undefined}
    >
      {/* Header badge */}
      <span style={{
        display: 'inline-block',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#c46d53',
        marginBottom: '0.5rem',
        background: '#f9ece8',
        padding: '2px 8px',
        borderRadius: '99px',
      }}>
        CTA Editorial
      </span>

      {attrs.title && (
        <p style={{ margin: '0.25rem 0 0.15rem', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>
          {attrs.title}
        </p>
      )}
      {attrs.description && (
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#555', lineHeight: 1.5 }}>
          {attrs.description}
        </p>
      )}
      {attrs.label && (
        <span style={{
          display: 'inline-block',
          padding: '0.35rem 0.9rem',
          borderRadius: '99px',
          background: '#c46d53',
          color: '#fff',
          fontSize: '0.8rem',
          fontWeight: 600,
        }}>
          {attrs.label}
        </span>
      )}
      {(attrs.url || attrs.action) && (
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#999' }}>
          {attrs.url ? `→ ${attrs.url}` : `⚡ ${attrs.action}`}
        </p>
      )}

      {/* Edit/Delete controls (only in editable mode) */}
      {isEditable && (
        <div style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          display: 'flex', gap: '4px',
        }}>
          <button
            type="button"
            onClick={handleEdit}
            title="Editar CTA"
            style={{
              padding: '2px 8px', fontSize: '0.72rem', borderRadius: '6px',
              border: '1px solid #c46d53', background: 'transparent',
              color: '#c46d53', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Remover CTA"
            style={{
              padding: '2px 8px', fontSize: '0.72rem', borderRadius: '6px',
              border: '1px solid #ccc', background: 'transparent',
              color: '#888', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TipTap Node Extension ────────────────────────────────────────────────────

export const CtaNode = Node.create({
  name: 'cta',
  group: 'block',
  atom: true, // atomic — cannot have child nodes
  draggable: true,

  addAttributes() {
    return {
      title:       { default: '' },
      description: { default: '' },
      label:       { default: '' },
      url:         { default: '' },
      action:      { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cta"]',
        getAttrs: (el) => {
          const div = el as HTMLElement;
          return {
            title:       div.getAttribute('data-title')       || '',
            description: div.getAttribute('data-description') || '',
            label:       div.getAttribute('data-label')       || '',
            url:         div.getAttribute('data-url')         || '',
            action:      div.getAttribute('data-action')      || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type':        'cta',
          'data-title':       HTMLAttributes.title       || '',
          'data-description': HTMLAttributes.description || '',
          'data-label':       HTMLAttributes.label       || '',
          'data-url':         HTMLAttributes.url         || '',
          'data-action':      HTMLAttributes.action      || '',
        }
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CtaNodeView);
  },
});
