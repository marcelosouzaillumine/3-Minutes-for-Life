import React, { useEffect, useRef, useState } from 'react';
import { AdminContentService } from '../../services/AdminContentService';

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export const MediaLibraryPicker: React.FC<Props> = ({ onSelect, onClose }) => {
  const [images, setImages] = useState<Array<{ name: string; url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    AdminContentService.listLibraryImages()
      .then(setImages)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setError('Formato inválido. Use JPG, PNG ou WebP.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Arquivo muito grande. Limite: 5 MB.'); return; }

    setUploading(true);
    setError('');
    try {
      const url = await AdminContentService.uploadLibraryImage(file);
      const name = url.split('/').pop() || file.name;
      setImages(prev => [{ name, url }, ...prev]);
    } catch (err: any) {
      setError('Erro ao enviar: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface, #fff)',
          borderRadius: '12px', width: '100%', maxWidth: '720px',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
          <strong style={{ fontSize: '1rem' }}>Biblioteca de imagens</strong>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ background: 'var(--color-primary, #1e2535)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {uploading ? 'Enviando...' : '+ Nova imagem'}
            </button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, color: 'inherit' }}>✕</button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleUpload} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}
          {loading && <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Carregando...</p>}
          {!loading && images.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Nenhuma imagem na biblioteca. Faça upload de uma nova.</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {images.map(img => (
              <button
                key={img.name}
                type="button"
                onClick={() => { onSelect(img.url); onClose(); }}
                style={{
                  padding: 0, border: '2px solid transparent', borderRadius: '8px',
                  cursor: 'pointer', background: 'none', overflow: 'hidden',
                  aspectRatio: '1 / 1', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary, #1e2535)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                title={img.name}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
