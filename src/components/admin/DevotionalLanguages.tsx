import { buildLangMap } from '../../services/AdminContentService';
import { BANDS } from '../../services/FamilyService';

export type KidsSummaries = Record<string, Record<string, { draft: number; published: number }>>;

type Tone = 'done' | 'draft' | 'none';
const TONE: Record<Tone, { bg: string; fg: string; bd: string }> = {
  done: { bg: '#ecfdf5', fg: '#047857', bd: '#6ee7b7' },
  draft: { bg: '#fffbeb', fg: '#b45309', bd: '#fcd34d' },
  none: { bg: 'transparent', fg: '#9ca3af', bd: '#e5e7eb' },
};

function Dot({ tone, title }: { tone: Tone; title: string }) {
  const t = TONE[tone];
  return <span title={title} style={{ width: 9, height: 9, borderRadius: '50%', display: 'inline-block', background: tone === 'none' ? 'transparent' : t.fg, border: `1.5px solid ${t.fg}` }} />;
}

/** Uma linha por devocional: para cada idioma, o ponto do texto adulto e quantas faixas infantis estão no ar. */
export function DevotionalLanguages({ devo, languages, kids }: { devo: any; languages: any[]; kids: KidsSummaries }) {
  const langMap = buildLangMap(devo);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: '6px', marginTop: '10px' }}>
      {languages.map((l) => {
        const iso: string = l.iso_code;
        const entry = langMap[iso];
        const adultTone: Tone = l.is_source
          ? (devo.status === 'published' ? 'done' : 'draft')
          : !entry ? 'none' : entry.state === 'draft' ? 'draft' : 'done';
        const stale = !!(entry && (entry.isStale || entry.isPossiblyStale));
        const k = kids[iso]?.[devo.id];
        const kidsPub = k?.published ?? 0;
        const kidsTone: Tone = kidsPub >= BANDS.length ? 'done' : kidsPub > 0 || (k?.draft ?? 0) > 0 ? 'draft' : 'none';
        const t = TONE[adultTone === 'done' && kidsTone === 'done' ? 'done' : adultTone === 'none' && kidsTone === 'none' ? 'none' : 'draft'];
        return (
          <div key={iso} style={{ border: `1px solid ${t.bd}`, background: t.bg, borderRadius: '8px', padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
            <strong style={{ color: t.fg }}>{iso === 'pt-BR' ? 'PT' : iso.toUpperCase()}</strong>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Dot tone={adultTone} title={`Texto adulto: ${adultTone === 'done' ? 'publicado' : adultTone === 'draft' ? 'rascunho' : 'falta'}`} />
              <span title="Faixas infantis publicadas" style={{ color: TONE[kidsTone].fg }}>{kidsPub}/{BANDS.length}</span>
              {stale && <span title="O texto em português mudou depois desta tradução" style={{ color: '#b45309' }}>⚠</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
