import type { Band, KidsVersion } from '../services/FamilyService';

export const RITUAL_STEPS = ['welcome', 'scripture', 'story', 'practice', 'prayer', 'done'] as const;
export type RitualStep = (typeof RITUAL_STEPS)[number];

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
