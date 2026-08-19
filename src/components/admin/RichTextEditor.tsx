import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3], // Only allow H2 and H3
        },
        // We can disable things we don't want here if needed
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        style: 'min-height: 200px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; border-top-left-radius: 0; border-top-right-radius: 0; background: white; outline: none;'
      }
    }
  });

  // Effect to update content if it changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const toggleBold = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); };
  const toggleItalic = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); };
  const toggleUnderline = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); };
  const toggleH2 = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); };
  const toggleH3 = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); };
  const toggleQuote = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); };
  const toggleUl = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); };
  const toggleOl = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); };

  const activeStyle = { background: 'var(--color-primary)', color: 'white' };
  const inactiveStyle = { background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid #ddd' };
  
  const btnStyle = (isActive: boolean) => ({
    padding: '6px 10px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: 'pointer',
    ...(isActive ? activeStyle : inactiveStyle)
  });

  return (
    <div className="rich-text-editor-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="editor-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', background: '#f5f5f5', border: '1px solid #ddd', borderBottom: 'none', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
        <button type="button" onClick={toggleBold} style={btnStyle(editor.isActive('bold'))}>B</button>
        <button type="button" onClick={toggleItalic} style={btnStyle(editor.isActive('italic'))}>I</button>
        <button type="button" onClick={toggleUnderline} style={btnStyle(editor.isActive('underline'))}>U</button>
        <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
        <button type="button" onClick={toggleH2} style={btnStyle(editor.isActive('heading', { level: 2 }))}>H2</button>
        <button type="button" onClick={toggleH3} style={btnStyle(editor.isActive('heading', { level: 3 }))}>H3</button>
        <button type="button" onClick={toggleQuote} style={btnStyle(editor.isActive('blockquote'))}>""</button>
        <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
        <button type="button" onClick={toggleUl} style={btnStyle(editor.isActive('bulletList'))}>UL</button>
        <button type="button" onClick={toggleOl} style={btnStyle(editor.isActive('orderedList'))}>OL</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
