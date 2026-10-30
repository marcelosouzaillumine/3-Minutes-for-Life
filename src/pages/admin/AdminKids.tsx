import { useEffect, useMemo, useState } from 'react';
import { illumineFetch } from '../../lib/illumine';
import { BANDS, FamilyAdmin, type Band, type KidsDraft } from '../../services/FamilyService';
import { PlansStudio } from './AdminPlans';
import '../../styles/family.css';

export interface Row { id: string; title: string; publicationDate: string; scriptureReference?: string | null; scriptureText?: string | null; principleStatement?: string | null; reflection?: string; practicalApplication?: string | null; prayer?: string | null }
const EMPTY: KidsDraft = { title: '', scriptureFocus: '', whatItSays: '', thinkAbout: '', practice: '', prayer: '', adultGuide: '', status: 'draft' };
const FIELDS: { key: Exclude<keyof KidsDraft, 'status'>; label: string; rows: number }[] = [
  { key: 'title', label: 'Título para esta faixa (até 80 caracteres)', rows: 1 },
  { key: 'scriptureFocus', label: 'Trecho da passagem (opcional)', rows: 2 },
  { key: 'whatItSays', label: 'O que a Bíblia conta', rows: 5 },
  { key: 'thinkAbout', label: 'Para pensar', rows: 4 },
  { key: 'practice', label: 'Para fazer hoje', rows: 3 },
  { key: 'prayer', label: 'Oração', rows: 3 },
  { key: 'adultGuide', label: 'Guia do adulto', rows: 3 },
];
const bandLabel = (b: Band) => `${b.replace('-', ' a ')} anos`;
const strip = (s?: string | null) => (s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function useDevotionals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    illumineFetch('/devotionals?status=published&perPage=500')
      .then((r) => (r.ok ? r.json() : { devotionals: [] }))
      .then((b) => setRows(((b.devotionals ?? []) as Row[]).sort((a, c) => String(c.publicationDate).localeCompare(String(a.publicationDate)))))
      .catch(() => setError('Não foi possível carregar os devocionais.'));
  }, []);
  return { rows, error };
}

/** Estúdio de conteúdo da família: versões infantis dos devocionais e planos para as famílias. */
export function AdminKids() {
  const [tab, setTab] = useState<'kids' | 'plans'>('kids');
  const { rows, error } = useDevotionals();
  return (
    <div className="admin-section studio">
      <h3>Conteúdo da família</h3>
      <div className="studio__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'kids'} className={tab === 'kids' ? 'is-on' : ''} onClick={() => setTab('kids')}>Versões infantis</button>
        <button type="button" role="tab" aria-selected={tab === 'plans'} className={tab === 'plans' ? 'is-on' : ''} onClick={() => setTab('plans')}>Planos</button>
      </div>
      {error && <p className="fam-error">{error}</p>}
      {tab === 'kids' ? <KidsStudio rows={rows} /> : <PlansStudio rows={rows} />}
    </div>
  );
}

const LANGS = [['pt-BR', 'Português', 'PT'], ['en', 'English', 'EN'], ['es', 'Español', 'ES']] as const;
type Lang = (typeof LANGS)[number][0];
type Summary = Record<string, { draft: number; published: number }>;

