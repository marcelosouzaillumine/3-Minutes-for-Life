import { illumineFetch } from '../lib/illumine';

export interface PlanCard {
  id: string;
  title: string;
  description: string;
  themeWord: string;
  days: number;
  started: boolean;
  daysRead: number;
  currentDay: number;
  completed: boolean;
}
export interface PlanCategoryGroup { id: string; name: string; description: string; plans: PlanCard[] }
export interface PlanDetail {
  id: string;
  title: string;
  description: string;
  themeWord: string;
  category: string;
  started: boolean;
  currentDay: number;
  daysRead: number;
  completed: boolean;
  days: { day: number; devotionalId: string; title: string; done: boolean }[];
}

/** Planos para todos, agrupados por categoria. O andamento sai das leituras da própria pessoa. */
export const PlansService = {
  async list(): Promise<PlanCategoryGroup[]> {
    try {
      const res = await illumineFetch('/plans');
      return res.ok ? (await res.json()).categories ?? [] : [];
    } catch {
      return [];
    }
  },
  async get(id: string): Promise<PlanDetail | null> {
    try {
      const res = await illumineFetch(`/plans/${encodeURIComponent(id)}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },
  async start(id: string): Promise<boolean> {
    return (await illumineFetch(`/plans/${encodeURIComponent(id)}/start`, { method: 'POST' })).ok;
  },
  async stop(id: string): Promise<boolean> {
    return (await illumineFetch(`/plans/${encodeURIComponent(id)}/start`, { method: 'DELETE' })).ok;
  },
};
