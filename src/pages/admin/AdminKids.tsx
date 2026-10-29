import { useEffect, useMemo, useState } from 'react';
import { illumineFetch } from '../../lib/illumine';
import { BANDS, FamilyAdmin, type Band, type KidsDraft, type PlanTemplate } from '../../services/FamilyService';
import '../../styles/family.css';

interface Row { id: string; title: string; publicationDate: string; scriptureReference?: string | null; scriptureText?: string | null; principleStatement?: string | null; reflection?: string; practicalApplication?: string | null; prayer?: string | null }
type Summary = Record<string, { draft: number; published: number }>;

const EMPTY: KidsDraft = { scriptureFocus: '', whatItSays: '', thinkAbout: '', practice: '', prayer: '', adultGuide: '', status: 'draft' };
const FIELDS: { key: Exclude<keyof KidsDraft, 'status'>; label: string; rows: number }[] = [
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
        <button type="button" role="tab" aria-selected={tab === 'plans'} className={tab === 'plans' ? 'is-on' : ''} onClick={() => setTab('plans')}>Planos da família</button>
      </div>
      {error && <p className="fam-error">{error}</p>}
      {tab === 'kids' ? <KidsStudio rows={rows} /> : <PlansStudio rows={rows} />}
    </div>
  );
}

function KidsStudio({ rows }: { rows: Row[] }) {
  const [summary, setSummary] = useState<Summary>({});
  const [filter, setFilter] = useState<'all' | 'missing' | 'draft' | 'done'>('all');
  const [current, setCurrent] = useState<Row | null>(null);
  const [drafts, setDrafts] = useState<Record<Band, KidsDraft>>({} as Record<Band, KidsDraft>);
  const [band, setBand] = useState<Band>('7-10');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = () => FamilyAdmin.kidsSummary().then(setSummary);
  useEffect(() => { refresh(); }, []);

  const stateOf = (id: string): 'missing' | 'draft' | 'done' => {
    const s = summary[id];
    if (!s || s.draft + s.published === 0) return 'missing';
    return s.published >= BANDS.length ? 'done' : 'draft';
  };
  const label = (id: string) => {
    const s = summary[id];
    if (!s || s.draft + s.published === 0) return 'Sem versão';
    return s.published >= BANDS.length ? 'Completo' : `${s.published} de ${BANDS.length} publicadas`;
  };
  const shown = useMemo(() => rows.filter((r) => filter === 'all' || stateOf(r.id) === filter), [rows, summary, filter]);

  const open = async (row: Row) => {
    setCurrent(row);
    setMsg('');
    const kids = await FamilyAdmin.getKids(row.id);
    const next = {} as Record<Band, KidsDraft>;
    for (const b of BANDS) next[b] = kids[b] ?? { ...EMPTY };
    setDrafts(next);
  };

  const set = (key: keyof KidsDraft, value: string) => setDrafts((p) => ({ ...p, [band]: { ...p[band], [key]: value } as KidsDraft }));

  const save = async (status: 'draft' | 'published') => {
    if (!current) return;
    const d = { ...drafts[band], status };
    if (![d.whatItSays, d.thinkAbout, d.practice, d.prayer, d.adultGuide].every((x) => x.trim())) {
      setMsg(`Faixa ${bandLabel(band)}: preencha todos os campos, menos o trecho da passagem.`);
      return;
    }
    setSaving(true);
    const ok = await FamilyAdmin.saveKids(current.id, band, d);
    if (ok) { setDrafts((p) => ({ ...p, [band]: d })); refresh(); }
    setMsg(ok ? `Faixa ${bandLabel(band)} ${status === 'published' ? 'publicada: já aparece no app' : 'salva como rascunho'}.` : 'Não foi possível salvar.');
    setSaving(false);
  };

  if (!current) {
    return (
      <>
        <p className="fam-note">Escolha um devocional. Nada chega às famílias enquanto a faixa estiver em rascunho.</p>
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
                <em className={`studio__badge studio__badge--${stateOf(r.id)}`}>{label(r.id)}</em>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const d = drafts[band] ?? EMPTY;
  return (
    <>
      <button type="button" className="fam-link" onClick={() => { setCurrent(null); refresh(); }}>← Devocionais</button>
      <h4 className="studio__title">{current.title}</h4>
      <div className="studio__grid">
        <aside className="studio__source">
          <p className="fam-eyebrow">Texto original · a versão infantil mantém esta tese e esta passagem</p>
          <p><strong>{current.scriptureReference}</strong> {current.scriptureText}</p>
          {current.principleStatement && <p><em>{current.principleStatement}</em></p>}
          <p>{strip(current.reflection)}</p>
          <p>{strip(current.practicalApplication)}</p>
          <p>{strip(current.prayer)}</p>
        </aside>
        <div>
          <div className="studio__tabs" role="tablist">
            {BANDS.map((b) => (
              <button key={b} type="button" role="tab" aria-selected={b === band} className={b === band ? 'is-on' : ''} onClick={() => { setBand(b); setMsg(''); }}>
                {bandLabel(b)}{drafts[b]?.status === 'published' ? ' ✓' : drafts[b]?.whatItSays ? ' ·' : ''}
              </button>
            ))}
          </div>
          <div className="fam-form">
            {FIELDS.map((f) => (
              <label key={f.key}>{f.label}
                <textarea rows={f.rows} value={d[f.key]} onChange={(e) => set(f.key, e.target.value)} />
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

function PlansStudio({ rows }: { rows: Row[] }) {
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [editing, setEditing] = useState<{ id: string | null; title: string; description: string; themeWord: string; items: string[]; status: 'draft' | 'published' } | null>(null);
  const [pick, setPick] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = () => FamilyAdmin.templates().then(setTemplates);
  useEffect(() => { refresh(); }, []);
  const titleOf = (id: string) => rows.find((r) => r.id === id)?.title ?? id;

  const edit = (t?: PlanTemplate) => {
    setMsg('');
    setEditing(t
      ? { id: t.id, title: t.title, description: t.description, themeWord: t.themeWord, items: (t.items ?? []).map((i) => i.id), status: t.status }
      : { id: null, title: '', description: '', themeWord: '', items: [], status: 'draft' });
  };

  const move = (i: number, dir: -1 | 1) => setEditing((e) => {
    if (!e) return e;
    const items = [...e.items];
    const j = i + dir;
    if (j < 0 || j >= items.length) return e;
    [items[i], items[j]] = [items[j], items[i]];
    return { ...e, items };
  });

  const save = async (status: 'draft' | 'published') => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.description.trim() || !editing.themeWord.trim()) {
      setMsg('Preencha título, descrição e palavra do plano.');
      return;
    }
    if (status === 'published' && editing.items.length < 3) {
      setMsg('Para publicar, o plano precisa de ao menos 3 devocionais. Como rascunho pode ter menos.');
      return;
    }
    setSaving(true);
    const r = await FamilyAdmin.saveTemplate(editing.id, { title: editing.title.trim(), description: editing.description.trim(), themeWord: editing.themeWord.trim(), items: editing.items, status });
    if (r.ok) { setEditing({ ...editing, id: r.template.id, status }); refresh(); setMsg(status === 'published' ? 'Plano publicado: as famílias já podem escolher.' : 'Plano salvo como rascunho.'); }
    else setMsg(
      r.error === 'INVALID_ITEMS' ? 'Algum devocional do plano não está publicado, ou foi repetido.'
      : r.error === 'PLAN_TOO_SHORT' ? 'Para publicar, o plano precisa de ao menos 3 devocionais.'
      : r.error === 'VALIDATION_ERROR' ? 'Confira os campos: título até 80, descrição até 400 e palavra até 30 caracteres.'
      : `Não foi possível salvar (${r.error}).`,
    );
    setSaving(false);
  };

  const remove = async () => {
    if (!editing?.id || !window.confirm('Excluir este plano? Famílias que já o usam mantêm o andamento.')) return;
    if (await FamilyAdmin.deleteTemplate(editing.id)) { setEditing(null); refresh(); }
    else setMsg('Não foi possível excluir.');
  };

  if (!editing) {
    return (
      <>
        <p className="fam-note">Planos são sequências de devocionais que uma família faz junta, um por dia.</p>
        <button type="button" className="fam-btn fam-btn--primary" onClick={() => edit()}>Novo plano</button>
        <ul className="studio__list">
          {templates.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => edit(t)}>
                <span>{t.title}<small>{t.days} dias · {t.themeWord}</small></span>
                <em className={`studio__badge studio__badge--${t.status === 'published' ? 'done' : 'draft'}`}>{t.status === 'published' ? 'Publicado' : 'Rascunho'}</em>
              </button>
            </li>
          ))}
          {templates.length === 0 && <li className="fam-note">Nenhum plano ainda. Sem plano publicado, as famílias leem só o devocional do dia.</li>}
        </ul>
      </>
    );
  }

  const available = rows.filter((r) => !editing.items.includes(r.id));
  return (
    <>
      <button type="button" className="fam-link" onClick={() => setEditing(null)}>← Planos</button>
      <div className="fam-form">
        <label>Título<input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
        <label>Descrição<textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
        <label>Palavra do plano (o que a família leva no fim)<input value={editing.themeWord} onChange={(e) => setEditing({ ...editing, themeWord: e.target.value })} /></label>
      </div>
      <h4 className="studio__title">Devocionais, na ordem ({editing.items.length} dias)</h4>
      <ol className="studio__order">
        {editing.items.map((id, i) => (
          <li key={id}>
            <span>{i + 1}. {titleOf(id)}</span>
            <span>
              <button type="button" aria-label="Subir" onClick={() => move(i, -1)}>↑</button>
              <button type="button" aria-label="Descer" onClick={() => move(i, 1)}>↓</button>
              <button type="button" aria-label="Remover" onClick={() => setEditing({ ...editing, items: editing.items.filter((x) => x !== id) })}>×</button>
            </span>
          </li>
        ))}
      </ol>
      <div className="fam-inline">
        <select value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Adicionar devocional…</option>
          {available.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <button type="button" className="fam-btn fam-btn--secondary" disabled={!pick} onClick={() => { setEditing({ ...editing, items: [...editing.items, pick] }); setPick(''); }}>Adicionar</button>
      </div>
      {msg && <p className="fam-note" role="status">{msg}</p>}
      <div className="studio__actions">
        <button type="button" className="fam-btn fam-btn--secondary" disabled={saving} onClick={() => save('draft')}>Salvar rascunho</button>
        <button type="button" className="fam-btn fam-btn--primary" disabled={saving} onClick={() => save('published')}>Publicar plano</button>
      </div>
      {editing.id && <button type="button" className="fam-btn fam-btn--danger" onClick={remove}>Excluir plano</button>}
    </>
  );
}