function KidsStudio({ rows }: { rows: Row[] }) {
  const [summaries, setSummaries] = useState<Record<Lang, Summary>>({ 'pt-BR': {}, en: {}, es: {} });
  const [filter, setFilter] = useState<'all' | 'missing' | 'draft' | 'done'>('all');
  const [lang, setLang] = useState<Lang>('pt-BR');
  const [current, setCurrent] = useState<Row | null>(null);
  const [drafts, setDrafts] = useState<Record<Band, KidsDraft>>({} as Record<Band, KidsDraft>);
  const [reference, setReference] = useState<Record<Band, KidsDraft | null>>({} as Record<Band, KidsDraft | null>);
  const [band, setBand] = useState<Band>('7-10');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = () => Promise.all(LANGS.map(([l]) => FamilyAdmin.kidsSummary(l))).then(([pt, en, es]) => setSummaries({ 'pt-BR': pt, en, es }));
  useEffect(() => { refresh(); }, []);

  const stateOf = (id: string): 'missing' | 'draft' | 'done' => {
    const all = LANGS.map(([l]) => summaries[l][id]);
    if (all.every((s) => s && s.published >= BANDS.length)) return 'done';
    if (all.every((s) => !s || s.draft + s.published === 0)) return 'missing';
    return 'draft';
  };
  const shown = useMemo(() => rows.filter((r) => filter === 'all' || stateOf(r.id) === filter), [rows, summaries, filter]);

  const load = async (row: Row, l: Lang) => {
    const [kids, pt] = await Promise.all([FamilyAdmin.getKids(row.id, l), l === 'pt-BR' ? null : FamilyAdmin.getKids(row.id, 'pt-BR')]);
    const next = {} as Record<Band, KidsDraft>;
    for (const b of BANDS) next[b] = kids[b] ?? { ...EMPTY };
    setDrafts(next);
    setReference(pt ?? ({} as Record<Band, KidsDraft | null>));
  };
  const open = async (row: Row) => { setCurrent(row); setMsg(''); await load(row, lang); };
  const pickLang = async (l: Lang) => { setLang(l); setMsg(''); if (current) await load(current, l); };

  const set = (key: keyof KidsDraft, value: string) => setDrafts((p) => ({ ...p, [band]: { ...p[band], [key]: value } as KidsDraft }));

  const save = async (status: 'draft' | 'published') => {
    if (!current) return;
    const d = { ...drafts[band], status };
    if (![d.whatItSays, d.thinkAbout, d.practice, d.prayer, d.adultGuide].every((x) => x.trim())) {
      setMsg(`Faixa ${bandLabel(band)}: preencha todos os campos, menos o título e o trecho da passagem.`);
      return;
    }
    setSaving(true);
    const ok = await FamilyAdmin.saveKids(current.id, band, d, lang);
    if (ok) { setDrafts((p) => ({ ...p, [band]: d })); refresh(); }
    setMsg(ok ? `${bandLabel(band)} em ${LANGS.find(([l]) => l === lang)![1]}: ${status === 'published' ? 'publicada, já aparece no app' : 'salva como rascunho'}.` : 'Não foi possível salvar.');
    setSaving(false);
  };

  if (!current) {
    return (
      <>
        <p className="fam-note">Cada devocional precisa das 3 faixas de idade em português, inglês e espanhol. Nada chega às famílias enquanto a faixa estiver em rascunho.</p>
        <div className="fam-people">
          {([['all', 'Todos'], ['missing', 'Sem versão'], ['draft', 'Em andamento'], ['done', 'Completos']] as const).map(([k, l]) => (
            <button key={k} type="button" className={`fam-chip${filter === k ? ' is-on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <ul className="studio__list">
          {shown.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => open(r)}>
                <span>{r.title}<small>{String(r.publicationDate).slice(0, 10)}</small></span>
                <span className="studio__langs">
                  {LANGS.map(([l, , short]) => {
                    const n = summaries[l][r.id]?.published ?? 0;
                    return <em key={l} className={`studio__badge studio__badge--${n >= BANDS.length ? 'done' : n > 0 ? 'draft' : 'none'}`}>{short} {n}/{BANDS.length}</em>;
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const d = drafts[band] ?? EMPTY;
  const ref = reference[band];
  return (
    <>
      <button type="button" className="fam-link" onClick={() => { setCurrent(null); refresh(); }}>← Devocionais</button>
      <h4 className="studio__title">{current.title}</h4>
      <div className="studio__tabs" role="tablist" aria-label="Idioma">
        {LANGS.map(([l, name]) => (
          <button key={l} type="button" role="tab" aria-selected={l === lang} className={l === lang ? 'is-on' : ''} onClick={() => pickLang(l)}>{name}</button>
        ))}
      </div>
      <div className="studio__grid">
        <aside className="studio__source">
          <p className="fam-eyebrow">{lang === 'pt-BR' ? 'Texto original · a versão infantil mantém esta tese e esta passagem' : `Versão em português desta faixa (${bandLabel(band)}) · traduza com o mesmo sentido`}</p>
          {lang === 'pt-BR' || !ref ? (
            <>
              <p><strong>{current.scriptureReference}</strong> {current.scriptureText}</p>
              {current.principleStatement && <p><em>{current.principleStatement}</em></p>}
              <p>{strip(current.reflection)}</p>
              <p>{strip(current.practicalApplication)}</p>
              <p>{strip(current.prayer)}</p>
              {lang !== 'pt-BR' && <p className="fam-note">Ainda não há versão em português para esta faixa. Escreva-a primeiro em Português.</p>}
            </>
          ) : (
            FIELDS.filter((f) => ref[f.key]).map((f) => <p key={f.key}><strong>{f.label}</strong><br />{ref[f.key]}</p>)
          )}
        </aside>
        <div>
          <div className="studio__tabs" role="tablist" aria-label="Faixa de idade">
            {BANDS.map((b) => (
              <button key={b} type="button" role="tab" aria-selected={b === band} className={b === band ? 'is-on' : ''} onClick={() => { setBand(b); setMsg(''); }}>
                {bandLabel(b)}{drafts[b]?.status === 'published' ? ' ✓' : drafts[b]?.whatItSays ? ' ·' : ''}
              </button>
            ))}
          </div>
          <div className="fam-form">
            {FIELDS.map((f) => (
              <label key={f.key}>{f.label}
                {f.key === 'title'
                  ? <input maxLength={80} value={d.title} placeholder="Ex.: O segredo de Paulo" onChange={(e) => set('title', e.target.value)} />
                  : <textarea rows={f.rows} value={d[f.key]} onChange={(e) => set(f.key, e.target.value)} />}
              </label>
            ))}
          </div>
          {msg && <p className="fam-note" role="status">{msg}</p>}
          <div className="studio__actions">
            <button type="button" className="fam-btn fam-btn--secondary" disabled={saving} onClick={() => save('draft')}>Salvar rascunho</button>
            <button type="button" className="fam-btn fam-btn--primary" disabled={saving} onClick={() => save('published')}>Publicar faixa</button>
          </div>
        </div>
        <aside className="studio__phone" aria-label="Prévia">
          <p className="fam-eyebrow">Prévia no app · {bandLabel(band)}</p>
          <div className="studio__screen">
            {current.scriptureReference && <p className="fam-eyebrow fam-eyebrow--accent">{current.scriptureReference}</p>}
            <h4 className="studio__title">{d.title || current.title}</h4>
            {d.scriptureFocus && <blockquote>{d.scriptureFocus}</blockquote>}
            <h5>O que a Bíblia conta</h5><p>{d.whatItSays || '…'}</p>
            <h5>Para pensar</h5><p>{d.thinkAbout || '…'}</p>
            <h5>Para fazer hoje</h5><p>{d.practice || '…'}</p>
            <h5>Oração</h5><p>{d.prayer || '…'}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
