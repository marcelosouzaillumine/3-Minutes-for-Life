import { useEffect, useRef, useState } from 'react';
import { AdminContentService } from '../../services/AdminContentService';
import { AdminService } from '../../services/AdminService';

type LibraryFile = { key: string; name: string; url: string; size: number; lastModified: string | null };

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '';

const buttonStyle = { padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' } as const;

export function AdminMedia() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await AdminContentService.listLibraryFiles();
      list.sort((a, b) => (b.lastModified ?? '').localeCompare(a.lastModified ?? ''));
      setFiles(list);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AdminService.isFullAdmin().then(ok => {
      setAllowed(ok);
      if (ok) load();
    });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setUploading(true);
    setError('');
    const problems: string[] = [];
    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { problems.push(`${file.name}: formato inválido (use JPG, PNG ou WebP)`); continue; }
      if (file.size > 5 * 1024 * 1024) { problems.push(`${file.name}: maior que 5 MB`); continue; }
      try {
        await AdminContentService.uploadLibraryImage(file);
      } catch (err: any) {
        problems.push(`${file.name}: ${err.message}`);
      }
    }
    if (problems.length) setError(problems.join(' · '));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await load();
  };

  const handleDelete = async (file: LibraryFile) => {
    const ok = window.confirm(
      `Excluir "${file.name}" definitivamente?\n\n` +
      'O arquivo será apagado do armazenamento e deixará de aparecer em qualquer conteúdo, tradução ou compartilhamento que o use. Não dá para desfazer.'
    );
    if (!ok) return;
    setDeleting(file.key);
    setError('');
    try {
      await AdminContentService.deleteShareAssetFile(file.url);
      setFiles(prev => prev.filter(f => f.key !== file.key));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      window.prompt('Copie o link:', url);
    }
  };

  if (allowed === null) return <div className="admin-spinner" />;
  if (!allowed) {
    return (
      <div style={{ padding: '24px' }}>
        <h1 className="admin-title">Biblioteca de imagens</h1>
        <p style={{ color: '#6b7280' }}>Acesso restrito a administradores.</p>
      </div>
    );
  }

  const visible = files.filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase()));
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div style={{ padding: '24px 16px 120px', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 className="admin-title">Biblioteca de imagens</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 16px' }}>
        {files.length} {files.length === 1 ? 'imagem' : 'imagens'} · {formatSize(totalSize)}. Aqui a exclusão é definitiva;
        o botão "Remover" dos conteúdos só desvincula a imagem.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          type="search"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ background: 'var(--color-primary, #1e2535)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}
        >
          {uploading ? 'Enviando...' : '+ Enviar imagens'}
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleUpload} />
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}
      {loading && <p style={{ color: '#6b7280' }}>Carregando...</p>}
      {!loading && visible.length === 0 && (
        <p style={{ color: '#6b7280' }}>{files.length === 0 ? 'Nenhuma imagem na biblioteca.' : 'Nenhuma imagem encontrada.'}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {visible.map(f => (
          <div key={f.key} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
            <a href={f.url} target="_blank" rel="noreferrer" title="Abrir em nova aba">
              <img src={f.url} alt={f.name} loading="lazy" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
            </a>
            <div style={{ padding: '8px 10px' }}>
              <div title={f.name} style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', margin: '2px 0 8px' }}>{formatSize(f.size)} · {formatDate(f.lastModified)}</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => handleCopy(f.url)} style={buttonStyle}>{copied === f.url ? 'Copiado!' : 'Copiar link'}</button>
                <button
                  type="button"
                  onClick={() => handleDelete(f)}
                  disabled={deleting === f.key}
                  style={{ ...buttonStyle, color: '#dc2626', borderColor: '#fecaca' }}
                >
                  {deleting === f.key ? '...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
