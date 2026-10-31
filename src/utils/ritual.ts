import type { Band, KidsVersion } from '../services/FamilyService';

/** Momentos da mesa: ler, conversar, fazer, orar. 'talk' vira uma tela por pergunta. */
export const RITUAL_STEPS = ['welcome', 'read', 'talk', 'do', 'pray', 'done'] as const;
export type RitualStep = (typeof RITUAL_STEPS)[number];

export interface GuideParts {
  /** Como conduzir a leitura (só para o adulto). */
  lead: string;
  questions: string[];
  activity: string;
  prayer: string;
}

const isHeader = (para: string) => {
  const first = para.split(/\r?\n/)[0].trim();
  return first.length > 0 && first.length <= 60 && first.endsWith(':');
};

/**
 * Separa o guia do adulto em blocos. O formato do editorial é fixo e nesta ordem: como conduzir,
 * "Para conversar à mesa:", "Atividade em família:", "Oração em família:". Como o texto existe em
 * vários idiomas, reconhece os blocos pela ordem dos títulos (linha curta terminada em ":"), não
 * pelas palavras. Se não houver os três títulos, devolve null e o app mostra o guia inteiro.
 */
export function parseGuide(text: string | null | undefined): GuideParts | null {
  const paras = (text ?? '').split(/(?:\r?\n\s*){2,}/).map((p) => p.trim()).filter(Boolean);
  const headerAt = paras.map((p, i) => (isHeader(p) ? i : -1)).filter((i) => i >= 0);
  if (headerAt.length < 3) return null;
  const [h1, h2, h3] = headerAt;
  // Texto do bloco: o que vem depois do título (na mesma linha de parágrafo ou nos seguintes).
  const body = (from: number, to: number) => {
    const first = paras[from].split(/\r?\n/).slice(1).join('\n');
    return [first, ...paras.slice(from + 1, to)].filter((x) => x.trim()).join('\n\n').trim();
  };
  const questions = body(h1, h2)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
  const guide = { lead: paras.slice(0, h1).join('\n\n'), questions, activity: body(h2, h3), prayer: body(h3, headerAt[3] ?? paras.length) };
  return questions.length && guide.activity && guide.prayer ? guide : null;
}

/** Versão que conduz a mesa: a da criança mais nova presente, ou a primeira disponível. */
export function guideVersion(perChild: { version: KidsVersion | null }[], all: KidsVersion[]): KidsVersion | null {
  const order = ['4-6', '7-10', '11-13'];
  const present = perChild.map((p) => p.version).filter((v): v is KidsVersion => !!v);
  const pool = present.length ? present : all;
  return [...pool].sort((a, b) => order.indexOf(a.band) - order.indexOf(b.band))[0] ?? null;
}

/** Quem lê a passagem: os adultos se revezam, um por dia. */
export function readerForDay(adults: string[], dayKey: number): string | null {
  if (!adults.length) return null;
  return adults[((dayKey % adults.length) + adults.length) % adults.length];
}

/** Para cada criança presente, a versão aprovada da faixa dela (ou nenhuma). */
export function versionsForChildren<C extends { id: string; band: Band }>(
  children: C[],
  present: Set<string>,
  versions: KidsVersion[],
): { child: C; version: KidsVersion | null }[] {
  return children
    .filter((c) => present.has(c.id))
    .map((child) => ({ child, version: versions.find((v) => v.band === child.band) ?? null }));
}

/** Passos exibidos: sem crianças com versão, a etapa "para as crianças" não pesa no roteiro. */
export function stepsFor(): readonly RitualStep[] {
  return RITUAL_STEPS;
}

/** Cabe tanto texto numa tela de leitura em voz alta antes de a próxima ideia ir para outra tela. */
export const PAGE_CHARS = 640;

/**
 * Junta as linhas de um parágrafo que só foram quebradas na largura do editor (sem linha em branco).
 * Listas ("- item", "1. item") mantêm uma linha por item.
 */
const unwrap = (p: string) => (/^\s*(?:[-•*]|\d+[.)])\s/m.test(p) ? p : p.replace(/\s*\r?\n\s*/g, ' '));

/** Parágrafos de um texto simples (linha em branco separa; quebra simples no meio da frase não vira linha nova). */
export function plainBlocks(text: string | null | undefined): string[] {
  return (text ?? '').split(/(?:\r?\n\s*){2,}/).map((p) => unwrap(p.trim())).filter(Boolean);
}

/** Blocos de um texto editorial: cada parágrafo, lista ou citação é um bloco (HTML). Texto simples vira parágrafos. */
export function htmlBlocks(html: string | null | undefined): string[] {
  const raw = (html ?? '').trim();
  if (!raw) return [];
  if (!/<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(raw)) return plainBlocks(raw).map((p) => `<p>${p}</p>`);
  if (typeof DOMParser === 'undefined') return raw.match(/<(p|div|h[1-6]|ul|ol|blockquote)\b[\s\S]*?<\/\1>/gi) ?? [raw];
  const body = new DOMParser().parseFromString(`<body>${raw}</body>`, 'text/html').body;
  const out: string[] = [];
  body.childNodes.forEach((n) => {
    if (n.nodeType === 1) out.push((n as Element).outerHTML);
    else if (n.nodeType === 3 && n.textContent?.trim()) out.push(`<p>${n.textContent.trim()}</p>`);
  });
  return out.length ? out : [raw];
}

