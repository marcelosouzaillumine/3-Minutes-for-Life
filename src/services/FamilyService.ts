import { illumineFetch } from '../lib/illumine';
import { getTodayInSaoPaulo } from '../utils/date';

export type Band = '4-6' | '7-10' | '11-13';
export const BANDS: Band[] = ['4-6', '7-10', '11-13'];

export interface PlanDay { day: number; devotionalId: string; title: string; readers: number; done: boolean; together: boolean }
export interface PlanState {
  title: string | null;
  word: string | null;
  startedAt: string;
  days: PlanDay[];
  currentDay: number;
  completed: boolean;
  lockedUntilTomorrow?: boolean;
  daysRead: number;
  daysTogether: number;
  summary: { daysTogether: number; daysRead: number; total: number; word: string | null; prayersOrdered: number } | null;
}
export interface Week { days: { date: string; read: boolean }[]; streak: number }
export interface PlanTemplate {
  id: string;
  title: string;
  description: string;
  themeWord: string;
  status: 'draft' | 'published';
  days: number;
  categoryId?: string | null;
  items?: { id: string; title: string }[];
}

export interface Family {
  id: string;
  name: string;
  meetingTime: string | null;
  role: 'owner' | 'adult';
  inviteCode: string;
  members: { displayName: string | null; role: string; isMe: boolean; readToday: boolean }[];
  children: { id: string; nickname: string; band: Band }[];
  week: Week;
  plan: PlanState | null;
}

export interface KidsVersion {
  band: Band;
  title?: string | null;
  scriptureFocus: string | null;
  whatItSays: string;
  thinkAbout: string;
  practice: string;
  prayer: string;
  adultGuide: string;
  status: 'draft' | 'published';
}

export interface FamilyPrayer {
  id: string;
  authorName: string | null;
  text: string;
  createdAt: string;
  mine: boolean;
  canDelete: boolean;
  prayedCount: number;
  prayedByMe: boolean;
}

export class FamilyError extends Error {
  code: string;
  constructor(code: string) { super(code); this.code = code; }
}

