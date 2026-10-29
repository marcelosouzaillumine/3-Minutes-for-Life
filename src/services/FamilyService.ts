import { illumineFetch } from '../lib/illumine';
import { getTodayInSaoPaulo } from '../utils/date';

export type Band = '4-6' | '7-10' | '11-13';
export const BANDS: Band[] = ['4-6', '7-10', '11-13'];

export interface Family {
  id: string;
  name: string;
  meetingTime: string | null;
  role: 'owner' | 'adult';
  inviteCode: string;
  members: { displayName: string | null; role: string; isMe: boolean; readToday: boolean }[];
  children: { id: string; nickname: string; band: Band }[];
}

export interface KidsVersion {
  band: Band;
  scriptureFocus: string | null;
  whatItSays: string;
  thinkAbout: string;
  practice: string;
  prayer: string;
  adultGuide: string;
  status: 'draft' | 'published';
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