const textLength = (block: string) => block.replace(/<[^>]+>/g, '').length;

/** Frases de um parágrafo; uma frase maior que `max` (rara) cai em grupos de palavras. */
function sentencesOf(inner: string, max: number): string[] {
  const out: string[] = [];
  for (const sentence of inner.split(/(?<=[.!?…])\s+/)) {
    if (sentence.length <= max) { out.push(sentence); continue; }
    let cur = '';
    for (const w of sentence.split(/\s+/)) {
      if (cur && cur.length + w.length + 1 > max) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
    }
    if (cur) out.push(cur);
  }
  return out;
}

/**
 * Agrupa blocos em telas usando a medida real do aparelho: `fits(tela, índice)` diz se aquela tela cabe.
 * Cada tela enche até onde cabe e termina sempre em frase completa: um parágrafo que não cabe no que sobra
 * continua na tela seguinte, sempre no fim de uma frase. Listas e citações não são divididas.
 */
export function paginateFit(blocks: string[], fits: (page: string[], index: number) => boolean): string[][] {
  const pages: string[][] = [];
  let cur: string[] = [];
  const flush = () => { if (cur.length) pages.push(cur); cur = []; };
  for (const b of blocks) {
    if (fits([...cur, b], pages.length)) { cur.push(b); continue; }
    const wrapped = /^<p>([\s\S]*)<\/p>$/i.exec(b);
    const inner = wrapped ? wrapped[1] : b;
    if (/<\/?(?:p|ul|ol|li|blockquote|div|h[1-6])\b/i.test(inner)) { flush(); cur.push(b); continue; }
    const wrap = (t: string) => (wrapped ? `<p>${t}</p>` : t);
    let chunk = '';
    for (const sentence of sentencesOf(inner, Infinity)) {
      const trial = chunk ? `${chunk} ${sentence}` : sentence;
      if (fits([...cur, wrap(trial)], pages.length)) { chunk = trial; continue; }
      if (chunk) cur.push(wrap(chunk));
      flush();
      chunk = sentence;
    }
    if (chunk) cur.push(wrap(chunk));
  }
  flush();
  return pages;
}

/**
 * Agrupa blocos em telas de até `max` caracteres (a primeira, que leva o versículo, até `firstMax`).
 * Cada tela termina em parágrafo completo: um parágrafo que não cabe no que sobra vai inteiro para a tela
 * seguinte. Só um parágrafo maior que uma tela inteira é dividido, sempre no fim de uma frase.
 */
export function paginate(blocks: string[], max = PAGE_CHARS, firstMax = max): string[][] {
  const pages: string[][] = [];
  let cur: string[] = [];
  let len = 0;
  const limit = () => (pages.length === 0 ? firstMax : max);
  const flush = () => { if (cur.length) pages.push(cur); cur = []; len = 0; };
  for (const b of blocks) {
    const l = textLength(b);
    if (len + l <= limit()) { cur.push(b); len += l; continue; }
    const wrapped = /^<p>([\s\S]*)<\/p>$/i.exec(b);
    const inner = wrapped ? wrapped[1] : b;
    const splittable = !/<\/?(?:p|ul|ol|li|blockquote|div|h[1-6])\b/i.test(inner);
    if (cur.length && (l <= max || !splittable)) { flush(); cur.push(b); len = l; continue; }
    if (!splittable) { cur.push(b); len += l; continue; }
    const wrap = (t: string) => (wrapped ? `<p>${t}</p>` : t);
    let chunk = '';
    for (const sentence of sentencesOf(inner, Math.min(max, firstMax))) {
      const room = limit() - len;
      if (chunk && chunk.length + 1 + sentence.length > room) { cur.push(wrap(chunk)); flush(); chunk = sentence; continue; }
      if (!chunk && cur.length && sentence.length > room) flush();
      chunk = chunk ? `${chunk} ${sentence}` : sentence;
    }
    if (chunk) { cur.push(wrap(chunk)); len += chunk.length; }
  }
  flush();
  return pages;
}

/**
 * Quanto texto cabe numa tela deste aparelho (letra de ~4,4vw, entre 16 e 18,4px, linha 1,7).
 * A primeira tela também leva o cartão do versículo, por isso cabe menos.
 */
export function pageBudget(width: number, height: number): { max: number; first: number } {
  const font = Math.min(18.4, Math.max(16, width * 0.044));
  // Sobra a altura menos topo, rodapé e margens (~330px); o cartão do versículo ocupa ~4 linhas da primeira tela.
  const lines = Math.max(6, Math.floor((height - 330) / (font * 1.7)));
  const cols = Math.max(20, (Math.min(width, 512) - 48) / (font * 0.55));
  const fit = (n: number) => Math.max(140, Math.min(PAGE_CHARS, Math.floor(n * cols * 0.9)));
  return { max: fit(lines), first: fit(lines - 4) };
}
