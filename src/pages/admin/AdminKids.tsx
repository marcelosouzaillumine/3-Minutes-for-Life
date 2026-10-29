import { useEffect, useState } from 'react';
import { illumineFetch } from '../../lib/illumine';
import { BANDS, type Band, type KidsVersion } from '../../services/FamilyService';

interface Row { id: string; title: string; publicationDate: string; scriptureReference?: string | null; scriptureText?: string | null; principleStatement?: string | null; reflection?: string; practicalApplication?: string | null; prayer?: string | null }
type Draft = Omit<KidsVersion, 'band'>;

const EMPTY: Draft = { scriptureFocus: '', whatItSays: '', thinkAbout: '', practice: '', prayer: '', adultGuide: '', status: 'draft' };

const FIELDS: { key: keyof Draft; label: string; rows: number }[] = [
  { key: 'scriptureFocus', label: 'Trecho da passagem (opcional)', rows: 2 },
  { key: 'whatItSays', label: 'O que a Bíblia conta', rows: 4 },
  { key: 'thinkAbout', label: 'Para pensar', rows: 4 },
  { key: 'practice', label: 'Para fazer hoje', rows: 3 },
  { key: 'prayer', label: 'Oração', rows: 2 },
  { key: 'adultGuide', label: 'Guia do adulto', rows: 3 },
];

/** Revisão das versões infantis: nada chega ao app enquanto o status for "rascunho". */
export function AdminKids() {
  const [rows, setRows] = useState<Row[]>([]);
  const [current, setCurrent] = useState<Row | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    illumineFetch('/devotionals?status=published&perPage=500')
      .then((r) => (r.ok ? r.json() : { devotionals: [] }))
      .then((b) => setRows(((b.devotionals ?? []) as Row[]).sort((a, c) => String(c.publicationDate).localeCompare(String(a.publicationDate)))))
      .catch(() => setMsg('Não foi possível carregar os devocionais.'));
  }, []);

  const open = async (row: Row) => {
    setCurrent(row);
    setMsg('');
    const res = await illumineFetch(`/devotionals/${row.id}/kids/admin`);
    const versions: (KidsVersion & { language?: string })[] = res.ok ? (await res.json()).versions ?? [] : [];
    const next: Record<string, Draft> = {};
    for (const b of BANDS) {
      const v = versions.find((x) => x.band === b && (x.language ?? 'pt-BR') === 'pt-BR');
      next[b] = v ? { scriptureFocus: v.scriptureFocus ?? '', whatItSays: v.whatItSays, thinkAbout: v.thinkAbout, practice: v.practice, prayer: v.prayer, adultGuide: v.adultGuide, status: v.status } : { ...EMPTY };
    }
    setDrafts(next);
  };

  const save = async (band: Band) => {
    if (!current) return;
    const d = drafts[band];
    if (![d.whatItSays, d.thinkAbout, d.practice, d.prayer, d.adultGuide].every((x) => x.trim())) {
      setMsg(`Faixa ${band}: preencha todos os campos, menos o trecho da passagem.`);
      return;
    }
    setSaving(band);
    setMsg('');
    const res = await illumineFetch(`/devotionals/${current.id}/kids/${band}`, {
      method: 'PUT',
      body: JSON.stringify({ ...d, scriptureFocus: d.scriptureFocus?.trim() || null, language: 'pt-BR' }),
    });
    setMsg(res.ok ? `Faixa ${band.replace('-', ' a ')} salva (${d.status === 'published' ? 'publicada' : 'rascunho'}).` : 'Não foi possível salvar.');
    setSaving(null);
  };

  const set = (band: Band, key: keyof Draft, value: string) =>
    setDrafts((p) => ({ ...p, [band]: { ...p[band], [key]: value } as Draft }));

  if (!current) {
    return (
      <div className="admin-section">
        <h3>Devocional para crianças</h3>
        <p style={{ fontSize: 13 }}>Escolha um devocional para escrever ou revisar as versões por faixa de idade.</p>
        {msg && <p>{msg}</p>}
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 6 }}>
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => open(r)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', cursor: 'pointer' }}>
                {String(r.publicationDate).slice(0, 10)} · {r.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <button type="button" onClick={() => setCurrent(null)} style={{ marginBottom: 12, cursor: 'pointer' }}>← Devocionais</button>
      <h3>{current.title}</h3>
      <details open style={{ marginBottom: 16 }}>
        <summary>Texto original (a versão infantil precisa manter esta tese e esta passagem)</summary>
        <p><strong>{current.scriptureReference}</strong> {current.scriptureText}</p>
        <p><em>{current.principleStatement}</em></p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{current.reflection}</p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{current.practicalApplication}</p>
        <p>{current.prayer}</p>
      </details>
      {msg && <p role="status">{msg}</p>}
      {BANDS.map((band) => (
        <details key={band} style={{ marginBottom: 12 }}>
          <summary>{band.replace('-', ' a ')} anos · {drafts[band]?.status === 'published' ? 'publicada' : drafts[band]?.whatItSays ? 'rascunho' : 'vazia'}</summary>
          {FIELDS.map((f) => (
            <label key={f.key} style={{ display: 'block', margin: '10px 0 0', fontSize: 13 }}>
              {f.label}
              <textarea rows={f.rows} style={{ width: '100%' }} value={(drafts[band]?.[f.key] as string) ?? ''} onChange={(e) => set(band, f.key, e.target.value)} />
            </label>
          ))}
          <label style={{ display: 'block', margin: '10px 0', fontSize: 13 }}>
            Status{' '}
            <select value={drafts[band]?.status ?? 'draft'} onChange={(e) => set(band, 'status', e.target.value)}>
              <option value="draft">Rascunho (não aparece no app)</option>
              <option value="published">Publicada (aparece no app)</option>
            </select>
          </label>
          <button type="button" disabled={saving === band} onClick={() => save(band)}>Salvar faixa {band.replace('-', ' a ')}</button>
        </details>
      ))}
    </div>
  );
}
