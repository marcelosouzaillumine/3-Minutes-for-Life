// Planos de 7 e 21 dias. Cada plano é um tema: o acervo escolhe os devocionais que mais conversam
// com ele (mesma busca da biblioteca), sem etiquetar nada à mão. Os dias ficam estáveis enquanto o
// acervo não muda; ao publicar novos devocionais, os planos se enriquecem sozinhos.
import { searchMoments, type SearchableDevotional } from './momentSearch';

export interface PlanDef {
  id: string;
  days: number;
  /** frases de busca do tema; os dias alternam entre elas para o plano não ficar monótono */
  queries: string[];
}

export const PLANS: PlanDef[] = [
  { id: 'descanso-7', days: 7, queries: ['cansaço descanso forças', 'ansiedade preocupação', 'paz confiança'] },
  { id: 'confianca-21', days: 21, queries: ['confiança fé esperança', 'oração', 'paciência espera', 'gratidão', 'recomeço mudança'] },
];

export interface PlanDay<T> {
  day: number;
  devotional: T;
}

/** Devocionais do plano, na ordem dos dias. Menos que `days` quando o acervo ainda não tem o bastante. */
export function buildPlan<T extends SearchableDevotional>(plan: PlanDef, library: readonly T[]): PlanDay<T>[] {
  const lists = plan.queries.map((q) => searchMoments(q, library, plan.days * 2).map((m) => m.devotional));
  const used = new Set<string>();
  const out: PlanDay<T>[] = [];
  for (let round = 0; out.length < plan.days; round++) {
    let progressed = false;
    for (const list of lists) {
      const next = list.slice(round).find((d) => !used.has(d.id));
      if (!next) continue;
      progressed = true;
      used.add(next.id);
      out.push({ day: out.length + 1, devotional: next });
      if (out.length === plan.days) break;
    }
    if (!progressed) break;
  }
  return out;
}
