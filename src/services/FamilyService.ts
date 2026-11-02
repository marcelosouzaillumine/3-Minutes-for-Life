import { illumineFetch } from '../lib/illumine';
import { getTodayInSaoPaulo } from '../utils/date';

export type Band = '0-3' | '4-6' | '7-10' | '11-13';
export const BANDS: Band[] = ['0-3', '4-6', '7-10', '11-13'];

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
  coverUrl?: string | null;
  partnerKeyId?: string | null;
  items?: { id: string; title: string }[];
}

export interface Family {
  id: string;
  name: string;
  meetingTime: string | null;
  role: 'owner' | 'adult';
  inviteCode: string;
  members: { displayName: string | null; role: string; isMe: boolean; readToday: boolean }[];
  children: { id: string; nickname: string; band: Band; readToday?: boolean; daysRead?: number }[];
  week: Week;
  plan: PlanState | null;
}

/** Quadro de uma história em quadrinhos: arte (igual em todos os idiomas), legenda e, às vezes, a fala de um personagem. */
export interface KidPanel { image: string; caption: string; speech?: string }
/** História da faixa: quadrinhos (0-3, 4-6, 7-10) ou dilema com debate (11-13). Vem pronta para o idioma pedido. */
export type KidStory =
  | { format: 'panels'; panels: KidPanel[] }
  | {
      format: 'dilemma';
      image?: string;
      /** Uma imagem por momento (situação, decisão, desfecho, "E hoje?"), na ordem. */
      images?: string[];
      /** Passagem bíblica da história (ex.: "Lucas 10.38-42"), mostrada como selo na abertura. */
      reference?: string;
      /** Frase curta que aparece no cartão da faixa ao escolher a versão (até 100). Sem ela, vale a pergunta do dilema. */
      teaser?: string;
      setup: string; question: string; options: string[];
      outcome: string; quote?: string;
      /** De onde vem a citação (ex.: "Lucas 10.42" ou "Martinho Lutero"). */
      quoteSource?: string; outcomeQuestion: string;
      today: string; todayQuestion: string;
    };

export interface KidsVersion {
  band: Band;
  title?: string | null;
  scriptureFocus: string | null;
  whatItSays: string;
  thinkAbout: string;
  practice: string;
  prayer: string;
  adultGuide: string;
  /** Ilustração da faixa (https), cadastrada pelo conector editorial. */
  imageUrl?: string | null;
  /** Quando existe, a leitura usa a história; o texto corrido (whatItSays) fica de reserva. */
  story?: KidStory | null;
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

// Grupo ativo: a pessoa pode estar em vários, e as telas trabalham com um de cada vez.
const ACTIVE_KEY = 'family:active';
export const activeFamily = {
  get(): string | null { try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; } },
  set(id: string | null) {
    try { if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY); } catch { /* sem armazenamento */ }
    window.dispatchEvent(new CustomEvent('family:changed'));
  },
};

export interface FamilyNotice {
  id: string;
  familyId: string;
  familyName: string;
  kind: string;
  day: string;
  data: { by?: string | null; mode?: string; family?: string } | null;
  createdAt: string;
  read: boolean;
}

export interface FamilySummary { id: string; name: string; role: 'owner' | 'adult'; members: number; children: number }

async function call(path: string, init?: RequestInit): Promise<any> {
  const active = path.startsWith('/families/me') ? activeFamily.get() : null;
  const query = `date=${getTodayInSaoPaulo()}${active ? `&familyId=${encodeURIComponent(active)}` : ''}`;
  const res = await illumineFetch(`${path}${path.includes('?') ? '&' : '?'}${query}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new FamilyError(body?.error ?? String(res.status));
  return body;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body !== undefined && { body: JSON.stringify(body) }) });

/** Link que a pessoa manda por mensagem; quem abre cai no app e entra com o código. */
export const inviteLink = (code: string) => `${window.location.origin}/f/${code}`;

export const FamilyService = {
  async get(): Promise<Family | null> {
    const f = (await call('/families/me')).family ?? null;
    // O grupo guardado deixou de existir (apagado ou saída): volta para o mais antigo.
    if (!f && activeFamily.get()) { activeFamily.set(null); return (await call('/families/me')).family ?? null; }
    return f;
  },
  /** Todos os grupos da pessoa e o máximo permitido. */
  async list(): Promise<{ families: FamilySummary[]; max: number }> {
    const body = await call('/families');
    return { families: body.families ?? [], max: body.max ?? 5 };
  },
  async create(name: string, meetingTime?: string): Promise<Family> {
    const f = (await call('/families', json('POST', { name, meetingTime: meetingTime || undefined }))).family;
    activeFamily.set(f.id);
    return f;
  },
  async join(code: string): Promise<Family> {
    const f = (await call('/families/join', json('POST', { code }))).family;
    activeFamily.set(f.id);
    return f;
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
    activeFamily.set(null);
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
  /** Leitura na mesa: registra os adultos presentes (posição em `members`) e avisa o grupo. */
  async readTogether(devotionalId: string, present: number[], children: string[] = []): Promise<Family> {
    return (await call('/families/me/read-together', json('POST', { devotionalId, present, children }))).family;
  },
  async notices(): Promise<{ notices: FamilyNotice[]; unread: number }> {
    const b = await call('/families/me/notices');
    return { notices: b.notices ?? [], unread: b.unread ?? 0 };
  },
  async markNoticesRead(): Promise<void> {
    await call('/families/me/notices/read', json('POST'));
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
  story?: KidStory | null;
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
        ? { title: v.title ?? '', scriptureFocus: v.scriptureFocus ?? '', whatItSays: v.whatItSays, thinkAbout: v.thinkAbout, practice: v.practice, prayer: v.prayer, adultGuide: v.adultGuide, story: v.story ?? null, status: v.status }
        : null;
    }
    return out;
  },
  async saveKids(devotionalId: string, band: Band, d: KidsDraft, language = 'pt-BR'): Promise<boolean> {
    const res = await illumineFetch(`/devotionals/${encodeURIComponent(devotionalId)}/kids/${band}`, {
      method: 'PUT',
      body: JSON.stringify({ ...d, title: d.title.trim() || null, scriptureFocus: d.scriptureFocus.trim() || null, story: d.story ?? null, language }),
    });
    return res.ok;
  },
  async templates(): Promise<PlanTemplate[]> {
    const res = await illumineFetch('/families/templates/admin');
    return res.ok ? (await res.json()).templates ?? [] : [];
  },
  async saveTemplate(id: string | null, body: { title: string; description: string; themeWord: string; items: string[]; status: 'draft' | 'published'; categoryId?: string | null; coverUrl?: string | null; partnerKeyId?: string | null }): Promise<{ ok: true; template: PlanTemplate } | { ok: false; error: string }> {
    const res = await illumineFetch(id ? `/families/templates/${encodeURIComponent(id)}` : '/families/templates', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, template: data } : { ok: false, error: data?.error ?? String(res.status) };
  },
  async partners(): Promise<{ id: string; name: string }[]> {
    const res = await illumineFetch('/families/partners');
    return res.ok ? (await res.json()).partners ?? [] : [];
  },
  async deleteTemplate(id: string): Promise<boolean> {
    return (await illumineFetch(`/families/templates/${encodeURIComponent(id)}`, { method: 'DELETE' })).ok;
  },
};
