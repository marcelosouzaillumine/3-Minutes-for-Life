/**
 * Cânon protestante (66 livros) com o total de versículos de cada um e um
 * interpretador de referências em português ("João 3:16-18", "1 Co 13:4-7; Fp 4:6").
 * Usado pela curadoria de versículos do admin.
 */

export interface BibleBook {
  id: string;
  name: string;
  testament: 'AT' | 'NT';
  verses: number;
  aliases: string[];
}

// [id, nome, testamento, total de versículos, apelidos (sem acento, minúsculos)]
const RAW: Array<[string, string, 'AT' | 'NT', number, string[]]> = [
  ['gn', 'Gênesis', 'AT', 1533, ['genesis', 'gn', 'gen']],
  ['ex', 'Êxodo', 'AT', 1213, ['exodo', 'ex', 'exo']],
  ['lv', 'Levítico', 'AT', 859, ['levitico', 'lv', 'lev']],
  ['nm', 'Números', 'AT', 1288, ['numeros', 'nm', 'num']],
  ['dt', 'Deuteronômio', 'AT', 959, ['deuteronomio', 'dt', 'deut']],
  ['js', 'Josué', 'AT', 658, ['josue', 'js', 'jos']],
  ['jz', 'Juízes', 'AT', 618, ['juizes', 'jz', 'jui']],
  ['rt', 'Rute', 'AT', 85, ['rute', 'rt']],
  ['1sm', '1 Samuel', 'AT', 810, ['1 samuel', '1 sm', '1sm', '1 sam']],
  ['2sm', '2 Samuel', 'AT', 695, ['2 samuel', '2 sm', '2sm', '2 sam']],
  ['1rs', '1 Reis', 'AT', 816, ['1 reis', '1 rs', '1rs']],
  ['2rs', '2 Reis', 'AT', 719, ['2 reis', '2 rs', '2rs']],
  ['1cr', '1 Crônicas', 'AT', 942, ['1 cronicas', '1 cr', '1cr']],
  ['2cr', '2 Crônicas', 'AT', 822, ['2 cronicas', '2 cr', '2cr']],
  ['ed', 'Esdras', 'AT', 280, ['esdras', 'ed', 'esd']],
  ['ne', 'Neemias', 'AT', 406, ['neemias', 'ne', 'nee']],
  ['et', 'Ester', 'AT', 167, ['ester', 'et', 'est']],
  ['jo_b', 'Jó', 'AT', 1070, ['job', 'jo b']],
  ['sl', 'Salmos', 'AT', 2461, ['salmos', 'salmo', 'sl', 'sal']],
  ['pv', 'Provérbios', 'AT', 915, ['proverbios', 'pv', 'pr', 'prov']],
  ['ec', 'Eclesiastes', 'AT', 222, ['eclesiastes', 'ec', 'ecl']],
  ['ct', 'Cantares de Salomão', 'AT', 117, ['cantares', 'cantares de salomao', 'cantico dos canticos', 'canticos', 'ct', 'cant']],
  ['is', 'Isaías', 'AT', 1292, ['isaias', 'is']],
  ['jr', 'Jeremias', 'AT', 1364, ['jeremias', 'jr', 'jer']],
  ['lm', 'Lamentações', 'AT', 154, ['lamentacoes', 'lm', 'lam']],
  ['ez', 'Ezequiel', 'AT', 1273, ['ezequiel', 'ez', 'eze']],
  ['dn', 'Daniel', 'AT', 357, ['daniel', 'dn', 'dan']],
  ['os', 'Oséias', 'AT', 197, ['oseias', 'os']],
  ['jl', 'Joel', 'AT', 73, ['joel', 'jl']],
  ['am', 'Amós', 'AT', 146, ['amos', 'am']],
  ['ob', 'Obadias', 'AT', 21, ['obadias', 'ob']],
  ['jn', 'Jonas', 'AT', 48, ['jonas', 'jn']],
  ['mq', 'Miquéias', 'AT', 105, ['miqueias', 'mq', 'miq']],
  ['na', 'Naum', 'AT', 47, ['naum', 'na']],
  ['hc', 'Habacuque', 'AT', 56, ['habacuque', 'hc', 'hab']],
  ['sf', 'Sofonias', 'AT', 53, ['sofonias', 'sf', 'sof']],
  ['ag', 'Ageu', 'AT', 38, ['ageu', 'ag']],
  ['zc', 'Zacarias', 'AT', 211, ['zacarias', 'zc', 'zac']],
  ['ml', 'Malaquias', 'AT', 55, ['malaquias', 'ml', 'mal']],
  ['mt', 'Mateus', 'NT', 1071, ['mateus', 'mt', 'mat']],
  ['mc', 'Marcos', 'NT', 678, ['marcos', 'mc', 'mar']],
  ['lc', 'Lucas', 'NT', 1151, ['lucas', 'lc', 'luc']],
  ['jo', 'João', 'NT', 879, ['joao', 'jo']],
  ['at', 'Atos', 'NT', 1007, ['atos', 'at', 'atos dos apostolos']],
  ['rm', 'Romanos', 'NT', 433, ['romanos', 'rm', 'rom']],
  ['1co', '1 Coríntios', 'NT', 437, ['1 corintios', '1 co', '1co', '1 cor']],
  ['2co', '2 Coríntios', 'NT', 257, ['2 corintios', '2 co', '2co', '2 cor']],
  ['gl', 'Gálatas', 'NT', 149, ['galatas', 'gl', 'gal']],
  ['ef', 'Efésios', 'NT', 155, ['efesios', 'ef']],
  ['fp', 'Filipenses', 'NT', 104, ['filipenses', 'fp', 'fil']],
  ['cl', 'Colossenses', 'NT', 95, ['colossenses', 'cl', 'col']],
  ['1ts', '1 Tessalonicenses', 'NT', 89, ['1 tessalonicenses', '1 ts', '1ts', '1 tes']],
  ['2ts', '2 Tessalonicenses', 'NT', 47, ['2 tessalonicenses', '2 ts', '2ts', '2 tes']],
  ['1tm', '1 Timóteo', 'NT', 113, ['1 timoteo', '1 tm', '1tm', '1 tim']],
  ['2tm', '2 Timóteo', 'NT', 83, ['2 timoteo', '2 tm', '2tm', '2 tim']],
  ['tt', 'Tito', 'NT', 46, ['tito', 'tt']],
  ['fm', 'Filemom', 'NT', 25, ['filemom', 'fm', 'filemon']],
  ['hb', 'Hebreus', 'NT', 303, ['hebreus', 'hb', 'heb']],
  ['tg', 'Tiago', 'NT', 108, ['tiago', 'tg']],
  ['1pe', '1 Pedro', 'NT', 105, ['1 pedro', '1 pe', '1pe', '1 ped']],
  ['2pe', '2 Pedro', 'NT', 61, ['2 pedro', '2 pe', '2pe', '2 ped']],
  ['1jo', '1 João', 'NT', 105, ['1 joao', '1 jo', '1jo']],
  ['2jo', '2 João', 'NT', 13, ['2 joao', '2 jo', '2jo']],
  ['3jo', '3 João', 'NT', 14, ['3 joao', '3 jo', '3jo']],
  ['jd', 'Judas', 'NT', 25, ['judas', 'jd']],
  ['ap', 'Apocalipse', 'NT', 404, ['apocalipse', 'ap', 'apoc']],
];

