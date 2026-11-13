import { useEffect, useMemo, useState } from 'react';
import { illumineFetch } from '../../lib/illumine';
import {
  TOTAL_BIBLE_VERSES,
  buildCuration,
  formatDatePtBr,
  type CurationDevotional,
} from '../../lib/bible';
import '../../styles/admin-users.css';
import '../../styles/admin-curation.css';

type Tab = 'versiculos' | 'livros';
type Testament = 'todos' | 'AT' | 'NT';
type BookSort = 'biblia' | 'devocionais' | 'percentual';

const pct = (n: number) => `${n.toFixed(n > 0 && n < 10 ? 1 : 0).replace('.', ',')}%`;

export function AdminCuration() {
  const [devos, setDevos] = useState<CurationDevotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('versiculos');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [testament, setTestament] = useState<Testament>('todos');
  const [onlyRepeated, setOnlyRepeated] = useState(false);
  const [bookSort, setBookSort] = useState<BookSort>('biblia');
  const [openBooks, setOpenBooks] = useState<Set<string>>(new Set());
  const [closedTestaments, setClosedTestaments] = useState<Set<string>>(new Set());
  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  };

  useEffect(() => {
    (async () => {
      try {
        const [dRes, cRes] = await Promise.all([
          illumineFetch('/devotionals?status=published&perPage=500'),
          illumineFetch('/devotionals/categories').catch(() => null),
        ]);
        if (!dRes.ok) throw new Error(String(dRes.status));
        const body = await dRes.json();
        const cats = cRes && cRes.ok ? await cRes.json().catch(() => []) : [];
        const catName = new Map<string, string>((Array.isArray(cats) ? cats : []).map((c: any) => [c.id, c.name]));
        setDevos(
          (body.devotionals ?? []).map((d: any): CurationDevotional => ({
            id: d.id,
            title: d.title ?? '(sem título)',
            publicationDate: d.publicationDate ? String(d.publicationDate).slice(0, 10) : null,
            category: d.category?.name ?? (d.categoryId ? catName.get(d.categoryId) ?? null : null),
            scriptureReference: d.scriptureReference ?? null,
          })),
        );
      } catch {
        setError('Não foi possível carregar os devocionais publicados.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const report = useMemo(() => buildCuration(devos), [devos]);
  const categories = useMemo(
    () => [...new Set(devos.map((d) => d.category).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [devos],
  );

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      report.groups.filter((g) => {
        if (onlyRepeated && g.devotionals.length < 2) return false;
        if (testament !== 'todos' && !report.books.find((b) => b.book.id === g.bookId && b.book.testament === testament)) return false;
        const ds = category ? g.devotionals.filter((d) => d.category === category) : g.devotionals;
        if (!ds.length) return false;
        if (!q) return true;
        return g.label.toLowerCase().includes(q) || ds.some((d) => d.title.toLowerCase().includes(q));
      }),
    [report, q, category, testament, onlyRepeated],
  );

  const testaments = useMemo(
    () =>
      (['AT', 'NT'] as const).map((t) => {
        let list = report.books.filter((b) => b.book.testament === t);
        const total = list.reduce((s, b) => s + b.book.verses, 0);
        const worked = list.reduce((s, b) => s + b.workedVerses, 0);
        const touched = list.filter((b) => b.devotionalCount > 0).length;
        const count = list.length;
        if (bookSort === 'devocionais') list = [...list].sort((a, b) => b.devotionalCount - a.devotionalCount);
        if (bookSort === 'percentual') list = [...list].sort((a, b) => b.percent - a.percent);
        return {
          id: t,
          name: t === 'AT' ? 'Antigo Testamento' : 'Novo Testamento',
          list, total, worked, touched, count,
          percent: (worked / total) * 100,
        };
      }),
    [report, bookSort],
  );

  const untouched = report.books.filter((b) => b.devotionalCount === 0);
  const totalPct = (report.totalWorkedVerses / TOTAL_BIBLE_VERSES) * 100;
  const repeatedCount = report.groups.filter((g) => g.devotionals.length > 1).length;

  if (loading) {
    return (
      <div className="admin-loading-state" style={{ minHeight: '200px' }}>
        <div className="admin-spinner"></div>
      </div>
    );
  }

  const filtersActive = !!(query || category || onlyRepeated || testament !== 'todos');
  const clearAll = () => { setQuery(''); setCategory(''); setOnlyRepeated(false); setTestament('todos'); };

  return (
    <div className="au cur">
      <div className="admin-header">
        <div>
          <h1>Curadoria de versículos</h1>
          <p>Versículos já trabalhados nos devocionais publicados, repetições e a cobertura de cada livro da Bíblia.</p>
        </div>
      </div>

      {error && <div className="admin-error-state"><p>{error}</p></div>}

      <div className="admin-grid">
        <div className="admin-card"><div className="admin-card-title">Devocionais publicados</div><div className="admin-card-value">{devos.length}</div></div>
        <div className="admin-card"><div className="admin-card-title">Referências distintas</div><div className="admin-card-value">{report.groups.length}</div></div>
        <div className="admin-card"><div className="admin-card-title">Livros trabalhados</div><div className="admin-card-value">{report.booksTouched}<small>de 66</small></div></div>
        <div className="admin-card"><div className="admin-card-title">Versículos da Bíblia</div><div className="admin-card-value">{report.totalWorkedVerses.toLocaleString('pt-BR')}<small>{pct(totalPct)} do total</small></div></div>
        <div className="admin-card"><div className="admin-card-title">Versículos repetidos</div><div className="admin-card-value">{repeatedCount}</div></div>
      </div>

      <div className="au-filters">
        <div className="au-group">
          <span className="au-group__label">Ver por</span>
          <div className="au-chips">
            <button type="button" className="au-chip" aria-pressed={tab === 'versiculos'} onClick={() => setTab('versiculos')}>Versículos</button>
            <button type="button" className="au-chip" aria-pressed={tab === 'livros'} onClick={() => setTab('livros')}>Livros da Bíblia</button>
          </div>
        </div>

        {tab === 'versiculos' ? (
          <>
            <div className="au-search">
              <input type="search" aria-label="Buscar versículo ou título" placeholder="Buscar por versículo ou título…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className="cur-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria">
                <option value="">Todas as categorias</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="au-group">
              <span className="au-group__label">Testamento</span>
              <div className="au-chips">
                {([['todos', 'Todos'], ['AT', 'Antigo'], ['NT', 'Novo']] as const).map(([k, l]) => (
                  <button key={k} type="button" className="au-chip" aria-pressed={testament === k} onClick={() => setTestament(k)}>{l}</button>
                ))}
                <button type="button" className="au-chip" aria-pressed={onlyRepeated} onClick={() => setOnlyRepeated(!onlyRepeated)}>Só repetidos</button>
              </div>
            </div>
            <div className="au-bar">
              <span className="au-bar__count">{groups.length} {groups.length === 1 ? 'versículo' : 'versículos'}</span>
              {filtersActive && <button type="button" className="au-btn" onClick={clearAll}>Limpar filtros</button>}
            </div>
          </>
        ) : (
          <>
            <div className="au-group">
              <span className="au-group__label">Ordenar</span>
              <div className="au-chips">
                {([['biblia', 'Ordem da Bíblia'], ['devocionais', 'Mais devocionais'], ['percentual', 'Maior percentual']] as const).map(([k, l]) => (
                  <button key={k} type="button" className="au-chip" aria-pressed={bookSort === k} onClick={() => setBookSort(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="au-bar">
              <span className="au-bar__count">{report.booksTouched} de 66 livros com devocional</span>
              <button type="button" className="au-btn" onClick={() => { setClosedTestaments(new Set()); setOpenBooks(new Set(report.books.filter((b) => b.devotionalCount > 0).map((b) => b.book.id))); }}>Expandir tudo</button>
              <button type="button" className="au-btn" onClick={() => { setClosedTestaments(new Set()); setOpenBooks(new Set()); }}>Recolher livros</button>
            </div>
          </>
        )}
      </div>

      {tab === 'versiculos' && (
        <div className="admin-table-responsive au-table-wrap">
          <table className="au-table">
            <thead><tr><th>Versículo</th><th>Devocionais publicados</th></tr></thead>
            <tbody>
              {groups.map((g) => {
                const ds = category ? g.devotionals.filter((d) => d.category === category) : g.devotionals;
                return (
                  <tr key={g.key}>
                    <td className="cur-ref" data-label="Versículo">
                      <div className="au-name">{g.label}</div>
                      {g.devotionals.length > 1 && <span className="au-tag au-tag--warn">{g.devotionals.length}× usado</span>}
                      {g.overlaps.length > 0 && <div className="au-email cur-overlap">Sobrepõe: {g.overlaps.join(' · ')}</div>}
                    </td>
                    <td data-label="Devocionais">
                      <ul className="cur-list">
                        {ds.map((d) => (
                          <li key={d.id}>
                            <div className="au-name cur-title">{d.title}</div>
                            <div className="au-email">{formatDatePtBr(d.publicationDate)} · {d.category ?? 'sem categoria'}</div>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                );
              })}
              {!groups.length && <tr><td colSpan={2} className="au-muted" style={{ textAlign: 'center' }}>Nenhum versículo encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'livros' && (
        <>
          {testaments.map((t) => {
            const tOpen = !closedTestaments.has(t.id);
            return (
              <section key={t.id} className="cur-testament">
                <button type="button" className="cur-thead" aria-expanded={tOpen} onClick={() => setClosedTestaments(toggle(closedTestaments, t.id))}>
                  <span className={`cur-chev ${tOpen ? 'open' : ''}`} aria-hidden="true">›</span>
                  <span className="cur-thead-name">{t.name}</span>
                  <span className="cur-bar" aria-hidden="true"><span style={{ width: `${Math.max(t.percent, t.worked ? 1.5 : 0)}%` }} /></span>
                  <span className="cur-nums">{t.touched} de {t.count} livros · {t.worked.toLocaleString('pt-BR')}/{t.total.toLocaleString('pt-BR')} versículos · <strong>{pct(t.percent)}</strong></span>
                </button>
                {tOpen && (
                  <ul className="cur-books">
                    {t.list.map((b) => {
                      const open = openBooks.has(b.book.id);
                      const empty = b.devotionalCount === 0;
                      return (
                        <li key={b.book.id}>
                          <button type="button" className="cur-book" disabled={empty} onClick={() => setOpenBooks(toggle(openBooks, b.book.id))} aria-expanded={open}>
                            <span className={`cur-chev ${open ? 'open' : ''}`} aria-hidden="true">{empty ? '' : '›'}</span>
                            <span className="cur-book-name">{b.book.name}</span>
                            <span className="cur-bar" aria-hidden="true"><span style={{ width: `${Math.max(b.percent, b.devotionalCount ? 1.5 : 0)}%` }} /></span>
                            <span className="cur-nums">
                              {empty ? 'sem devocional' : <>{b.workedVerses}/{b.book.verses} versículos · <strong>{pct(b.percent)}</strong> · {b.devotionalCount} {b.devotionalCount === 1 ? 'devocional' : 'devocionais'}</>}
                            </span>
                          </button>
                          {open && (
                            <div className="cur-book-detail">
                              {b.workedChapters > 0 && <p className="au-muted cur-note">{b.workedChapters} capítulo(s) citado(s) inteiro(s), sem contagem de versículos.</p>}
                              {b.approximate && <p className="au-muted cur-note">Há trecho que atravessa capítulos; só as pontas foram contadas.</p>}
                              <ul className="cur-list">
                                {b.groups.map((g) => (
                                  <li key={g.key}>
                                    <div className="au-name">{g.label} {g.devotionals.length > 1 && <span className="au-tag au-tag--warn">{g.devotionals.length}× usado</span>}</div>
                                    {g.devotionals.map((d) => (
                                      <div key={d.id} className="au-email">{d.title} — {formatDatePtBr(d.publicationDate)} · {d.category ?? 'sem categoria'}</div>
                                    ))}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
          <p className="au-muted cur-note"><strong>Ainda sem devocional ({untouched.length}):</strong> {untouched.map((b) => b.book.name).join(', ') || 'nenhum'}.</p>
        </>
      )}

      {report.unrecognized.length > 0 && (
        <details className="cur-unrec">
          <summary>{report.unrecognized.length} devocional(is) com referência não reconhecida</summary>
          <ul className="cur-list">
            {report.unrecognized.map(({ devotional: d, reasons }) => (
              <li key={d.id}><div className="au-name">{d.title}</div><div className="au-email">“{reasons.join('; ')}”</div></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
