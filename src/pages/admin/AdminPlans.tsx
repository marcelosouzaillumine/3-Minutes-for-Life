import { useEffect, useMemo, useState } from 'react';
import { FamilyAdmin, type PlanCategoryAdmin, type PlanTemplate } from '../../services/FamilyService';
import type { Row } from './AdminKids';
import { MediaLibraryPicker } from '../../components/admin/MediaLibraryPicker';

type Draft = { id: string | null; title: string; description: string; themeWord: string; items: string[]; status: 'draft' | 'published'; categoryId: string | null; coverUrl: string | null; partnerKeyId: string | null };
const LIMITS = { title: 80, description: 400, themeWord: 30 };
const MIN_TO_PUBLISH = 3;

const fmtDate = (iso: string) => String(iso).slice(0, 10).split('-').reverse().slice(0, 2).join('/');
const isFuture = (iso: string) => String(iso).slice(0, 10) > new Date().toISOString().slice(0, 10);

/** Planos: lista por categoria e um editor em três passos (sobre, dias, prévia) com a lista do que falta para publicar. */
export function PlansStudio({ rows }: { rows: Row[] }) {
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [cats, setCats] = useState<PlanCategoryAdmin[]>([]);
  const [filter, setFilter] = useState('all');
  const [managing, setManaging] = useState(false);
  const [catEdit, setCatEdit] = useState<{ id: string | null; name: string; description: string } | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [pickingCover, setPickingCover] = useState(false);
  const [kidsReady, setKidsReady] = useState<Record<string, number>>({});

  const refresh = () => { FamilyAdmin.templates().then(setTemplates); FamilyAdmin.categories().then(setCats); };
  useEffect(() => {
    refresh();
    FamilyAdmin.partners().then(setPartners);
    FamilyAdmin.kidsSummary().then((s) => setKidsReady(Object.fromEntries(Object.entries(s).map(([id, v]) => [id, v.published]))));
  }, []);

  const catOf = (id: string | null | undefined) => cats.find((c) => c.id === id);
  const rowOf = (id: string) => rows.find((r) => r.id === id);

  const startEdit = (t?: PlanTemplate) => {
    setMsg(''); setQuery('');
    setEditing(t
      ? { id: t.id, title: t.title, description: t.description, themeWord: t.themeWord, items: (t.items ?? []).map((i) => i.id), status: t.status, categoryId: t.categoryId ?? null, coverUrl: t.coverUrl ?? null, partnerKeyId: t.partnerKeyId ?? null }
      : { id: null, title: '', description: '', themeWord: '', items: [], status: 'draft', categoryId: filter !== 'all' ? filter : cats[0]?.id ?? null, coverUrl: null, partnerKeyId: null });
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e));
  const move = (i: number, dir: -1 | 1) => setEditing((e) => {
    if (!e) return e;
    const items = [...e.items]; const j = i + dir;
    if (j < 0 || j >= items.length) return e;
    [items[i], items[j]] = [items[j], items[i]];
    return { ...e, items };
  });

  const checks = editing && [
    { ok: !!editing.title.trim(), label: 'Título' },
    { ok: !!editing.description.trim(), label: 'Descrição' },
    { ok: !!editing.themeWord.trim(), label: 'Palavra do plano' },
    { ok: editing.items.length >= MIN_TO_PUBLISH, label: `${MIN_TO_PUBLISH} ou mais dias (${editing.items.length})` },
  ];
  const ready = !!checks && checks.every((c) => c.ok);

  const save = async (status: 'draft' | 'published') => {
    if (!editing) return;
    const textOk = editing.title.trim() && editing.description.trim() && editing.themeWord.trim();
    if (!textOk) { setMsg('Preencha título, descrição e palavra do plano. Isso vale até para o rascunho.'); return; }
    if (status === 'published' && !ready) { setMsg(`Para publicar, o plano precisa de ao menos ${MIN_TO_PUBLISH} dias.`); return; }
    setSaving(true);
    const r = await FamilyAdmin.saveTemplate(editing.id, { title: editing.title.trim(), description: editing.description.trim(), themeWord: editing.themeWord.trim(), items: editing.items, status, categoryId: editing.categoryId, coverUrl: editing.coverUrl, partnerKeyId: editing.partnerKeyId });
    if (r.ok) {
      // Mostra o que o servidor guardou, não o que enviamos: se a capa não voltou, o aviso aparece na hora.
      const keptCover = (r.template as { coverUrl?: string | null }).coverUrl ?? null;
      setEditing({ ...editing, id: r.template.id, status, coverUrl: keptCover });
      refresh();
      setMsg(
        editing.coverUrl && keptCover !== editing.coverUrl
          ? 'O plano foi salvo, mas o servidor não guardou a capa. Escolha a imagem de novo e, se repetir, avise a equipe técnica.'
          : status === 'published' ? 'Plano publicado. Já aparece para as pessoas.' : 'Rascunho salvo. Ninguém vê ainda.',
      );
    } else {
      setMsg(
        r.error === 'INVALID_PARTNER' ? 'Esse parceiro não existe mais. Escolha outro.'
        : r.error === 'INVALID_CATEGORY' ? 'Escolha uma categoria válida.'
        : r.error === 'INVALID_ITEMS' ? 'Algum devocional do plano não está publicado, ou foi repetido.'
        : r.error === 'PLAN_TOO_SHORT' ? `Para publicar, o plano precisa de ao menos ${MIN_TO_PUBLISH} dias.`
        : r.error === 'VALIDATION_ERROR' ? 'Confira os tamanhos: título até 80, descrição até 400 e palavra até 30 caracteres.'
        : `Não foi possível salvar (${r.error}).`,
      );
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!editing?.id || !window.confirm('Excluir este plano? Quem já começou mantém o andamento.')) return;
    if (await FamilyAdmin.deleteTemplate(editing.id)) { setEditing(null); refresh(); } else setMsg('Não foi possível excluir.');
  };

  const saveCategory = async () => {
    if (!catEdit) return;
    if (!catEdit.name.trim()) { setMsg('Dê um nome à categoria.'); return; }
    const cur = cats.find((c) => c.id === catEdit.id);
    const r = await FamilyAdmin.saveCategory(catEdit.id, { name: catEdit.name.trim(), description: catEdit.description.trim(), sortOrder: cur?.sortOrder ?? cats.length });
    if (r.ok) { setCatEdit(null); setMsg(''); refresh(); } else setMsg(`Não foi possível salvar (${r.error}).`);
  };
  const deleteCategory = async () => {
    if (!catEdit?.id) return;
    const r = await FamilyAdmin.deleteCategory(catEdit.id);
    if (r.ok) { setCatEdit(null); setFilter('all'); setMsg(''); refresh(); }
    else setMsg(r.error === 'CATEGORY_NOT_EMPTY' ? 'Mude os planos desta categoria para outra antes de excluir.' : `Não foi possível excluir (${r.error}).`);
  };

  const matches = useMemo(() => {
    if (!editing) return [];
    const q = query.trim().toLowerCase();
    return rows.filter((r) => !editing.items.includes(r.id) && (!q || r.title.toLowerCase().includes(q))).slice(0, 8);
  }, [rows, editing, query]);

  // ───────────── Lista ─────────────
  if (!editing) {
    const visible = templates.filter((t) => filter === 'all' || t.categoryId === filter);
    return (
      <>
        <div className="studio__bar-top">
          <p className="fam-note">Um plano é uma sequência de devocionais, um por dia. As categorias organizam os planos em Explorar, e qualquer plano publicado também pode ser escolhido pelo grupo para ler junto.</p>
          <button type="button" className="fam-btn fam-btn--primary studio__new" onClick={() => startEdit()}>Novo plano</button>
        </div>
        <div className="fam-people">
          <button type="button" className={`fam-chip${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>Todas</button>
          {cats.map((c) => <button key={c.id} type="button" className={`fam-chip${filter === c.id ? ' is-on' : ''}`} onClick={() => setFilter(c.id)}>{c.name} · {c.plans}</button>)}
          <button type="button" className="fam-link fam-link--muted" onClick={() => { setManaging(!managing); setCatEdit(null); setMsg(''); }}>{managing ? 'Fechar categorias' : 'Gerenciar categorias'}</button>
        </div>
        {managing && (
          <div className="studio__panel">
            <ul className="studio__order">
              {cats.map((c) => (
                <li key={c.id}>
                  <span>{c.name} <small>{c.plans} planos</small></span>
                  <button type="button" onClick={() => setCatEdit({ id: c.id, name: c.name, description: c.description })}>Editar</button>
                </li>
              ))}
            </ul>
            {!catEdit && <button type="button" className="fam-btn fam-btn--secondary" onClick={() => setCatEdit({ id: null, name: '', description: '' })}>Nova categoria</button>}
            {catEdit && (
              <div className="fam-form">
                <label>Nome ({catEdit.name.length}/40)<input maxLength={40} value={catEdit.name} onChange={(e) => setCatEdit({ ...catEdit, name: e.target.value })} /></label>
                <label>Frase que aparece em Explorar<input maxLength={200} value={catEdit.description} onChange={(e) => setCatEdit({ ...catEdit, description: e.target.value })} /></label>
                {msg && <p className="fam-error">{msg}</p>}
                <div className="studio__actions">
                  <button type="button" className="fam-btn fam-btn--primary" onClick={saveCategory}>Salvar categoria</button>
                  <button type="button" className="fam-btn fam-btn--ghost" onClick={() => { setCatEdit(null); setMsg(''); }}>Cancelar</button>
                  {catEdit.id && <button type="button" className="fam-btn fam-btn--danger" onClick={deleteCategory}>Excluir</button>}
                </div>
              </div>
            )}
          </div>
        )}
        {visible.length === 0 ? (
          <div className="studio__empty">
            <h4>Comece o seu primeiro plano</h4>
            <p>Escolha uma categoria, dê um título e arraste os devocionais para a ordem dos dias.</p>
            <button type="button" className="fam-btn fam-btn--primary" onClick={() => startEdit()}>Novo plano</button>
          </div>
        ) : (
          <ul className="studio__list">
            {visible.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => startEdit(t)}>
                  {t.coverUrl ? <img className="studio__mini" src={t.coverUrl} alt="" /> : <span className="studio__mini studio__mini--none">sem capa</span>}
                  <span style={{ flex: 1 }}>{t.title}<small>{t.partnerKeyId ? `Exclusivo: ${partners.find((p) => p.id === t.partnerKeyId)?.name ?? 'parceiro'}` : catOf(t.categoryId)?.name ?? 'Sem categoria'} · {t.days} dias · “{t.themeWord}”</small></span>
                  <em className={`studio__badge studio__badge--${t.status === 'published' ? 'done' : 'draft'}`}>{t.status === 'published' ? 'Publicado' : 'Rascunho'}</em>
                </button>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  // ───────────── Editor ─────────────
  const cat = catOf(editing.categoryId);
  return (
    <div className="studio__editor">
      <button type="button" className="fam-link" onClick={() => { setEditing(null); setMsg(''); }}>← Planos</button>
      <div className="studio__head">
        <h4 className="studio__title">{editing.id ? 'Editar plano' : 'Novo plano'} <em className={`studio__badge studio__badge--${editing.status === 'published' ? 'done' : 'draft'}`}>{editing.status === 'published' ? 'Publicado' : 'Rascunho'}</em></h4>
        <div className="studio__head-actions">
          {editing.status === 'published' && <button type="button" className="fam-btn fam-btn--secondary" disabled={saving} onClick={() => save('draft')}>Despublicar</button>}
          <button type="button" className="fam-btn fam-btn--primary" disabled={saving} onClick={() => save('published')}>{editing.status === 'published' ? 'Salvar alterações' : 'Publicar plano'}</button>
          <details className="studio__menu">
            <summary aria-label="Mais ações">⋯</summary>
            <div className="studio__menu-list">
              <button type="button" disabled={saving} onClick={() => save('draft')}>{editing.status === 'published' ? 'Despublicar (rascunho)' : 'Salvar rascunho'}</button>
              {editing.id && <button type="button" className="is-danger" onClick={remove}>Excluir este plano</button>}
            </div>
          </details>
        </div>
      </div>
      {msg && <p className="fam-note" role="status">{msg}</p>}

      <section className="studio__step">
        <p className="studio__step-n">1 · Sobre o plano</p>
        <div className="fam-form">
          <label>Para quem
            <select value={editing.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}>
              {!cats.some((c) => c.id === editing.categoryId) && <option value="">Escolha uma categoria…</option>}
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="fam-note">Aparece em Explorar nesta categoria e também pode ser escolhido pelo grupo para ler junto.</span>
          </label>
          <label>Quem pode ver
            <select value={editing.partnerKeyId ?? ''} onChange={(e) => set('partnerKeyId', e.target.value || null)}>
              <option value="">Todos (público)</option>
              {partners.map((p) => <option key={p.id} value={p.id}>Exclusivo: {p.name}</option>)}
            </select>
            <span className="fam-note">{editing.partnerKeyId ? 'Só este parceiro recebe o plano, pela API dele. Não aparece no app para as pessoas.' : 'Aparece no app para todas as pessoas.'}</span>
          </label>
          <div>
            <span>Capa do plano <span className="studio__count">opcional</span></span>
            <div className="studio__cover">
              {editing.coverUrl ? (
                <>
                  <img src={editing.coverUrl} alt="Capa do plano" />
                  <div className="studio__cover-bar">
                    <button type="button" className="fam-btn fam-btn--secondary" onClick={() => setPickingCover(true)}>Trocar imagem</button>
                    <button type="button" className="fam-btn fam-btn--ghost" onClick={() => set('coverUrl', null)}>Remover</button>
                  </div>
                </>
              ) : (
                <button type="button" className="studio__cover-empty" onClick={() => setPickingCover(true)}>+ Escolher imagem da biblioteca</button>
              )}
            </div>
            <span className="fam-note">Formato 16:9 funciona melhor. Sem imagem, o plano aparece só com o texto.</span>
          </div>
          <label>Título <span className="studio__count">{editing.title.length}/{LIMITS.title}</span>
            <input maxLength={LIMITS.title} placeholder="Sete dias de descanso" value={editing.title} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label>Descrição <span className="studio__count">{editing.description.length}/{LIMITS.description}</span>
            <textarea rows={3} maxLength={LIMITS.description} placeholder="Uma ou duas frases sobre o que a pessoa vai viver nesta trilha." value={editing.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <label>Palavra do plano <span className="studio__count">{editing.themeWord.length}/{LIMITS.themeWord}</span>
            <input maxLength={LIMITS.themeWord} placeholder="Descanso" value={editing.themeWord} onChange={(e) => set('themeWord', e.target.value)} />
            <span className="fam-note">Uma palavra só. É o que a pessoa leva no fim do plano.</span>
          </label>
        </div>
      </section>

      <section className="studio__step">
        <p className="studio__step-n">2 · Os dias <span className="studio__count">{editing.items.length} {editing.items.length === 1 ? 'dia' : 'dias'}</span></p>
        {editing.items.length === 0 && <p className="fam-note">Nenhum dia ainda. Busque abaixo e toque para adicionar. A ordem é a ordem de leitura.</p>}
        <ol className="studio__order studio__order--days">
          {editing.items.map((id, i) => {
            const r = rowOf(id);
            return (
              <li key={id}>
                <span className="studio__day-n">{i + 1}</span>
                <span className="studio__day-t">{r?.title ?? id}{r && isFuture(r.publicationDate) && <em className="studio__badge studio__badge--draft">agendado {fmtDate(r.publicationDate)}</em>}{(kidsReady[id] ?? 0) >= 3 && <em className="studio__badge studio__badge--done">crianças</em>}</span>
                <span className="studio__day-actions">
                  <button type="button" aria-label="Subir" onClick={() => move(i, -1)}>↑</button>
                  <button type="button" aria-label="Descer" onClick={() => move(i, 1)}>↓</button>
                  <button type="button" aria-label="Remover" onClick={() => set('items', editing.items.filter((x) => x !== id))}>×</button>
                </span>
              </li>
            );
          })}
        </ol>
        <input className="studio__search" type="search" placeholder="Buscar devocional para adicionar…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <ul className="studio__results">
          {matches.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => { set('items', [...editing.items, r.id]); setQuery(''); }}>
                <span>+ {r.title}</span>
                <small>{isFuture(r.publicationDate) ? `agendado ${fmtDate(r.publicationDate)}` : fmtDate(r.publicationDate)}{(kidsReady[r.id] ?? 0) >= 3 ? ' · crianças ✓' : ''}</small>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="fam-note">Nenhum devocional encontrado.</li>}
        </ul>
      </section>

      <section className="studio__step">
        <p className="studio__step-n">3 · Como vai aparecer</p>
        <div className="studio__screen studio__preview">
          {editing.coverUrl && <img src={editing.coverUrl} alt="" />}
          <p className="fam-eyebrow fam-eyebrow--accent">{cat?.name ?? ''}</p>
          <h4 className="studio__title">{editing.title || 'Título do plano'}</h4>
          <p>{editing.description || 'A descrição aparece aqui.'}</p>
          <div className="fam-dots">{(editing.items.length ? editing.items : [1, 2, 3]).map((_, i) => <span key={i} className={`fam-dot${i === 0 ? ' is-now' : ''}`} />)}</div>
          <p className="fam-note">{editing.items.length || '…'} dias · palavra: {editing.themeWord || '…'}</p>
        </div>
      </section>

      {pickingCover && <MediaLibraryPicker onSelect={(url) => { set('coverUrl', url); setPickingCover(false); }} onClose={() => setPickingCover(false)} />}

      <div className="studio__savebar">
        <ul className="studio__checks" aria-label="O que falta para publicar">
          {checks!.map((c) => <li key={c.label} className={c.ok ? 'is-ok' : ''}>{c.ok ? '✓' : '○'} {c.label}</li>)}
        </ul>
        {msg && <p className="fam-note" role="status">{msg}</p>}
        <div className="studio__actions">
          <button type="button" className="fam-btn fam-btn--secondary" disabled={saving} onClick={() => save('draft')}>{editing.status === 'published' ? 'Despublicar (rascunho)' : 'Salvar rascunho'}</button>
          <button type="button" className="fam-btn fam-btn--primary" disabled={saving} onClick={() => save('published')}>{editing.status === 'published' ? 'Salvar alterações' : 'Publicar plano'}</button>
        </div>
        {editing.id && <div className="studio__danger"><button type="button" className="fam-link fam-link--muted" onClick={remove}>Excluir este plano</button></div>}
      </div>
    </div>
  );
}
