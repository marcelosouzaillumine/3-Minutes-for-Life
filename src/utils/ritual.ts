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