export const BIBLE_BOOKS: BibleBook[] = RAW.map(([id, name, testament, verses, aliases]) => ({
  id, name, testament, verses, aliases,
}));

export const TOTAL_BIBLE_VERSES = BIBLE_BOOKS.reduce((s, b) => s + b.verses, 0);

const BOOK_BY_ID = new Map(BIBLE_BOOKS.map((b) => [b.id, b]));
const BOOK_ORDER = new Map(BIBLE_BOOKS.map((b, i) => [b.id, i]));
const ALIAS = new Map<string, string>();
for (const b of BIBLE_BOOKS) for (const a of b.aliases) ALIAS.set(a, b.id);

export const getBook = (id: string) => BOOK_BY_ID.get(id);
export const bookOrder = (id: string) => BOOK_ORDER.get(id) ?? 999;

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Normaliza o nome de um livro ("I Coríntios", "1º Co.", "Cântico dos Cânticos") e devolve o id. */
export function resolveBook(raw: string): string | null {
  // "Jó" (com acento) é o livro de Jó; sem acento, "Jo" é a abreviação de João.
  if (/^\s*jó\.?\s*$/i.test(raw)) return 'jo_b';
  let s = stripAccents(raw.toLowerCase()).replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(iii|ii|i)\s+/, (m) => ({ 'iii ': '3 ', 'ii ': '2 ', 'i ': '1 ' } as Record<string, string>)[m] ?? m);
  s = s.replace(/^primeir[ao]\s+/, '1 ').replace(/^segund[ao]\s+/, '2 ').replace(/^terceir[ao]\s+/, '3 ');
  s = s.replace(/^([123])\s*(?:º|°|ª|o|a)\s*/, '$1 ');
  s = s.replace(/^([123])(?=[a-z])/, '$1 ');
  s = s.replace(/^livro d[eao]s?\s+/, '');
  return ALIAS.get(s) ?? null;
}