async function call(path: string, init?: RequestInit): Promise<any> {
  const res = await illumineFetch(`${path}${path.includes('?') ? '&' : '?'}date=${getTodayInSaoPaulo()}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new FamilyError(body?.error ?? String(res.status));
  return body;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body !== undefined && { body: JSON.stringify(body) }) });

/** Link que a pessoa manda por mensagem; quem abre cai no app e entra com o código. */
export const inviteLink = (code: string) => `${window.location.origin}/f/${code}`;

export const FamilyService = {
  async get(): Promise<Family | null> {
    return (await call('/families/me')).family ?? null;
  },
  async create(name: string, meetingTime?: string): Promise<Family> {
    return (await call('/families', json('POST', { name, meetingTime: meetingTime || undefined }))).family;
  },
  async join(code: string): Promise<Family> {
    return (await call('/families/join', json('POST', { code }))).family;
  },
  async update(name: string, meetingTime: string): Promise<Family> {
    return (await call('/families/me', json('PATCH', { name, meetingTime }))).family;
  },
  async templates(): Promise<PlanTemplate[]> {
    return (await call('/families/templates')).templates ?? [];
  },
  async setPlan(templateId: string): Promise<Family> {
    return (await call('/families/me/plan', json('PUT', { templateId }))).family;
  },
  async clearPlan(): Promise<Family> {
    return (await call('/families/me/plan', json('DELETE'))).family;
  },
  async leave(): Promise<void> {
    await call('/families/me', json('DELETE'));
  },
  async rotateInvite(): Promise<Family> {
    return (await call('/families/me/invite/rotate', json('POST'))).family;
  },
  async addChild(nickname: string, band: Band): Promise<Family> {
    return (await call('/families/me/children', json('POST', { nickname, band }))).family;
  },
  async removeChild(id: string): Promise<Family> {
    return (await call(`/families/me/children/${encodeURIComponent(id)}`, json('DELETE'))).family;
  },
  async prayers(): Promise<FamilyPrayer[]> {
    return (await call('/families/me/prayers')).prayers ?? [];
  },
  async addPrayer(text: string): Promise<FamilyPrayer[]> {
    return (await call('/families/me/prayers', json('POST', { text }))).prayers ?? [];
  },
  async removePrayer(id: string): Promise<FamilyPrayer[]> {
    return (await call(`/families/me/prayers/${encodeURIComponent(id)}`, json('DELETE'))).prayers ?? [];
  },
  async togglePrayed(id: string): Promise<FamilyPrayer[]> {
    return (await call(`/families/me/prayers/${encodeURIComponent(id)}/pray`, json('POST'))).prayers ?? [];
  },
  /** Versões infantis aprovadas do devocional (vazio quando ainda não existem). */
  async getKids(devotionalId: string, language: string): Promise<KidsVersion[]> {
    try {
      const res = await illumineFetch(`/devotionals/${encodeURIComponent(devotionalId)}/kids?language=${encodeURIComponent(language)}`);
      if (!res.ok) return [];
      return (await res.json()).versions ?? [];
    } catch {
      return [];
    }
  },
};

// Código recebido por link, guardado até a pessoa entrar na conta.
const PENDING_KEY = 'family:pending-code';
export const pendingFamilyCode = {
  set(code: string) { try { localStorage.setItem(PENDING_KEY, code); } catch { /* sem armazenamento */ } },
  get(): string | null { try { return localStorage.getItem(PENDING_KEY); } catch { return null; } },
  clear() { try { localStorage.removeItem(PENDING_KEY); } catch { /* idem */ } },
};

// ─── Admin: conteúdo da família ────────────────────────────────────────────

export interface KidsDraft {
  title: string;
  scriptureFocus: string;
  whatItSays: string;
  thinkAbout: string;
  practice: string;
  prayer: string;
  adultGuide: string;
  status: 'draft' | 'published';
}

export interface PlanCategoryAdmin { id: string; name: string; description: string; isFamily: boolean; sortOrder: number; plans: number }

export const FamilyAdmin = {
  async categories(): Promise<PlanCategoryAdmin[]> {
    const res = await illumineFetch('/plans/categories/admin');
    return res.ok ? (await res.json()).categories ?? [] : [];
  },
  async saveCategory(id: string | null, body: { name: string; description: string; sortOrder: number }): Promise<{ ok: boolean; error?: string }> {
    const res = await illumineFetch(id ? `/plans/categories/${encodeURIComponent(id)}` : '/plans/categories', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    return res.ok ? { ok: true } : { ok: false, error: (await res.json().catch(() => ({})))?.error ?? String(res.status) };
  },
  async deleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
    const res = await illumineFetch(`/plans/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.ok ? { ok: true } : { ok: false, error: (await res.json().catch(() => ({})))?.error ?? String(res.status) };
  },
  async kidsSummary(language = 'pt-BR'): Promise<Record<string, { draft: number; published: number }>> {
    const res = await illumineFetch(`/devotionals/kids-summary?language=${encodeURIComponent(language)}`);
    return res.ok ? (await res.json()).summary ?? {} : {};
  },
  async getKids(devotionalId: string, language = 'pt-BR'): Promise<Record<Band, KidsDraft | null>> {
    const res = await illumineFetch(`/devotionals/${encodeURIComponent(devotionalId)}/kids/admin`);
    const versions: any[] = res.ok ? (await res.json()).versions ?? [] : [];
    const out = {} as Record<Band, KidsDraft | null>;
    for (const b of BANDS) {
      const v = versions.find((x) => x.band === b && (x.language ?? 'pt-BR') === language);
      out[b] = v
        ? { title: v.title ?? '', scriptureFocus: v.scriptureFocus ?? '', whatItSays: v.whatItSays, thinkAbout: v.thinkAbout, practice: v.practice, prayer: v.prayer, adultGuide: v.adultGuide, status: v.status }
        : null;
    }
    return out;
  },
  async saveKids(devotionalId: string, band: Band, d: KidsDraft, language = 'pt-BR'): Promise<boolean> {
    const res = await illumineFetch(`/devotionals/${encodeURIComponent(devotionalId)}/kids/${band}`, {
      method: 'PUT',
      body: JSON.stringify({ ...d, title: d.title.trim() || null, scriptureFocus: d.scriptureFocus.trim() || null, language }),
    });
    return res.ok;
  },
  async templates(): Promise<PlanTemplate[]> {
    const res = await illumineFetch('/families/templates/admin');
    return res.ok ? (await res.json()).templates ?? [] : [];
  },
  async saveTemplate(id: string | null, body: { title: string; description: string; themeWord: string; items: string[]; status: 'draft' | 'published'; categoryId?: string | null }): Promise<{ ok: true; template: PlanTemplate } | { ok: false; error: string }> {
    const res = await illumineFetch(id ? `/families/templates/${encodeURIComponent(id)}` : '/families/templates', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, template: data } : { ok: false, error: data?.error ?? String(res.status) };
  },
  async deleteTemplate(id: string): Promise<boolean> {
    return (await illumineFetch(`/families/templates/${encodeURIComponent(id)}`, { method: 'DELETE' })).ok;
  },
};
