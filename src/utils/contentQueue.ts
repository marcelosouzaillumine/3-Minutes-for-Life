// Fila de conteúdo: quantos dias à frente já têm devocional publicado, sem buracos.
// O alerta existe para que nunca chegue o dia em que o devocional do dia não existe.

export const QUEUE_TARGET_DAYS = 14;

export interface QueueStatus {
  /** dias seguidos, a partir de hoje, que já têm devocional (0 = hoje não tem) */
  covered_days: number;
  /** primeira data sem devocional a partir de hoje (YYYY-MM-DD) */
  first_gap: string;
  /** datas sem devocional dentro da meta (para a equipe saber o que falta escrever) */
  missing: string[];
  level: 'ok' | 'warning' | 'critical';
}

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function queueStatus(publicationDates: readonly string[], today: string, target = QUEUE_TARGET_DAYS): QueueStatus {
  const have = new Set(publicationDates.map((d) => d.slice(0, 10)));
  let covered = 0;
  while (covered < 365 && have.has(addDays(today, covered))) covered++;
  const missing: string[] = [];
  for (let i = 0; i < target; i++) {
    const day = addDays(today, i);
    if (!have.has(day)) missing.push(day);
  }
  return {
    covered_days: covered,
    first_gap: addDays(today, covered),
    missing,
    level: covered >= target ? 'ok' : covered >= 3 ? 'warning' : 'critical',
  };
}