export interface ParsedPassage {
  bookId: string;
  /** Versículos explícitos: "capítulo:versículo". */
  verses: string[];
  /** Capítulos citados inteiros (sem versículos, ex.: "Salmo 23"). */
  chapters: number[];
  /** Houve intervalo entre capítulos; só as pontas foram contadas. */
  approximate: boolean;
  /** Rótulo canônico, ex.: "João 3:16-18". */
  label: string;
}

export interface ParsedReference {
  passages: ParsedPassage[];
  /** Trechos que não deu para entender. */
  unrecognized: string[];
}

function formatItems(items: Array<{ c: number; from: number; to: number }>): string {
  const parts: string[] = [];
  let lastC = -1;
  let cur = '';
  for (const it of items) {
    const range = it.from === it.to ? `${it.from}` : `${it.from}-${it.to}`;
    if (it.c === lastC) cur += `,${range}`;
    else {
      if (cur) parts.push(cur);
      cur = `${it.c}:${range}`;
      lastC = it.c;
    }
  }
  if (cur) parts.push(cur);
  return parts.join('; ');
}

function parseSegment(rest: string, bookId: string): ParsedPassage | null {
  let r = rest.replace(/\([^)]*\)/g, '').replace(/(\d)[a-z]+/g, '$1').replace(/[–—]/g, '-').replace(/\s+/g, '').replace(/[^\d:.,;-]/g, '');
  if (!r) return null;
  // "Jo 3.16" ou "Jo 3,16" (ponto ou vírgula como separador de capítulo e versículo)
  if (!r.includes(':') && /^\d+[.,]\d/.test(r)) r = r.replace(/[.,]/, ':');
  const book = BOOK_BY_ID.get(bookId)!;
  const verses: string[] = [];
  const chapters: number[] = [];
  let approximate = false;
  const labelItems: Array<{ c: number; from: number; to: number }> = [];

  if (!r.includes(':')) {
    const m = r.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (b < a || b - a > 150) return null;
    for (let c = a; c <= b; c++) chapters.push(c);
    return { bookId, verses, chapters, approximate, label: `${book.name} ${a === b ? a : `${a}-${b}`}` };
  }

  let chapter = 0;
  for (const item of r.replace(/\./g, ',').split(',').filter(Boolean)) {
    let m = item.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
    if (m) {
      const [c1, v1, c2, v2] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
      verses.push(`${c1}:${v1}`, `${c2}:${v2}`);
      approximate = true;
      labelItems.push({ c: c1, from: v1, to: v1 });
      chapter = c2;
      labelItems.push({ c: c2, from: v2, to: v2 });
      continue;
    }
    m = item.match(/^(\d+):(\d+)(?:-(\d+))?$/);
    if (m) {
      chapter = Number(m[1]);
      const a = Number(m[2]);
      const b = m[3] ? Number(m[3]) : a;
      if (b < a || b - a > 200) return null;
      for (let v = a; v <= b; v++) verses.push(`${chapter}:${v}`);
      labelItems.push({ c: chapter, from: a, to: b });
      continue;
    }
    m = item.match(/^(\d+)(?:-(\d+))?$/);
    if (m && chapter) {
      const a = Number(m[1]);
      const b = m[2] ? Number(m[2]) : a;
      if (b < a || b - a > 200) return null;
      for (let v = a; v <= b; v++) verses.push(`${chapter}:${v}`);
      labelItems.push({ c: chapter, from: a, to: b });
      continue;
    }
    return null;
  }
  if (!verses.length) return null;
  return { bookId, verses, chapters, approximate, label: `${book.name} ${formatItems(labelItems)}` };
}

