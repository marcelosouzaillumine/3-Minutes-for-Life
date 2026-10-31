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
export const PAGE_CHARS = 520;

/** Parágrafos de um texto simples (linha em branco separa). */
export function plainBlocks(text: string | null | undefined): string[] {
  return (text ?? '').split(/(?:\r?\n\s*){2,}/).map((p) => p.trim()).filter(Boolean);
}

/** Blocos de um texto editorial: cada parágrafo, lista ou citação é um bloco (HTML). Texto simples vira parágrafos. */
export function htmlBlocks(html: string | null | undefined): string[] {
  const raw = (html ?? '').trim();
  if (!raw) return [];
  if (!/<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(raw)) return plainBlocks(raw).map((p) => `<p>${p.replace(/\r?\n/g, '<br/>')}</p>`);
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

/** Quebra um bloco maior que `max` em frases (e, se uma frase sozinha passar, em palavras), mantendo o formato do bloco. */
function splitLong(block: string, max: number): string[] {
  if (textLength(block) <= max) return [block];
  const wrapped = /^<p>([\s\S]*)<\/p>$/i.exec(block);
  const inner = wrapped ? wrapped[1] : block;
  if (/<\/?(?:p|ul|ol|li|blockquote|div|h[1-6])\b/i.test(inner)) return [block];
  const wrap = (t: string) => (wrapped ? `<p>${t}</p>` : t);
  const pieces: string[] = [];
  for (const sentence of inner.split(/(?<=[.!?…:;])\s+/)) {
    if (sentence.length <= max) { pieces.push(sentence); continue; }
    let cur = '';
    for (const w of sentence.split(/\s+/)) {
      if (cur && cur.length + w.length + 1 > max) { pieces.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
    }
    if (cur) pieces.push(cur);
  }
  const out: string[] = [];
  let cur = '';
  for (const piece of pieces) {
    if (cur && cur.length + piece.length + 1 > max) { out.push(wrap(cur)); cur = piece; } else cur = cur ? `${cur} ${piece}` : piece;
  }
  if (cur) out.push(wrap(cur));
  return out;
}

/**
 * Agrupa blocos em telas de até `max` caracteres (a primeira, que leva o versículo, até `firstMax`).
 * Parágrafo maior que o limite é quebrado em frases: nenhuma tela deve passar do que cabe.
 */
export function paginate(blocks: string[], max = PAGE_CHARS, firstMax = max): string[][] {
  const pages: string[][] = [];
  let cur: string[] = [];
  let len = 0;
  const limit = () => (pages.length === 0 ? firstMax : max);
  for (const b of blocks.flatMap((x) => splitLong(x, Math.min(max, firstMax)))) {
    const l = textLength(b);
    if (cur.length && len + l > limit()) { pages.push(cur); cur = []; len = 0; }
    cur.push(b); len += l;
  }
  if (cur.length) pages.push(cur);
  return pages;
}

/**
 * Quanto texto cabe numa tela deste aparelho (letra de ~4,4vw, entre 16 e 18,4px, linha 1,7).
 * A primeira tela também leva o cartão do versículo, por isso cabe menos.
 */
export function pageBudget(width: number, height: number): { max: number; first: number } {
  const font = Math.min(18.4, Math.max(16, width * 0.044));
  const lines = Math.max(6, Math.floor((height - 340) / (font * 1.7)));
  const cols = Math.max(20, (Math.min(width, 512) - 48) / (font * 0.62));
  const fit = (n: number) => Math.max(140, Math.min(PAGE_CHARS, Math.floor(n * cols * 0.85)));
  return { max: fit(lines), first: fit(lines - 7) };
}
