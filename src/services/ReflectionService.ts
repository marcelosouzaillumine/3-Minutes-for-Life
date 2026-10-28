import { illumineFetch } from '../lib/illumine';

export interface PersonalReflection {
  id: string;
  user_id: string;
  devotional_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalReflectionWithDevotional extends PersonalReflection {
  devotionals?: { title: string; titles?: Record<string, string> };
}

function normalizeReflection(r: any): PersonalReflection {
  return {
    id: r.id,
    user_id: r.userId ?? r.user_id,
    devotional_id: r.devotionalId ?? r.devotional_id,
    content: r.content,
    created_at: r.createdAt ?? r.created_at,
    updated_at: r.updatedAt ?? r.updated_at,
  };
}

export const ReflectionService = {
  async getReflection(devotionalId: string): Promise<string | null> {
    const res = await illumineFetch(`/users/me/reflections?devotionalId=${encodeURIComponent(devotionalId)}`);
    if (!res.ok) return null;
    const rows: any[] = await res.json();
    return rows.length > 0 ? rows[0].content : null;
  },

  async getUserReflections(): Promise<PersonalReflectionWithDevotional[]> {
    const res = await illumineFetch('/users/me/reflections');
    if (!res.ok) return [];
    const rows: any[] = await res.json();
    return rows.map((r) => ({
      ...normalizeReflection(r),
      // O servidor devolve o devocional da anotação (título base e títulos por idioma).
      devotionals: r.devotional ? { title: r.devotional.title, titles: r.devotional.titles } : undefined,
    }));
  },

  async saveReflection(devotionalId: string, content: string): Promise<void> {
    const res = await illumineFetch(`/users/me/reflections/${encodeURIComponent(devotionalId)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to save reflection');
  },

  async deleteReflection(devotionalId: string): Promise<void> {
    const res = await illumineFetch(`/users/me/reflections/${encodeURIComponent(devotionalId)}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) throw new Error('Failed to delete reflection');
  },
};
