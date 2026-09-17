import { illumineFetch } from './illumine';

/** Envia um arquivo para o storage do Illumine (S3/R2) via POST /media/upload e devolve a URL pública. */
export async function uploadToStorage(file: File, folder: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const data = btoa(binary);

  const res = await illumineFetch('/media/upload', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, mimeType: file.type, folder, data }),
  });

  if (res.ok) {
    const { publicUrl } = await res.json();
    return publicUrl;
  }

  const body = await res.json().catch(() => ({}));
  if (body.error === 'STORAGE_NOT_CONFIGURED') {
    throw new Error('Armazenamento não configurado no servidor. Configure as variáveis S3 no Railway.');
  }
  throw new Error(`Upload falhou (${res.status}): ${body.error ?? ''}`);
}
