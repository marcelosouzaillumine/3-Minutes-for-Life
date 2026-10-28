import { addDaysToKey } from './date';

export interface ProgressRow {
  readAt?: string | null;
  completedAt?: string | null;
}

export interface JourneySummary {
  /** Dias seguidos até hoje (ou até ontem: o dia de hoje ainda pode ser lido). */
  currentStreak: number;
  longestStreak: number;
  /** Dias distintos com leitura. */
  totalDays: number;
  /** Dias distintos com leitura no mês corrente. */
  daysThisMonth: number;
  /** Devocionais concluídos (botão Concluir) no mês corrente. */
  completedThisMonth: number;
  readToday: boolean;
}

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** AAAA-MM-DD no fuso de São Paulo, o mesmo critério do devocional do dia. */
export function dayKey(value: string | Date): string {
  return dayFormatter.format(typeof value === 'string' ? new Date(value) : value);
}

const addDays = addDaysToKey;

export function summarizeJourney(rows: ProgressRow[], today: string): JourneySummary {
  const readDays = new Set<string>();
  let completedThisMonth = 0;
  const month = today.slice(0, 7);

  for (const row of rows) {
    if (row.readAt) readDays.add(dayKey(row.readAt));
    if (row.completedAt && dayKey(row.completedAt).startsWith(month)) completedThisMonth++;
  }

  const sorted = [...readDays].sort();

  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = day;
  }

  // Sem culpa: se ainda não leu hoje, a sequência de ontem segue viva.
  const readToday = readDays.has(today);
  let cursor = readToday ? today : addDays(today, -1);
  let currentStreak = 0;
  while (readDays.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  return {
    currentStreak,
    longestStreak,
    totalDays: readDays.size,
    daysThisMonth: sorted.filter((d) => d.startsWith(month)).length,
    completedThisMonth,
    readToday,
  };
}