/** Interpreta uma referência como "João 3:16", "Sl 23", "Rm 8:28-30; Fp 4:6" ou "Mt 5:3-7:29". */
export function parseReference(input: string | null | undefined): ParsedReference {
  const out: ParsedReference = { passages: [], unrecognized: [] };
  const text = (input ?? '').trim();
  if (!text) return out;
  let prevBook: string | null = null;

  for (const rawSeg of text.split(';')) {
    const seg = rawSeg.trim();
    if (!seg) continue;
    const m = seg.match(/^([1-3iIºª°.\s]*[A-Za-zÀ-ÿ]+(?:\s+d[aeo]s?\s+[A-Za-zÀ-ÿ]+|\s+[A-Za-zÀ-ÿ]+)*)\.?\s*(\d.*)?$/);
    let bookId: string | null = null;
    let rest = '';
    if (m) {
      // "1 João 3:16": o número inicial entra no nome do livro; o regex acima o deixa em m[1].
      bookId = resolveBook(m[1]);
      rest = m[2] ?? '';
      // Livros com número, como "1 Co 13": o dígito inicial pode ter ido para o resto.
    }
    if (!bookId) {
      const m2 = seg.match(/^([123]\s*[ºª°.]?\s*[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*)\.?\s*(\d.*)?$/);
      if (m2) {
        bookId = resolveBook(m2[1]);
        rest = m2[2] ?? '';
      }
    }
    if (!bookId && prevBook && /^\d/.test(seg)) {
      bookId = prevBook;
      rest = seg;
    }
    if (!bookId) {
      out.unrecognized.push(seg);
      continue;
    }
    prevBook = bookId;
    const p = parseSegment(rest, bookId);
    if (!p) out.unrecognized.push(seg);
    else out.passages.push(p);
  }
  return out;
}

export interface CurationDevotional {
  id: string;
  title: string;
  publicationDate: string | null;
  category: string | null;
  scriptureReference: string | null;
}

export interface VerseGroup {
  key: string;
  bookId: string;
  label: string;
  /** Primeiro capítulo:versículo, para ordenar. */
  sort: [number, number];
  devotionals: CurationDevotional[];
  overlaps: string[];
}

export interface BookStat {
  book: BibleBook;
  workedVerses: number;
  workedChapters: number;
  percent: number;
  devotionalCount: number;
  groups: VerseGroup[];
  approximate: boolean;
}

export interface CurationReport {
  groups: VerseGroup[];
  books: BookStat[];
  unrecognized: Array<{ devotional: CurationDevotional; reasons: string[] }>;
  totalWorkedVerses: number;
  booksTouched: number;
}

function firstPos(p: ParsedPassage): [number, number] {
  if (p.verses.length) {
    const [c, v] = p.verses[0].split(':').map(Number);
    return [c, v];
  }
  return [p.chapters[0] ?? 0, 0];
}

/** Agrupa os devocionais por referência e calcula a cobertura de cada livro. */
export function buildCuration(devotionals: CurationDevotional[]): CurationReport {
  const groups = new Map<string, VerseGroup & { verseSet: Set<string> }>();
  const unrecognized: CurationReport['unrecognized'] = [];
  const verseSets = new Map<string, Set<string>>(); // bookId -> versículos distintos
  const chapterSets = new Map<string, Set<number>>();
  const devosByBook = new Map<string, Set<string>>();
  const approxBooks = new Set<string>();

  for (const d of devotionals) {
    const parsed = parseReference(d.scriptureReference);
    if (!parsed.passages.length || parsed.unrecognized.length) {
      unrecognized.push({
        devotional: d,
        reasons: parsed.passages.length ? parsed.unrecognized : [d.scriptureReference?.trim() || 'sem referência'],
      });
    }
    for (const p of parsed.passages) {
      const key = `${p.bookId}|${p.label}`;
      let g = groups.get(key);
      if (!g) {
        g = { key, bookId: p.bookId, label: p.label, sort: firstPos(p), devotionals: [], overlaps: [], verseSet: new Set(p.verses) };
        groups.set(key, g);
      }
      if (!g.devotionals.some((x) => x.id === d.id)) g.devotionals.push(d);

      const vs = verseSets.get(p.bookId) ?? new Set<string>();
      p.verses.forEach((v) => vs.add(v));
      verseSets.set(p.bookId, vs);
      const cs = chapterSets.get(p.bookId) ?? new Set<number>();
      p.chapters.forEach((c) => cs.add(c));
      chapterSets.set(p.bookId, cs);
      const ds = devosByBook.get(p.bookId) ?? new Set<string>();
      ds.add(d.id);
      devosByBook.set(p.bookId, ds);
      if (p.approximate) approxBooks.add(p.bookId);
    }
  }

  const all = [...groups.values()];
  const byBook = new Map<string, typeof all>();
  for (const g of all) byBook.set(g.bookId, [...(byBook.get(g.bookId) ?? []), g]);

  // Referências diferentes que compartilham versículos (ex.: "João 3:16" e "João 3:16-18").
  for (const list of byBook.values()) {
    for (const a of list) {
      for (const b of list) {
        if (a === b) continue;
        if ([...a.verseSet].some((v) => b.verseSet.has(v))) a.overlaps.push(b.label);
      }
    }
  }

  const sorted = all
    .sort((a, b) => bookOrder(a.bookId) - bookOrder(b.bookId) || a.sort[0] - b.sort[0] || a.sort[1] - b.sort[1])
    .map(({ verseSet: _verseSet, ...g }) => {
      g.devotionals.sort((x, y) => String(x.publicationDate ?? '').localeCompare(String(y.publicationDate ?? '')));
      return g as VerseGroup;
    });

  const books: BookStat[] = BIBLE_BOOKS.map((book) => {
    const worked = verseSets.get(book.id)?.size ?? 0;
    return {
      book,
      workedVerses: worked,
      workedChapters: chapterSets.get(book.id)?.size ?? 0,
      percent: Math.min(100, (worked / book.verses) * 100),
      devotionalCount: devosByBook.get(book.id)?.size ?? 0,
      groups: sorted.filter((g) => g.bookId === book.id),
      approximate: approxBooks.has(book.id),
    };
  });

  return {
    groups: sorted,
    books,
    unrecognized,
    totalWorkedVerses: books.reduce((s, b) => s + b.workedVerses, 0),
    booksTouched: books.filter((b) => b.devotionalCount > 0).length,
  };
}

export function formatDatePtBr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso);
}
